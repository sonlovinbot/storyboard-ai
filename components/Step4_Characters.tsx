
import React, { useState, useCallback, useEffect } from 'react';
import { Project, Character } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Textarea from './ui/Textarea';
import ImageUploader from './ui/ImageUploader';
import Input from './ui/Input';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

// FIX: Define a specific type for editable character fields to fix the type error.
type EditableCharacterField = keyof Omit<Character, 'id' | 'imageUrl' | 'isGenerating' | 'referenceImage'>;

const CharacterEditor: React.FC<{
    character: Character;
    isEditing: boolean;
    onUpdateField: (field: EditableCharacterField, value: string) => void;
    onUploadReference: (base64: string, mimeType: string) => void;
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
                    f.key === 'description' || f.type === 'textarea' ? (
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
        <div className="bg-brand-secondary p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
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

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-border">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} size="sm">Save</Button>
                            <Button onClick={handleCancel} variant="secondary" size="sm">Cancel</Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} size="sm">Edit</Button>
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
        age: '',
        personality: '',
        appearance: '',
        hair: '',
        skin: '',
        outfit: '',
        accessories: '',
      }));
      setProject(p => ({ ...p, characters: newCharacters }));
    } catch (e) {
      console.error(e);
      setError("Failed to extract characters.");
    } finally {
      setIsLoading(false);
    }
  }, [project.screenplay, project.maxCharacters, setProject, project.characters.length]);

  React.useEffect(() => {
    handleExtractCharacters();
  }, [handleExtractCharacters]);
  
  const handleUpdateCharacter = (updatedCharacter: Character) => {
    setProject(p => ({
        ...p,
        characters: p.characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
    }));
  };

  const handleGenerateImage = useCallback(async (id: string) => {
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
      const base64Image = await geminiService.generateCharacterImage(character, project.artStyle, refImage);
      setProject(p => ({ ...p, characters: p.characters.map(c => c.id === id ? { ...c, imageUrl: `data:image/png;base64,${base64Image}`, isGenerating: false } : c)}));
    } catch (e) {
      console.error(e);
      setError(`Failed to generate image for ${character.name}.`);
      setProject(p => ({ ...p, characters: p.characters.map(c => c.id === id ? { ...c, isGenerating: false } : c)}));
    }
  }, [project.characters, project.artStyle, setProject]);

  const handleDeleteCharacter = (id: string) => {
    setProject(p => ({
        ...p,
        characters: p.characters.filter(c => c.id !== id)
    }));
  };

  const canProceed = project.characters.length > 0 && project.characters.every(c => c.imageUrl);

  return (
    <div>
        <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Character Designs</h2>
        {project.characters.length === 0 && isLoading && <Spinner message="Extracting characters..."/>}

        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {project.characters.length > 0 && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                {project.characters.map(character => (
                    <CharacterCard 
                        key={character.id}
                        character={character}
                        onUpdate={handleUpdateCharacter}
                        onRegenerate={handleGenerateImage}
                        onDelete={handleDeleteCharacter}
                    />
                ))}
            </div>
        )}
        
        {project.characters.length === 0 && !isLoading && !error && (
            <div className="text-center p-8">
                <p className="mb-4">No characters found. You can extract them from the screenplay.</p>
                <Button onClick={handleExtractCharacters}>Extract Characters</Button>
            </div>
        )}

         <div className="flex justify-end pt-6 mt-4 border-t border-brand-border">
            <Button onClick={goToNextStep} disabled={!canProceed}>
                Next: Generate Shotlist
            </Button>
        </div>
    </div>
  );
};

export default Step4_Characters;
