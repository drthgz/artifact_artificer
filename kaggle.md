# Artifex AI: The Personalized Mentor for Digital Creators

**Subtitle**: Mastering complex creative tools with adaptive, multimodal AI guidance.

**Track**: Gemini API Developer Competition

## Project Description

**Artifex AI** solves the steep learning curve of professional creative software (Blender, AutoCAD, etc.) by replacing static video tutorials with an interactive, intelligent mentor.

Traditionally, learning 3D modeling or CAD involves watching hours of passive video. Artifex changes this by generating **Personalized Learning Paths** tailored to the user's specific goal (e.g., "Sculpt a dragon for 3D printing"). It uses **Gemini 1.5 Pro's** reasoning capabilities to break complex goals into granular, sequential modules.

The core innovation is the **Real-time Feedback Loop**. Users upload screenshots of their progress, and Artifex uses Gemini's multimodal capabilities to visually analyze the work against specific success criteria—acting like a professor looking over your shoulder. If a student gets stuck, the **Artifex Copilot** provides context-aware technical help or generates reference images to explain concepts visually.

We also gamify the grind with **Daily Challenges**, where Gemini generates a random prompt and a reference image, challenging users to recreate it against a clock for XP and leaderboard status.

## Impact & Importance

1.  **Democratizing Technical Art**: Lowers the barrier to entry for high-value skills like 3D modeling and engineering design.
2.  **Active Learning**: Forces users to *do* rather than just watch, leading to higher retention rates.
3.  **Scalable Mentorship**: Provides the detailed, visual feedback of a private tutor at zero marginal cost, accessible to anyone with an internet connection.

## Tech Stack

-   **Frontend**: React, Tailwind CSS, TypeScript
-   **AI**: Google Gemini API via `@google/genai` SDK
    -   `gemini-3-pro-preview`: Complex curriculum reasoning and image analysis.
    -   `gemini-2.5-flash`: High-speed chat and challenge generation.
    -   `gemini-2.5-flash-image`: Real-time reference image generation and editing.
