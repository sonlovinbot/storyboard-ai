
export enum Step {
  Project,
  Idea,
  Screenplay,
  Characters,
  Shotlist,
  Storyboard,
  Export
}

export interface Dialogue {
  character: string;
  line: string;
}

export interface Scene {
  sceneNumber: number;
  title: string;
  description: string;
  dialogue: Dialogue[];
  prompt?: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  age: string;
  personality: string;
  appearance: string;
  hair: string;
  skin: string;
  outfit: string;
  accessories: string;
  imageUrl?: string;
  referenceImage?: string; // base64 data URL
  isGenerating?: boolean;
}

export interface Shot {
  sceneNumber: number;
  shotNumber: number;
  description: string;
  ert: string;
  shotSize: string;
  perspective: string;
  movement: string;
  equipment: string;
  lens: string;
  aspectRatio: string;
  notes: string;
  vo: string;
  sfx: string;
  lighting: string;
  music: string;
  dialogue: Dialogue[];
}

export interface StoryboardPanel {
  shot: Shot;
  imageUrl?: string;
  prompt?: string;
  isGenerating?: boolean;
  referenceImageIds?: string[];
}

export interface SceneSetting {
    id: string;
    description: string;
    imageUrl?: string;
    isGenerating?: boolean;
}

export interface Project {
  title: string;
  genre: string;
  maxCharacters: number;
  maxScenes: number;
  storyConcept: string;
  screenplay: Scene[];
  characters: Character[];
  shotlist: Shot[];
  storyboard: StoryboardPanel[];
  styleGuide: string;
  artStyle: string;
  aspectRatio: string;
  sceneSettings: SceneSetting[];
}