import React, { useState, useEffect, useCallback } from 'react';
import { Project, Scene, Dialogue } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const SceneCard: React.FC<{ scene: Scene; onEdit: (scene: Scene) => void }> = ({ scene, onEdit }) => {
  return (
    <Card className="mb-4 bg-brand-bg/50 dark:bg-brand-secondary/30">
      <h3 className="text-xl font-bold text-brand-primary">{scene.title} (Scene {scene.sceneNumber})</h3>
      <p className="mt-2 text-brand-text-dark italic">{scene.description}</p>
      <div className="mt-4 space-y-3">
        {scene.dialogue.map((d, i) => (
          <div key={i}>
            <p className="font-semibold text-brand-text-light">{d.character.toUpperCase()}</p>
            <p className="ml-4 text-brand-text-light">{d.line}</p>
          </div>
        ))}
      </div>
       <div className="mt-4">
          <Button variant="secondary" onClick={() => onEdit(scene)} size="sm">
            Edit Scene
          </Button>
        </div>
    </Card>
  );
};

const Step3_Screenplay: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);


  const handleGenerateScreenplay = useCallback(async (force = false) => {
    if (project.screenplay.length > 0 && !force) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { scenes, prompt } = await geminiService.generateScreenplay(project);
      const scenesWithPrompt = scenes.map(s => ({ ...s, prompt }));
      setProject(p => ({ ...p, screenplay: scenesWithPrompt }));
    } catch (e) {
      console.error(e);
      setError("Failed to generate screenplay. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [project, setProject]);
  
  const handleRegenerateClick = () => {
    if (window.confirm("Are you sure you want to regenerate the screenplay? This will replace the current version.")) {
        handleGenerateScreenplay(true);
    }
  };

  useEffect(() => {
    handleGenerateScreenplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleOpenEditModal = (scene: Scene) => {
    setEditingScene(JSON.parse(JSON.stringify(scene))); // Deep copy to avoid direct mutation
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingScene(null);
  };

  const handleSceneChange = (field: keyof Omit<Scene, 'dialogue' | 'sceneNumber'>, value: string) => {
    if (editingScene) {
        setEditingScene({ ...editingScene, [field]: value });
    }
  };

  const handleDialogueChange = (index: number, field: keyof Dialogue, value: string) => {
    if (editingScene) {
        const newDialogue = [...editingScene.dialogue];
        newDialogue[index] = { ...newDialogue[index], [field]: value };
        setEditingScene({ ...editingScene, dialogue: newDialogue });
    }
  };
  
  const handleSaveChanges = () => {
    if (editingScene) {
        setProject(p => ({
            ...p,
            screenplay: p.screenplay.map(s => s.sceneNumber === editingScene.sceneNumber ? editingScene : s)
        }));
    }
    handleCloseEditModal();
  };


  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Screenplay</h2>
      
      {isLoading && <Spinner message="Generating screenplay..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!isLoading && !error && (
        <>
          <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
            {project.screenplay.map((scene) => (
              <SceneCard key={scene.sceneNumber} scene={scene} onEdit={handleOpenEditModal} />
            ))}
          </div>
          <div className="flex justify-end items-center pt-6 mt-4 border-t border-brand-border/50 gap-2">
            <Button variant="secondary" onClick={handleRegenerateClick} isLoading={isLoading}>
              Regenerate
            </Button>
            <Button onClick={goToNextStep} disabled={project.screenplay.length === 0}>
              Next: Create Characters
            </Button>
          </div>
        </>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={`Edit Scene ${editingScene?.sceneNumber}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCloseEditModal}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        }
      >
        {editingScene && (
          <div className="space-y-4">
            <Input 
              label="Scene Title"
              id="sceneTitle"
              value={editingScene.title}
              onChange={(e) => handleSceneChange('title', e.target.value)}
            />
            <Textarea
              label="Scene Description"
              id="sceneDescription"
              value={editingScene.description}
              onChange={(e) => handleSceneChange('description', e.target.value)}
              rows={5}
            />
            <h4 className="text-lg font-semibold text-brand-text-light border-b border-brand-border pb-2">Dialogue</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {editingScene.dialogue.map((d, i) => (
                <div key={i} className="p-4 bg-brand-secondary/50 rounded-lg border border-brand-border/50 space-y-3">
                   <Input
                    label={`Character`}
                    id={`char-${i}`}
                    value={d.character}
                    onChange={(e) => handleDialogueChange(i, 'character', e.target.value)}
                  />
                  <Textarea
                    label={`Line`}
                    id={`line-${i}`}
                    value={d.line}
                    onChange={(e) => handleDialogueChange(i, 'line', e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Step3_Screenplay;
