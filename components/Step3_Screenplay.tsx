
import React, { useState, useEffect, useCallback } from 'react';
import { Project, Scene } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Card from './ui/Card';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const SceneCard: React.FC<{ scene: Scene }> = ({ scene }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <Card className="mb-4 bg-brand-bg/50">
      <h3 className="text-xl font-bold text-indigo-400">{scene.title} (Scene {scene.sceneNumber})</h3>
      <p className="mt-2 text-brand-text-dark italic">{scene.description}</p>
      <div className="mt-4 space-y-3">
        {scene.dialogue.map((d, i) => (
          <div key={i}>
            <p className="font-semibold text-brand-text-light">{d.character.toUpperCase()}</p>
            <p className="ml-4 text-brand-text-light">{d.line}</p>
          </div>
        ))}
      </div>
      {scene.prompt && (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setShowPrompt(!showPrompt)}>
            {showPrompt ? 'Hide' : 'Show'} AI Prompt
          </Button>
          {showPrompt && (
            <pre className="mt-2 p-3 bg-brand-bg text-xs text-brand-text-dark rounded-md whitespace-pre-wrap font-mono">
              {scene.prompt}
            </pre>
          )}
        </div>
      )}
    </Card>
  );
};

const Step3_Screenplay: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateScreenplay = useCallback(async () => {
    if (project.screenplay.length > 0) return;
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

  useEffect(() => {
    handleGenerateScreenplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Screenplay</h2>
      
      {isLoading && <Spinner message="Generating screenplay..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!isLoading && !error && (
        <>
          <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
            {project.screenplay.map((scene) => (
              <SceneCard key={scene.sceneNumber} scene={scene} />
            ))}
          </div>
          <div className="flex justify-end pt-6 mt-4 border-t border-brand-border">
            <Button onClick={goToNextStep} disabled={project.screenplay.length === 0}>
              Next: Create Characters
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step3_Screenplay;