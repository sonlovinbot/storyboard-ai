
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Project, Scene, Shot, Character, SceneSetting } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder.");
  process.env.API_KEY = "YOUR_API_KEY_HERE";
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';
const multimodalModel = 'gemini-2.5-flash-image-preview';

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

export const extractCharacters = async (screenplay: Scene[], maxCharacters: number): Promise<{ characters: Omit<Character, 'id' | 'imageUrl' | 'isGenerating' | 'referenceImage'>[], prompt: string }> => {
    const prompt = `
    From the following screenplay, identify the main characters (up to ${maxCharacters}). For each character, provide a complete, detailed profile based on their actions, dialogue, and context. Fill in every field.

    Screenplay:
    ${JSON.stringify(screenplay, null, 2)}
    
    Return a JSON array of character objects with all fields populated.
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
                        description: { type: Type.STRING },
                        age: { type: Type.STRING },
                        personality: { type: Type.STRING },
                        appearance: { type: Type.STRING },
                        hair: { type: Type.STRING },
                        skin: { type: Type.STRING },
                        outfit: { type: Type.STRING },
                        accessories: { type: Type.STRING },
                    },
                    required: ["name", "description", "age", "personality", "appearance", "hair", "skin", "outfit", "accessories"]
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
  aspectRatio: string,
  referenceImage?: {mimeType: string, data: string}
): Promise<string> => {
    const prompt = `
    Generate a character image based on the following details. The character should be on a neutral background for a character sheet.
    
    Character Name: ${character.name}
    Description: ${character.description}
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
            model: multimodalModel,
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
        const finalAspectRatio = aspectRatio === "16:9" || aspectRatio === "9:16" ? "3:4" : aspectRatio;

        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: finalAspectRatio as '1:1' | '3:4' | '4:3',
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
    
    For each shot, provide all the required fields. 
    - 'sfx' (sound effects) should be short and impactful (e.g., "CRASH", "Footsteps echo"). 
    - 'vo' is for voice-over narration only.
    - 'lighting' should describe the scene's lighting (e.g., "Warm morning light", "Harsh neon glow").
    - 'music' should suggest a music cue (e.g., "Tense orchestral score", "Upbeat pop song").
    - 'dialogue' must be an array of objects containing the character and their line, extracted directly from the screenplay for that specific moment in the shot. If there is no dialogue in the shot, provide an empty array.
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
                        sfx: { type: Type.STRING, description: "Sound effect text, if any." },
                        lighting: { type: Type.STRING, description: "Description of the lighting." },
                        music: { type: Type.STRING, description: "Description of the music cue." },
                        dialogue: {
                            type: Type.ARRAY,
                            description: "Dialogue spoken in this shot.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    character: { type: Type.STRING },
                                    line: { type: Type.STRING }
                                },
                                required: ["character", "line"]
                            }
                        }
                    },
                    required: ["sceneNumber", "shotNumber", "description", "ert", "shotSize", "perspective", "movement", "equipment", "lens", "aspectRatio", "notes", "vo", "sfx", "lighting", "music", "dialogue"]
                }
            }
        }
    });

    const shots = JSON.parse(response.text);
    return { shots, prompt };
};

export const extractSceneLocations = async (screenplay: Scene[]): Promise<{ locations: string[], prompt: string }> => {
    const prompt = `
    From the following screenplay, identify 2-3 key, distinct scene locations or settings. Provide a concise one-sentence description for each. These will be used to generate background art.

    Screenplay:
    ${JSON.stringify(screenplay, null, 2)}
    
    Return a JSON array of strings, where each string is a location description.
    `;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });

    const locations = JSON.parse(response.text);
    return { locations, prompt };
};

export const generateSceneSettingImage = async (
    description: string, 
    artStyle: string, 
    aspectRatio: string,
    referenceImage?: {mimeType: string, data: string}
): Promise<string> => {
    const prompt = `
    Generate a beautiful, cinematic background image for a key scene setting. No characters.
    
    Setting Description: ${description}
    Style: ${artStyle}, environmental concept art.
    `;

    if (referenceImage) {
        const textPart = { text: `Redevelop this scene setting based on the reference image and the following details. Make sure the output is just the scene, no characters.\n\n${prompt}`};
        const imagePart = { inlineData: referenceImage };
        const response = await ai.models.generateContent({
            model: multimodalModel,
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
        throw new Error("No image generated from reference for scene setting.");
    } else {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
            },
        });
        return response.generatedImages[0].image.imageBytes;
    }
};

export const generateStoryboardImage = async (
    shot: Shot, 
    characters: Character[], 
    sceneSettings: SceneSetting[], 
    artStyle: string, 
    aspectRatio: string,
    overrideImages?: { mimeType: string; data: string }[]
): Promise<{ base64Image: string, prompt: string }> => {
    const relevantCharacters = characters.filter(c => 
        new RegExp(`\\b${c.name}\\b`, 'i').test(shot.description) && c.imageUrl
    );

    const promptText = `
    **Primary Goal: Create a consistent, cinematic storyboard image.**
    - **Shot Description:** ${shot.description}
    - **Shot Details:** ${shot.shotSize}, ${shot.perspective} perspective, ${shot.movement} movement.
    - **Art Style:** ${artStyle}.
    - **Aspect Ratio:** ${aspectRatio}.

    **Mandatory Instructions:**
    1.  **Use Character References:** The provided character images are NOT optional. Replicate the appearance, clothing, and likeness of these characters: ${relevantCharacters.map(c => c.name).join(', ')}.
    2.  **Use Scene Reference:** The provided scene setting images are NOT optional. Use them as a direct reference for the background, environment, lighting, and mood. Choose the most appropriate setting for the shot description.
    `;

    const textPart = { text: promptText };

    let imageParts: { inlineData: { mimeType: string; data: string } }[] = [];

    if (overrideImages) {
        imageParts = overrideImages.map(img => ({
            inlineData: { mimeType: img.mimeType, data: img.data }
        }));
    } else {
        const characterImageParts = relevantCharacters.map(c => {
            const base64Data = c.imageUrl!.split(',')[1];
            return { inlineData: { mimeType: 'image/png', data: base64Data } };
        });

        const sceneImageParts = sceneSettings.filter(s => s.imageUrl).map(s => {
            const base64Data = s.imageUrl!.split(',')[1];
            return { inlineData: { mimeType: 'image/png', data: base64Data } };
        });
        imageParts = [...characterImageParts, ...sceneImageParts];
    }
    
    if (imageParts.length === 0) {
        // Fallback to text-to-image if no references exist
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: promptText,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
            },
        });
        return { base64Image: response.generatedImages[0].image.imageBytes, prompt: promptText };
    }

    const response = await ai.models.generateContent({
        model: multimodalModel,
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
    throw new Error("Storyboard image generation with references failed.");
};