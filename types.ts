export type Domain = 'Engineering' | 'Digital Art' | 'Architecture';
export type SkillLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced';

export interface UserProfile {
  name: string;
  domain: Domain;
  tool: string; // e.g., Blender, AutoCAD, Maya
  skillLevel: SkillLevel;
  xp: number;
  streak: number;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  criteria: string[];
  xpReward: number;
  status: 'locked' | 'active' | 'completed' | 'reviewing';
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalXp: number;
  steps: Step[];
}

export interface Challenge {
  id: string;
  title: string;
  theme: string;
  description: string;
  referenceImageUrl?: string;
  goldTime: number; // minutes
  silverTime: number; // minutes
  bronzeTime: number; // minutes
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string; // For displaying generated/edited images
  timestamp: number;
}