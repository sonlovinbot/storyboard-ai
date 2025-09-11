
import React, { useState, useCallback, useEffect } from 'react';
import { Project, Character, SceneSetting } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Textarea from './ui/Textarea';
import ImageUploader from './ui/ImageUploader';
import Input from './ui/Input';
import Card from './ui/Card';
import Modal from './ui/Modal';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

type EditableCharacterField = keyof Omit<Character, 'id' | 'imageUrl' | 'isGenerating' | 'referenceImage'>;

const CharacterEditor: React.FC<{
    character: Character;
    isEditing: boolean;
    onUpdateField: (field: EditableCharacterField, value: string) => void;
    onUploadReference: (base64: string) => void;
}> = ({ character, isEditing, onUpdateField, onUploadReference }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdateField(e.target.name as EditableCharacterField, e.target.value);
    };

    const fields: { key: EditableCharacterField; label: string; type: 'input' | 'textarea' }[] = [
        { key: 'name', label: 'Name', type: 'input' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'age', label: 'Age', type: 'input' },
        { key: 'personality', label: 'Personality', type: 'textarea' },
        { key: 'appearance', label: 'Appearance', type: 'textarea' },
        { key: 'hair', label: 'Hair', type: 'textarea' },
        { key: 'skin', label: 'Skin', type: 'textarea' },
        { key: 'outfit', label: 'Outfit', type: 'textarea' },
        { key: 'accessories', label: 'Accessories', type: 'textarea' },
    ];

    if (isEditing) {
        return (
            <div className="space-y-3">
                {fields.map(f => (
                    f.type === 'textarea' ? (
                        <Textarea key={f.key} label={f.label} name={f.key} value={character[f.key] as string} onChange={handleChange} rows={2} />
                    ) : (
                        <Input key={f.key} label={f.label} name={f.key} value={character[f.key] as string} onChange={handleChange} />
                    )
                ))}
                <ImageUploader 
                    label="Reference Image"
                    onImageUpload={onUploadReference}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {fields.map(f => (
                <div key={f.key}>
                    <h4 className="text-sm font-semibold text-brand-text-dark">{f.label}</h4>
                    <p className="text-brand-text-light whitespace-pre-wrap">{character[f.key] as string || 'Not set'}</p>
                </div>
            ))}
            {character.referenceImage && (
                <div>
                    <h4 className="text-sm font-semibold text-brand-text-dark">Reference Image</h4>
                    <img src={character.referenceImage} alt="Reference" className="mt-1 rounded-md max-h-24" />
                </div>
            )}
        </div>
    );
};

const CharacterCard: React.FC<{
  character: Character;
  onUpdate: (updatedCharacter: Character) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  artStyle: string;
  aspectRatio: string;
}> = ({ character, onUpdate, onRegenerate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedCharacter, setEditedCharacter] = useState<Character>(character);

    useEffect(() => {
        setEditedCharacter(character);
    }, [character]);

    const handleUpdateField = (field: EditableCharacterField, value: string) => {
        setEditedCharacter(prev => ({...prev, [field]: value}));
    };
    
    const handleUploadReference = (base64: string) => {
        setEditedCharacter(prev => ({ ...prev, referenceImage: base64 }));
    };

    const handleSave = () => {
        onUpdate(editedCharacter);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedCharacter(character);
        setIsEditing(false);
    };
    
    return (
        <div className="bg-brand-secondary/50 border border-brand-border/20 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
                <div className="aspect-[3/4] bg-brand-bg rounded-md flex items-center justify-center sticky top-24">
                   {character.isGenerating && <Spinner />}
                   {!character.isGenerating && character.imageUrl && (
                     <img src={character.imageUrl} alt={character.name} className="object-cover w-full h-full rounded-md" />
                   )}
                   {!character.isGenerating && !character.imageUrl && (
                     <div className="text-brand-text-dark text-sm p-4 text-center">Generate an image to see your character.</div>
                   )}
                </div>
            </div>
            
            <div className="md:col-span-2">
                <CharacterEditor 
                    character={editedCharacter} 
                    isEditing={isEditing} 
                    onUpdateField={handleUpdateField}
                    onUploadReference={handleUploadReference}
                />

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-border/50">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} size="sm">Save</Button>
                            <Button onClick={handleCancel} variant="secondary" size="sm">Cancel</Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} size="sm" variant="secondary">Edit</Button>
                    )}
                    <Button onClick={() => onRegenerate(character.id)} isLoading={character.isGenerating} size="sm">
                        {character.imageUrl ? 'Regenerate' : 'Generate'}
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(character.id)} size="sm">Delete</Button>
                </div>
            </div>
        </div>
    );
};

const Step4_Characters: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSceneEditModalOpen, setIsSceneEditModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<SceneSetting | null>(null);

  const handleExtractCharacters = useCallback(async () => {
    if (project.characters.length > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const { characters: extractedChars } = await geminiService.extractCharacters(project.screenplay, project.maxCharacters);
      const newCharacters: Character[] = extractedChars.map((c, i) => ({
        ...c,
        id: `char-${Date.now()}-${i}`,
        isGenerating: false,
      }));
      setProject(p => ({ ...p, characters: newCharacters }));
    } catch (e) {
      console.error(e);
      setError("Failed to extract characters.");
    } finally {
      setIsLoading(false);
    }
  }, [project.screenplay, project.maxCharacters, setProject, project.characters.length]);

  const handleExtractSceneLocations = useCallback(async () => {
    if (project.sceneSettings.length > 0) return;
    try {
        const { locations } = await geminiService.extractSceneLocations(project.screenplay);
        const newSceneSettings: SceneSetting[] = locations.map((desc, i) => ({
            id: `scene-${Date.now()}-${i}`,
            description: desc,
            isGenerating: false,
        }));
        setProject(p => ({ ...p, sceneSettings: newSceneSettings }));
    } catch (e) {
        console.error(e);
        setError(prev => `${prev ? prev + "\n" : ""}Failed to extract scene locations.`);
    }
  }, [project.screenplay, project.sceneSettings.length, setProject]);

  useEffect(() => {
    handleExtractCharacters();
    handleExtractSceneLocations();
  }, [handleExtractCharacters, handleExtractSceneLocations]);
  
  const handleUpdateCharacter = (updatedCharacter: Character) => {
    setProject(p => ({
        ...p,
        characters: p.characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
    }));
  };

  const handleGenerateCharImage = useCallback(async (id: string) => {
    const character = project.characters.find(c => c.id === id);
    if (!character) return;

    setProject(p => ({ ...p, characters: p.characters.map(c => c.id === id ? { ...c, isGenerating: true } : c)}));
    try {
      let refImage;
      if (character.referenceImage) {
        const [meta, data] = character.referenceImage.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1];
        if(data && mimeType) refImage = { data, mimeType };
      }
      const base64Image = await geminiService.generateCharacterImage(character, project.artStyle, project.aspectRatio, refImage);
      setProject(p => ({ ...p, characters: p.characters.map(c => c.id === id ? { ...c, imageUrl: `data:image/png;base64,${base64Image}`, isGenerating: false } : c)}));
    } catch (e) {
      console.error(e);
      setError(`Failed to generate image for ${character.name}.`);
      setProject(p => ({ ...p, characters: p.characters.map(c => c.id === id ? { ...c, isGenerating: false } : c)}));
    }
  }, [project.characters, project.artStyle, project.aspectRatio, setProject]);

  const handleGenerateSceneImage = useCallback(async (id: string) => {
    const scene = project.sceneSettings.find(s => s.id === id);
    if (!scene) return;

    setProject(p => ({ ...p, sceneSettings: p.sceneSettings.map(s => s.id === id ? { ...s, isGenerating: true } : s)}));
    try {
      let refImage;
      if (scene.referenceImage) {
        const [meta, data] = scene.referenceImage.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1];
        if(data && mimeType) refImage = { data, mimeType };
      }
      const base64Image = await geminiService.generateSceneSettingImage(scene.description, project.artStyle, project.aspectRatio, refImage);
      setProject(p => ({ ...p, sceneSettings: p.sceneSettings.map(s => s.id === id ? { ...s, imageUrl: `data:image/png;base64,${base64Image}`, isGenerating: false } : s)}));
    } catch (e) {
      console.error(e);
      setError(`Failed to generate image for scene setting.`);
      setProject(p => ({ ...p, sceneSettings: p.sceneSettings.map(s => s.id === id ? { ...s, isGenerating: false } : s)}));
    }
  }, [project.sceneSettings, project.artStyle, project.aspectRatio, setProject]);

  const handleDeleteCharacter = (id: string) => {
    setProject(p => ({
        ...p,
        characters: p.characters.filter(c => c.id !== id)
    }));
  };
  
  const handleEditSceneSetting = (scene: SceneSetting) => {
    setEditingScene(JSON.parse(JSON.stringify(scene)));
    setIsSceneEditModalOpen(true);
  };

  const handleCancelEditScene = () => {
    setIsSceneEditModalOpen(false);
    setEditingScene(null);
  };
  
  const handleEditingSceneChange = (field: keyof SceneSetting, value: string) => {
    if (editingScene) {
        setEditingScene(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleSaveSceneSetting = () => {
    if (!editingScene) return;
    setProject(p => ({
        ...p,
        sceneSettings: p.sceneSettings.map(s =>
            s.id === editingScene.id ? editingScene : s
        )
    }));
    handleCancelEditScene();
  };

  const handleDeleteSceneSetting = (sceneId: string) => {
    if (window.confirm("Are you sure you want to delete this scene setting? This action cannot be undone.")) {
        setProject(p => ({
            ...p,
            sceneSettings: p.sceneSettings.filter(s => s.id !== sceneId)
        }));
    }
  };


  const canProceed = project.characters.length > 0 && 
                     project.characters.every(c => c.imageUrl) &&
                     project.sceneSettings.length > 0 &&
                     project.sceneSettings.some(s => s.imageUrl);

  return (
    <div>
        <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-4 -mr-4">
            <div>
                <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Character Designs</h2>
                {isLoading && <Spinner message="Extracting characters..."/>}
                {error && <p className="text-red-500 text-center my-4">{error}</p>}
                
                {project.characters.length > 0 && (
                    <div className="space-y-6">
                        {project.characters.map(character => (
                            <CharacterCard 
                                key={character.id}
                                character={character}
                                onUpdate={handleUpdateCharacter}
                                onRegenerate={handleGenerateCharImage}
                                onDelete={handleDeleteCharacter}
                                artStyle={project.artStyle}
                                aspectRatio={project.aspectRatio}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold text-center my-6 text-brand-text-light">Scene Settings</h2>
                 {project.sceneSettings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {project.sceneSettings.map(scene => (
                            <div key={scene.id} className="bg-brand-secondary/50 border border-brand-border/20 rounded-lg shadow-md flex flex-col overflow-hidden">
                               <div className="aspect-video bg-brand-bg flex items-center justify-center">
                                    {scene.isGenerating && <Spinner />}
                                    {!scene.isGenerating && scene.imageUrl && (
                                        <img src={scene.imageUrl} alt={scene.description} className="object-cover w-full h-full" />
                                    )}
                               </div>
                               <div className="p-4 flex flex-col flex-grow">
                                <p className="text-sm text-brand-text-dark flex-grow min-h-[4.5rem]">{scene.description}</p>
                                <div className="mt-4 space-y-2">
                                    <Button onClick={() => handleGenerateSceneImage(scene.id)} isLoading={scene.isGenerating} size="sm" className="w-full">
                                        {scene.imageUrl ? 'Regenerate' : 'Generate'}
                                    </Button>
                                    <div className="flex space-x-2 mt-2">
                                        <Button variant="secondary" onClick={() => handleEditSceneSetting(scene)} size="sm" className="flex-1">Edit</Button>
                                        <Button variant="danger" onClick={() => handleDeleteSceneSetting(scene.id)} size="sm" className="flex-1">Delete</Button>
                                    </div>
                                </div>
                               </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
        
         <Modal
            isOpen={isSceneEditModalOpen}
            onClose={handleCancelEditScene}
            title="Edit Scene Setting"
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleCancelEditScene}>Cancel</Button>
                    <Button onClick={handleSaveSceneSetting}>Save Changes</Button>
                </div>
            }
        >
            {editingScene && (
                <div className="space-y-4">
                    {editingScene.imageUrl && (
                        <img src={editingScene.imageUrl} alt={editingScene.description} className="w-full h-auto rounded-lg object-contain max-h-64 bg-brand-bg" />
                    )}
                    <Textarea 
                        label="Description"
                        value={editingScene.description}
                        onChange={(e) => handleEditingSceneChange('description', e.target.value)}
                        rows={5}
                    />
                    <ImageUploader 
                        label="Reference Image"
                        onImageUpload={(base64) => handleEditingSceneChange('referenceImage', base64)}
                    />
                    {editingScene.referenceImage && (
                        <div>
                            <h4 className="text-sm font-semibold text-brand-text-dark">Reference Image Preview</h4>
                            <img src={editingScene.referenceImage} alt="Reference" className="mt-1 rounded-md max-h-24 object-cover" />
                        </div>
                    )}
                </div>
            )}
        </Modal>


         <div className="flex justify-end pt-6 mt-4 border-t border-brand-border/50">
            <Button onClick={goToNextStep} disabled={!canProceed}>
                Next: Generate Shotlist
            </Button>
        </div>
    </div>
  );
};

export default Step4_Characters;