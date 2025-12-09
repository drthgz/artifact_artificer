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
 * Generates a Daily Challenge with a Reference Image.
 * 1. Generates text prompt and metadata.
 * 2. Generates the actual reference image using Imagen/Gemini Image model.
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

  const designResp = await ai.models.generateContent({
    model: MODEL_FAST, // Flash is fine for brainstorming
    contents: designPrompt,
    config: { responseMimeType: "application/json" }
  });

  const design = JSON.parse(designResp.text || "{}");

  // Step 2: Generate the Reference Image
  let imageUrl = "";
  try {
    const imageResp = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: {
        parts: [{ text: design.imagePrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
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
  } catch (e) {
    console.warn("Image generation failed, using placeholder", e);
    imageUrl = "https://picsum.photos/500/500?grayscale"; // Fallback
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
