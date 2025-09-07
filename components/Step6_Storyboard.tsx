
import React, { useState, useEffect, useCallback } from 'react';
import { Project, StoryboardPanel } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Textarea from './ui/Textarea';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

interface StoryboardCardProps {
    panel: StoryboardPanel;
    onGenerate: () => void;
    onUpdate: (newDescription: string) => void;
    onDelete: () => void;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ panel, onGenerate, onUpdate, onDelete }) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState(panel.shot.description);

    const handleSave = () => {
        onUpdate(editedDescription);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedDescription(panel.shot.description);
        setIsEditing(false);
    };

    return (
        <div className="border border-brand-border rounded-lg overflow-hidden flex flex-col">
            <div className="bg-brand-secondary px-4 py-2">
                <h4 className="font-bold text-indigo-400">Scene {panel.shot.sceneNumber}, Shot {panel.shot.shotNumber}</h4>
            </div>
            <div className="aspect-video bg-brand-bg flex items-center justify-center relative">
                {panel.isGenerating && <Spinner />}
                {!panel.isGenerating && panel.imageUrl && (
                    <img src={panel.imageUrl} alt={`Shot ${panel.shot.shotNumber}`} className="w-full h-full object-contain" />
                )}
                 {!panel.isGenerating && !panel.imageUrl && (
                    <div className="text-brand-text-dark text-center p-4">Click "Generate" to create image.</div>
                )}
                
                {panel.shot.vo && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/50 p-2 text-center text-xs text-cyan-300 italic rounded">
                        {panel.shot.vo}
                    </div>
                )}
                {panel.shot.sfx && (
                     <div className="absolute top-2 right-2 bg-black/50 p-2 text-center text-xs text-amber-300 font-bold rounded">
                        {panel.shot.sfx}
                    </div>
                )}
            </div>
            <div className="p-4 bg-brand-secondary/50 flex-grow flex flex-col justify-between">
                <div className="flex-grow">
                    {isEditing ? (
                        <Textarea 
                            label="Shot Description" 
                            value={editedDescription} 
                            onChange={(e) => setEditedDescription(e.target.value)}
                            rows={4}
                            className="text-sm"
                        />
                    ) : (
                        <p className="text-sm text-brand-text-dark">{panel.shot.description}</p>
                    )}
                </div>
                <div className="mt-4 flex flex-col space-y-2">
                   {isEditing ? (
                       <div className="flex space-x-2">
                           <Button onClick={handleSave} size="sm">Save</Button>
                           <Button onClick={handleCancel} variant="secondary" size="sm">Cancel</Button>
                       </div>
                   ) : (
                       <>
                           <Button onClick={onGenerate} isLoading={panel.isGenerating} size="sm">
                               {panel.imageUrl ? "Regenerate" : "Generate"}
                           </Button>
                           <div className="flex space-x-2">
                                <Button variant="secondary" onClick={() => setIsEditing(true)} size="sm" className="flex-1">Edit</Button>
                                <Button variant="danger" onClick={onDelete} size="sm" className="flex-1">Delete</Button>
                           </div>
                           {panel.prompt && (
                               <Button variant="secondary" onClick={() => setShowPrompt(!showPrompt)} size="sm">
                                   {showPrompt ? "Hide" : "Show"} Prompt
                               </Button>
                           )}
                       </>
                   )}
                </div>
            </div>
            {showPrompt && panel.prompt && (
                <div className="p-4 bg-brand-bg border-t border-brand-border">
                     <pre className="text-xs text-brand-text-dark whitespace-pre-wrap font-mono">{panel.prompt}</pre>
                </div>
            )}
        </div>
    )
}


const Step6_Storyboard: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  useEffect(() => {
    if (project.shotlist.length > 0 && project.storyboard.length !== project.shotlist.length) {
      setProject(p => ({
        ...p,
        storyboard: p.shotlist.map(shot => ({ shot, isGenerating: false }))
      }));
    }
  }, [project.shotlist, project.storyboard.length, setProject]);

  const handleGenerateImage = useCallback(async (panelIndex: number) => {
    const panel = project.storyboard[panelIndex];
    if (!panel) return;

    setProject(p => {
        const newStoryboard = [...p.storyboard];
        newStoryboard[panelIndex] = { ...newStoryboard[panelIndex], isGenerating: true };
        return { ...p, storyboard: newStoryboard };
    });

    try {
        const { base64Image, prompt } = await geminiService.generateStoryboardImage(panel.shot, project.characters, project.artStyle);
        setProject(p => {
            const newStoryboard = [...p.storyboard];
            newStoryboard[panelIndex] = { ...newStoryboard[panelIndex], imageUrl: `data:image/png;base64,${base64Image}`, prompt, isGenerating: false };
            return { ...p, storyboard: newStoryboard };
        });
    } catch (e) {
        console.error(e);
        setProject(p => {
            const newStoryboard = [...p.storyboard];
            newStoryboard[panelIndex] = { ...newStoryboard[panelIndex], isGenerating: false };
            return { ...p, storyboard: newStoryboard };
        });
    }
  }, [project.characters, project.artStyle, project.storyboard, setProject]);

  const handleRunAll = async () => {
    setIsGeneratingAll(true);
    for (let i = 0; i < project.storyboard.length; i++) {
        // Only generate if it doesn't have an image yet
        if (!project.storyboard[i].imageUrl) {
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay for rate limiting
            }
            await handleGenerateImage(i);
        }
    }
    setIsGeneratingAll(false);
  };
  
  const handleDeletePanel = (panelIndex: number) => {
      setProject(p => ({
          ...p,
          storyboard: p.storyboard.filter((_, index) => index !== panelIndex)
      }));
  };

  const handleUpdatePanel = (panelIndex: number, newDescription: string) => {
    setProject(p => {
        const newStoryboard = [...p.storyboard];
        const updatedPanel = { ...newStoryboard[panelIndex] };
        updatedPanel.shot = { ...updatedPanel.shot, description: newDescription };
        newStoryboard[panelIndex] = updatedPanel;
        return { ...p, storyboard: newStoryboard };
    });
  };
  
  const canProceed = project.storyboard.filter(p => p.imageUrl).length >= 6;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-text-light">Storyboard</h2>
        <Button onClick={handleRunAll} isLoading={isGeneratingAll}>RUN ALL</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
        {project.storyboard.map((panel, index) => (
            <StoryboardCard 
                key={`panel-${index}-${panel.shot.sceneNumber}-${panel.shot.shotNumber}`} 
                panel={panel} 
                onGenerate={() => handleGenerateImage(index)} 
                onUpdate={(newDesc) => handleUpdatePanel(index, newDesc)}
                onDelete={() => handleDeletePanel(index)}
            />
        ))}
      </div>

       <div className="flex justify-end pt-6 mt-4 border-t border-brand-border">
        <Button onClick={goToNextStep} disabled={!canProceed}>
            Next: Export
        </Button>
      </div>
    </div>
  );
};

export default Step6_Storyboard;