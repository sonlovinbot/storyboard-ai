
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Project, Scene, Shot, Character } from '../types';

if (!process.env.API_KEY) {
  // In a real app, this would be handled more gracefully.
  // For this environment, we assume it's set.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
  process.env.API_KEY = "YOUR_API_KEY_HERE";
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

const sceneSchema = {
    type: Type.OBJECT,
    properties: {
        sceneNumber: { type: Type.INTEGER, description: "The sequential number of the scene." },
        title: { type: Type.STRING, description: "A short, descriptive title for the scene (e.g., INT. COFFEE SHOP - DAY)." },
        description: { type: Type.STRING, description: "A detailed paragraph describing the setting, characters, and action in the scene." },
        dialogue: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    character: { type: Type.STRING, description: "The name of the character speaking." },
                    line: { type: Type.STRING, description: "The dialogue spoken by the character." }
                },
                required: ["character", "line"]
            }
        }
    },
    required: ["sceneNumber", "title", "description", "dialogue"]
};


export const generateScreenplay = async (project: Project): Promise<{ scenes: Scene[], prompt: string }> => {
  const prompt = `
    You are a professional screenwriter. Based on the following story concept, create a screenplay.
    
    **Project Details:**
    - Genre: ${project.genre}
    - Maximum Characters: ${project.maxCharacters}
    - Maximum Scenes: ${project.maxScenes}

    **Story Concept:**
    ${project.storyConcept}

    Generate a screenplay with exactly ${project.maxScenes} scenes. Each scene must follow the provided JSON schema. Ensure character names are consistent.
    `;

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: sceneSchema
            }
        }
    });
    const scenes = JSON.parse(response.text);
    return { scenes, prompt };
};

export const extractCharacters = async (screenplay: Scene[], maxCharacters: number): Promise<{ characters: Omit<Character, 'id' | 'imageUrl' | 'isGenerating' | 'age' | 'personality' | 'appearance' | 'hair' | 'skin' | 'outfit' | 'accessories'>[], prompt: string }> => {
    const prompt = `
    From the following screenplay, identify the main characters (up to ${maxCharacters}). For each character, provide their name and a concise one-sentence description based on their actions and dialogue.

    Screenplay:
    ${JSON.stringify(screenplay, null, 2)}
    
    Return a JSON array of character objects.
    `;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["name", "description"]
                }
            }
        }
    });

    const characters = JSON.parse(response.text);
    return { characters, prompt };
}

export const generateCharacterImage = async (
  character: Character, 
  artStyle: string,
  referenceImage?: {mimeType: string, data: string}
): Promise<string> => {
    const prompt = `
    Generate a character image based on the following details. The character should be on a neutral background for a character sheet.
    
    Character Name: ${character.name}
    Age: ${character.age}
    Personality: ${character.personality}
    Appearance: ${character.appearance}
    Hair: ${character.hair}
    Skin: ${character.skin}
    Outfit: ${character.outfit}
    Accessories: ${character.accessories}
    Context: Neutral background for a character sheet, full body shot.
    Style & Mood: ${artStyle}
    `;

    if (referenceImage) {
        const textPart = { text: `Redevelop this character based on the reference image and the following details. Make sure the output is just the character on a neutral background.\n\n${prompt}`};
        const imagePart = { inlineData: referenceImage };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image generated from reference.");
    } else {
        const fullPrompt = `Character sheet, full body, neutral background. ${prompt}`;

        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '3:4',
            },
        });

        return response.generatedImages[0].image.imageBytes;
    }
};

export const generateShotlist = async (screenplay: Scene[]): Promise<{ shots: Shot[], prompt: string }> => {
    const prompt = `
    You are a film director. Create a detailed shotlist from the provided screenplay. For each scene, break it down into logical shots.
    
    Screenplay:
    ${JSON.stringify(screenplay, null, 2)}
    
    For each shot, provide all the required fields. 'sfx' (sound effects) should be short and impactful (e.g., "CRASH", "Footsteps echo"). 'vo' is for voice-over narration only.
    `;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sceneNumber: { type: Type.INTEGER },
                        shotNumber: { type: Type.INTEGER },
                        description: { type: Type.STRING },
                        ert: { type: Type.STRING, description: "Estimated Run Time, e.g., '3s'" },
                        shotSize: { type: Type.STRING, description: "e.g., Wide, Medium, Close-up" },
                        perspective: { type: Type.STRING, description: "e.g., Eye-level, High-angle" },
                        movement: { type: Type.STRING, description: "e.g., Static, Pan, Dolly" },
                        equipment: { type: Type.STRING, description: "e.g., Tripod, Drone, Steadicam" },
                        lens: { type: Type.STRING, description: "e.g., 24mm, 50mm, 85mm" },
                        aspectRatio: { type: Type.STRING, description: "e.g., '16:9'" },
                        notes: { type: Type.STRING },
                        vo: { type: Type.STRING, description: "Voice-over text, if any." },
                        sfx: { type: Type.STRING, description: "Sound effect text, if any." }
                    },
                    required: ["sceneNumber", "shotNumber", "description", "ert", "shotSize", "perspective", "movement", "equipment", "lens", "aspectRatio", "notes", "vo", "sfx"]
                }
            }
        }
    });

    const shots = JSON.parse(response.text);
    return { shots, prompt };
};


export const generateStoryboardImage = async (shot: Shot, characters: Character[], artStyle: string): Promise<{ base64Image: string, prompt: string }> => {
    // Find characters mentioned in the shot description that have an image
    const relevantCharacters = characters.filter(c => 
        new RegExp(`\\b${c.name}\\b`, 'i').test(shot.description) && c.imageUrl
    );

    if (relevantCharacters.length > 0) {
        const promptText = `
        Create a cinematic image for a storyboard.
        Scene Description: ${shot.description}.
        Shot Details: ${shot.shotSize}, ${shot.perspective} perspective, ${shot.movement} movement.
        Style: ${artStyle}.
        Use the provided character images as direct references for their appearance, clothing, and likeness.
        Characters to include: ${relevantCharacters.map(c => c.name).join(', ')}.
        `;

        const textPart = { text: promptText };
        const imageParts = relevantCharacters.map(c => {
            const base64Data = c.imageUrl!.split(',')[1];
            return {
                inlineData: {
                    mimeType: 'image/png', // Assuming png from character generation
                    data: base64Data,
                }
            };
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [textPart, ...imageParts] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return { base64Image: part.inlineData.data, prompt: promptText };
            }
        }
        throw new Error("Storyboard image generation with character reference failed.");

    } else {
        const prompt = `
        Shot Description: ${shot.description}.
        Shot Details: ${shot.shotSize}, ${shot.perspective} perspective, ${shot.movement} movement.
        Style: ${artStyle}.
        Aspect Ratio: ${shot.aspectRatio}.
        `;

        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: shot.aspectRatio === "3:4" || shot.aspectRatio === "4:3" || shot.aspectRatio === "9:16" || shot.aspectRatio === "16:9" ? shot.aspectRatio : '16:9',
            },
        });
        return { base64Image: response.generatedImages[0].image.imageBytes, prompt };
    }
};