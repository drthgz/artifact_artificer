import { GoogleGenAI, Type } from "@google/genai";
import { 
  MODEL_FAST, 
  MODEL_REASONING, 
  MODEL_IMAGE_GEN, 
  MAX_THINKING_BUDGET,
  SYSTEM_INSTRUCTION_MENTOR,
  SYSTEM_INSTRUCTION_REVIEWER
} from "../constants";
import { LearningPath, Challenge } from "../types";

// Initialize the client
// Using a getter to ensure we grab the key if it's set later (though env is usually static)
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

/**
 * Generates a personalized learning path using Gemini 3 Pro with high thinking budget
 * for complex curriculum design.
 */
export const generateLearningPath = async (
  domain: string,
  tool: string,
  goal: string,
  level: string
): Promise<LearningPath> => {
  const ai = getAIClient();
  
  const prompt = `Create a detailed learning path for a ${level} student in ${domain} using ${tool}.
  Their specific goal is: "${goal}".
  
  The path should move from basic concepts to an advanced project.
  Structure the response as a JSON object strictly matching this schema:
  {
    "title": "string (Creative name for the path)",
    "description": "string (Short overview)",
    "totalXp": number,
    "steps": [
      {
        "id": "string (unique id)",
        "title": "string",
        "description": "string (detailed instructions)",
        "criteria": ["string", "string"],
        "xpReward": number
      }
    ]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: MAX_THINKING_BUDGET },
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const pathData = JSON.parse(text);
    
    // Enrich with local-only status fields
    pathData.id = Date.now().toString(); // Ensure ID
    pathData.steps = pathData.steps.map((s: any, index: number) => ({
      ...s,
      status: index === 0 ? 'active' : 'locked'
    }));

    return pathData as LearningPath;
  } catch (error) {
    console.error("Failed to generate path:", error);
    throw error;
  }
};

/**
 * Reviews a user's uploaded work against the step criteria.
 * Uses Gemini 3 Pro (Multimodal) to analyze the image.
 */
export const reviewSubmission = async (
  imageFile: File,
  stepDescription: string,
  criteria: string[]
): Promise<{ passed: boolean; feedback: string }> => {
  const ai = getAIClient();

  // Convert File to Base64
  const base64Data = await fileToBase64(imageFile);

  const prompt = `
  Task: Review this user submission for a CAD/Art learning app.
  Context: The user was asked to: "${stepDescription}".
  Success Criteria:
  ${criteria.map(c => `- ${c}`).join('\n')}

  Analyze the attached image. Does it meet the criteria?
  Start your response with valid JSON:
  {
    "passed": boolean,
    "feedback": "string (constructive feedback, keep it encouraging but strict)"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_REASONING, // Use Pro for image analysis reasoning
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REVIEWER,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Submission review failed:", error);
    return { passed: false, feedback: "AI Review service unavailable. Please try again." };
  }
};

/**
 * Generates a Daily Challenge with a Reference Image using Gemini 2.5 Flash Image.
 */
export const generateDailyChallenge = async (domain: string, tool: string): Promise<Challenge> => {
  const ai = getAIClient();

  // Step 1: Design the challenge (text)
  const designPrompt = `Design a fun, daily challenge for a ${domain} user using ${tool}. 
  It should be a specific object or scene.
  Output JSON:
  {
    "title": "string",
    "theme": "string",
    "description": "string",
    "imagePrompt": "string (a descriptive prompt to generate a reference image for this object)",
    "goldTime": number (minutes, aggressive estimate),
    "silverTime": number (minutes, average estimate),
    "bronzeTime": number (minutes, relaxed estimate)
  }`;

  let design;
  try {
    const designResp = await ai.models.generateContent({
        model: MODEL_FAST, // Flash is fine for brainstorming
        contents: designPrompt,
        config: { responseMimeType: "application/json" }
    });
    design = JSON.parse(designResp.text || "{}");
  } catch (e) {
      console.error("Failed to generate challenge text", e);
      // Fallback design
      design = {
          title: "Speed Modeling",
          theme: "Abstract",
          description: "Create a simple abstract shape that demonstrates flow.",
          imagePrompt: "Abstract 3d shape floating in void, colorful",
          goldTime: 10, silverTime: 20, bronzeTime: 30
      };
  }

  // Step 2: Generate the Reference Image
  let imageUrl = "";
  try {
    // Attempt image generation with Gemini 2.5 Flash Image
    // Note: Flash Image does not support imageSize or responseMimeType/Schema
    const imageResp = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: {
        parts: [{ text: design.imagePrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            // imageSize is NOT supported for Flash Image, removed.
        }
      }
    });

    // Extract image
    for (const part of imageResp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    
    // Fallback if no inline data found but no error
    if (!imageUrl) throw new Error("No image data returned from model");

  } catch (e) {
    console.warn("Image generation failed or not permitted, using placeholder", e);
    // Use a reliable placeholder service if generation fails
    imageUrl = `https://placehold.co/600x600/20BEFF/ffffff?text=${encodeURIComponent(design.title)}`;
  }

  return {
    id: Date.now().toString(),
    title: design.title,
    theme: design.theme,
    description: design.description,
    referenceImageUrl: imageUrl,
    goldTime: design.goldTime,
    silverTime: design.silverTime,
    bronzeTime: design.bronzeTime
  };
};

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
    const ai = getAIClient();
    // Strip prefix if present in base64Image (data:image/xxx;base64,...)
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    try {
      const response = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN,
          contents: {
              parts: [
                  { 
                      inlineData: { 
                          mimeType: 'image/png', // Model is robust to mime types
                          data 
                      } 
                  },
                  { text: prompt }
              ]
          },
          config: {
               imageConfig: { aspectRatio: '1:1' }
          }
      });
      
      // Find image part in response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      throw new Error("No image generated");
    } catch (error) {
      console.error("Edit image failed", error);
      throw error;
    }
}

/**
 * Generates a specific technical hint for the current challenge.
 */
export const generateHint = async (tool: string, challenge: Challenge): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Give a short, precise technical hint for a user using ${tool} to create: "${challenge.title}".
  Description: ${challenge.description}.
  Focus on a specific workflow, modifier, or shortcut that saves time.
  Keep it under 30 words. Do not be generic.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt
    });
    return response.text || "Try breaking the shape down into primitive blocks first.";
  } catch (e) {
    return "Check your topology flow before adding details.";
  }
};

/**
 * Chat Stream for the persistent sidebar.
 */
export const createChatSession = () => {
  const ai = getAIClient();
  return ai.chats.create({
    model: MODEL_FAST, // Flash for responsive chat
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_MENTOR,
    }
  });
};


// Helper
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};