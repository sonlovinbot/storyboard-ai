

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, StoryboardPanel, Shot } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Textarea from './ui/Textarea';
import Modal from './ui/Modal';
import Input from './ui/Input';
import ImageUploader from './ui/ImageUploader';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const ShotDetail: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <span className="font-semibold text-green-400">{label}:</span>
      <span className="ml-2 text-brand-text-light">{value}</span>
    </div>
  );
};

interface StoryboardCardProps {
    panel: StoryboardPanel;
    sceneTitle: string;
    onGenerate: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ panel, sceneTitle, onGenerate, onEdit, onDelete }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyDetails = () => {
        const dialogueText = panel.shot.dialogue
            .map(d => `${d.character.toUpperCase()}:\n"${d.line}"`)
            .join('\n\n');

        const voText = panel.shot.vo ? `VO:\n"${panel.shot.vo}"` : '';
        
        const combinedDialogue = [dialogueText, voText].filter(Boolean).join('\n\n');

        const contentToCopy = [
            `Shot Type: ${panel.shot.shotSize || 'N/A'}`,
            `Duration: ${panel.shot.ert || 'N/A'}`,
            `Scene: ${sceneTitle || 'N/A'}`,
            `Lighting: ${panel.shot.lighting || 'N/A'}`,
            `Camera: ${panel.shot.movement || 'N/A'}`,
            `Notes: ${panel.shot.notes || 'N/A'}`,
            combinedDialogue,
            panel.shot.music ? `♪ ${panel.shot.music}` : '',
            panel.shot.sfx ? `🔊 ${panel.shot.sfx}` : '',
        ].filter(Boolean).join('\n\n');

        navigator.clipboard.writeText(contentToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="border border-brand-border bg-brand-secondary/50 rounded-lg overflow-hidden flex flex-col">
            <div className="aspect-video bg-brand-bg flex items-center justify-center relative">
                {panel.isGenerating && <Spinner />}
                {!panel.isGenerating && panel.imageUrl && (
                    <img src={panel.imageUrl} alt={`Shot ${panel.shot.shotNumber}`} className="w-full h-full object-contain" />
                )}
                 {!panel.isGenerating && !panel.imageUrl && (
                    <div className="text-brand-text-dark text-center p-4">Click "Generate" to create image.</div>
                )}
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-indigo-400">Scene {panel.shot.sceneNumber}, Shot {panel.shot.shotNumber}</h4>
                    <p className="text-sm text-brand-text-dark mt-1">{panel.shot.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs mt-3 border-t border-brand-border pt-3">
                        <ShotDetail label="Shot Type" value={panel.shot.shotSize} />
                        <ShotDetail label="Duration" value={panel.shot.ert} />
                        <ShotDetail label="Scene" value={sceneTitle} />
                        <ShotDetail label="Lighting" value={panel.shot.lighting} />
                        <ShotDetail label="Camera" value={panel.shot.movement} />
                        <ShotDetail label="Notes" value={panel.shot.notes} />
                    </div>

                    {panel.shot.dialogue && panel.shot.dialogue.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-brand-border pt-3">
                        {panel.shot.dialogue.map((d, i) => (
                            <div key={i} className="bg-green-900/30 border-l-4 border-green-400 rounded p-2 text-sm">
                            <p className="font-bold text-green-300">{d.character.toUpperCase()}:</p>
                            <p className="text-brand-text-light pl-2 italic">"{d.line}"</p>
                            </div>
                        ))}
                        </div>
                    )}

                    {(panel.shot.music || panel.shot.sfx) && (
                        <div className="flex flex-wrap gap-2 mt-3 border-t border-brand-border pt-3">
                            {panel.shot.music && <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full flex items-center gap-1">♪ {panel.shot.music}</div>}
                            {panel.shot.sfx && <div className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full flex items-center gap-1">🔊 {panel.shot.sfx}</div>}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-brand-border flex flex-col space-y-2">
                   <Button onClick={onGenerate} isLoading={panel.isGenerating} size="sm">
                       {panel.imageUrl ? "Regenerate" : "Generate"}
                   </Button>
                   <div className="flex space-x-2">
                        <Button variant="secondary" onClick={onEdit} size="sm" className="flex-1">Edit</Button>
                        <Button variant="secondary" onClick={handleCopyDetails} size="sm" className="flex-1">
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button variant="danger" onClick={onDelete} size="sm" className="flex-1">Delete</Button>
                   </div>
                </div>
            </div>
        </div>
    )
}


const Step6_Storyboard: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const stopRunAllRef = useRef(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPanelIndex, setEditingPanelIndex] = useState<number | null>(null);
  const [editedPanelData, setEditedPanelData] = useState<StoryboardPanel | null>(null);
  
  type ModalReferenceImage = { id: string; mimeType: string; data: string; title: string };
  const [modalReferenceImages, setModalReferenceImages] = useState<ModalReferenceImage[]>([]);

  // Refs for drag and drop
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    if (project.shotlist.length > 0 && project.storyboard.length !== project.shotlist.length) {
      setProject(p => ({
        ...p,
        storyboard: p.shotlist.map(shot => ({ shot, isGenerating: false }))
      }));
    }
  }, [project.shotlist, project.storyboard.length, setProject]);

  const handleGenerateImage = useCallback(async (
    panelIndex: number, 
    panelData?: StoryboardPanel, 
    overrideImages?: { mimeType: string; data: string }[]
  ) => {
    const panelToGenerate = panelData || project.storyboard[panelIndex];
    if (!panelToGenerate) return;

    setProject(p => {
        const newStoryboard = [...p.storyboard];
        newStoryboard[panelIndex] = { ...newStoryboard[panelIndex], isGenerating: true };
        return { ...p, storyboard: newStoryboard };
    });

    try {
        const { base64Image, prompt } = await geminiService.generateStoryboardImage(
            panelToGenerate.shot, 
            project.characters, 
            project.sceneSettings, 
            project.artStyle,
            project.aspectRatio,
            overrideImages
        );
        setProject(p => {
            const newStoryboard = [...p.storyboard];
            newStoryboard[panelIndex] = { 
                ...panelToGenerate,
                imageUrl: `data:image/png;base64,${base64Image}`, 
                prompt, 
                isGenerating: false 
            };
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
  }, [project.characters, project.sceneSettings, project.artStyle, project.aspectRatio, project.storyboard, setProject]);

  const handleRunAll = async () => {
    setIsGeneratingAll(true);
    stopRunAllRef.current = false;
    for (let i = 0; i < project.storyboard.length; i++) {
        if (stopRunAllRef.current) break;
        if (!project.storyboard[i].imageUrl) {
            await handleGenerateImage(i);
            if (i < project.storyboard.length -1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    setIsGeneratingAll(false);
    stopRunAllRef.current = false;
  };

  const handleStopRunAll = () => {
    stopRunAllRef.current = true;
  }
  
  const handleDeletePanel = (panelIndex: number) => {
      setProject(p => ({
          ...p,
          storyboard: p.storyboard.filter((_, index) => index !== panelIndex)
      }));
  };

  // --- Edit Modal Logic ---
  const handleOpenEditModal = (index: number) => {
    const panel = project.storyboard[index];
    setEditingPanelIndex(index);
    setEditedPanelData(JSON.parse(JSON.stringify(panel)));

    const allImagesById = new Map<string, { id: string; url: string; title: string }>();
    project.characters.filter(c => c.imageUrl).forEach(c => allImagesById.set(c.id, { id: c.id, url: c.imageUrl!, title: `Character: ${c.name}` }));
    project.sceneSettings.filter(s => s.imageUrl).forEach(s => allImagesById.set(s.id, { id: s.id, url: s.imageUrl!, title: `Scene: ${s.description.substring(0, 20)}...` }));
    
    let initialModalImages: ModalReferenceImage[] = [];

    if (panel.referenceImageIds && panel.referenceImageIds.length > 0) {
        panel.referenceImageIds.forEach(id => {
            const imageData = allImagesById.get(id);
            if (imageData) {
                const [meta, data] = imageData.url.split(',');
                const mimeType = meta.match(/:(.*?);/)?.[1];
                if (data && mimeType) {
                    initialModalImages.push({ id, mimeType, data, title: imageData.title });
                }
            }
        });
    } else {
        const relevantChars = project.characters.filter(c => new RegExp(`\\b${c.name}\\b`, 'i').test(panel.shot.description) && c.imageUrl);
        const sceneSettingsWithImages = project.sceneSettings.filter(s => s.imageUrl);

        const charImages: ModalReferenceImage[] = relevantChars.map(c => ({
            id: c.id, mimeType: 'image/png', data: c.imageUrl!.split(',')[1], title: `Character: ${c.name}`
        }));
        const sceneSettingsImages: ModalReferenceImage[] = sceneSettingsWithImages.map(s => ({
            id: s.id, mimeType: 'image/png', data: s.imageUrl!.split(',')[1], title: `Scene: ${s.description.substring(0, 20)}...`
        }));
        initialModalImages = [...charImages, ...sceneSettingsImages];
    }
    
    setModalReferenceImages(initialModalImages);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPanelIndex(null);
    setEditedPanelData(null);
  };

  const handlePanelDataChange = (field: keyof Shot | 'prompt', value: string) => {
    if (editedPanelData) {
        if (field === 'prompt') {
            setEditedPanelData({ ...editedPanelData, prompt: value });
        } else {
            const newShot = { ...editedPanelData.shot, [field]: value };
            setEditedPanelData({ ...editedPanelData, shot: newShot });
        }
    }
  };

  const getUpdatedPanelWithReferences = (): StoryboardPanel | null => {
      if (editedPanelData) {
          const referenceImageIds = modalReferenceImages.map(img => img.id);
          return { ...editedPanelData, referenceImageIds };
      }
      return null;
  }

  const handleSavePanel = () => {
    const updatedPanel = getUpdatedPanelWithReferences();
    if (updatedPanel && editingPanelIndex !== null) {
      setProject(p => {
        const newStoryboard = [...p.storyboard];
        newStoryboard[editingPanelIndex] = updatedPanel;
        return { ...p, storyboard: newStoryboard };
      });
    }
    handleCloseEditModal();
  };
  
  const handleSaveAndRegenerate = () => {
      const updatedPanel = getUpdatedPanelWithReferences();
      if (updatedPanel && editingPanelIndex !== null) {
          setProject(p => {
            const newStoryboard = [...p.storyboard];
            newStoryboard[editingPanelIndex] = updatedPanel;
            return { ...p, storyboard: newStoryboard };
          });
          
          const imagesForApi = modalReferenceImages.map(({ id, title, ...rest}) => rest);
          handleGenerateImage(editingPanelIndex, updatedPanel, imagesForApi);
      }
      handleCloseEditModal();
  }

  const handleNewReferenceUpload = (base64: string) => {
      const [meta, data] = base64.split(',');
      const mimeType = meta.match(/:(.*?);/)?.[1];
      if (data && mimeType) {
          setModalReferenceImages(prev => [...prev, {
            id: `new-${Date.now()}`, mimeType, data, title: 'Uploaded Reference'
          }]);
      }
  }

    const allProjectImages = [
        ...project.characters.filter(c => c.imageUrl).map(c => ({
            id: c.id,
            url: c.imageUrl!,
            title: `Character: ${c.name}`
        })),
        ...project.sceneSettings.filter(s => s.imageUrl).map(s => ({
            id: s.id,
            url: s.imageUrl!,
            title: `Scene: ${s.description.substring(0, 20)}...`
        }))
    ];

    const handleAddReferenceFromPalette = (image: { id: string; url: string; title: string }) => {
        if (modalReferenceImages.some(ref => ref.id === image.id)) return;
        
        const [meta, data] = image.url.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1];
        if (data && mimeType) {
            setModalReferenceImages(prev => [...prev, {
                id: image.id, mimeType, data, title: image.title
            }]);
        }
    };

    const handleDragStartPalette = (e: React.DragEvent, imageId: string) => {
        e.dataTransfer.setData('application/storyboard-image-id', imageId);
    };

    const handleDropOnActive = (e: React.DragEvent) => {
        e.preventDefault();
        const imageId = e.dataTransfer.getData('application/storyboard-image-id');
        if (imageId) {
            const imageToAdd = allProjectImages.find(img => img.id === imageId);
            if (imageToAdd) {
                handleAddReferenceFromPalette(imageToAdd);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

  const handleDeleteReferenceImage = (id: string) => {
    setModalReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newImages = [...modalReferenceImages];
    const dragItemIndex = newImages.findIndex(img => img.id === dragItem.current);
    const dragOverItemIndex = newImages.findIndex(img => img.id === dragOverItem.current);
    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;
    const [reorderedItem] = newImages.splice(dragItemIndex, 1);
    newImages.splice(dragOverItemIndex, 0, reorderedItem);
    setModalReferenceImages(newImages);
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const canProceed = project.storyboard.filter(p => p.imageUrl).length >= 6;
  const editingPanel = editingPanelIndex !== null ? project.storyboard[editingPanelIndex] : null;


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-text-light">Storyboard</h2>
        <Button onClick={isGeneratingAll ? handleStopRunAll : handleRunAll} isLoading={isGeneratingAll}>
            {isGeneratingAll ? 'STOP' : 'RUN ALL'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
        {project.storyboard.map((panel, index) => {
            const scene = project.screenplay.find(s => s.sceneNumber === panel.shot.sceneNumber);
            return (
                <StoryboardCard 
                    key={`panel-${index}-${panel.shot.sceneNumber}-${panel.shot.shotNumber}`} 
                    panel={panel} 
                    sceneTitle={scene?.title || ''}
                    onGenerate={() => handleGenerateImage(index)} 
                    onEdit={() => handleOpenEditModal(index)}
                    onDelete={() => handleDeletePanel(index)}
                />
            );
        })}
      </div>

       <div className="flex justify-end pt-6 mt-4 border-t border-brand-border">
        <Button onClick={goToNextStep} disabled={!canProceed}>
            Next: Export
        </Button>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={`Edit Shot ${editingPanel?.shot.sceneNumber}.${editingPanel?.shot.shotNumber}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCloseEditModal}>Cancel</Button>
            <Button variant="secondary" onClick={handleSavePanel}>Save Changes</Button>
            <Button onClick={handleSaveAndRegenerate}>Save & Regenerate</Button>
          </div>
        }
      >
        {editedPanelData && (
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-brand-text-light mb-2">Image Palette</h4>
                    <p className="text-sm text-brand-text-dark mb-2">Click or drag an image to add it to the active references for this shot.</p>
                    <div className="flex flex-wrap gap-2 p-2 bg-brand-bg rounded-md border border-brand-border h-28 overflow-y-auto">
                        {allProjectImages.length === 0 && <p className="text-sm text-brand-text-dark p-4 text-center w-full">No character or scene images generated yet.</p>}
                        {allProjectImages.map(img => (
                            <img 
                                key={img.id}
                                src={img.url}
                                alt={img.title}
                                title={img.title}
                                draggable
                                onDragStart={(e) => handleDragStartPalette(e, img.id)}
                                className="h-20 w-20 object-cover rounded cursor-pointer hover:ring-2 ring-indigo-500 transition-all"
                                onClick={() => handleAddReferenceFromPalette(img)}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-brand-text-light mb-2">Active Reference Images</h4>
                    <div 
                        className="flex flex-wrap gap-2 p-2 bg-brand-bg rounded-md border border-brand-border min-h-[6rem]"
                        onDrop={handleDropOnActive}
                        onDragOver={handleDragOver}
                    >
                        {modalReferenceImages.length === 0 && <p className="text-sm text-brand-text-dark p-4 text-center w-full">Add references from the palette or upload new ones.</p>}
                        {modalReferenceImages.map((img) => (
                            <div 
                                key={img.id} 
                                className="relative group cursor-grab"
                                draggable
                                onDragStart={() => (dragItem.current = img.id)}
                                onDragEnter={() => (dragOverItem.current = img.id)}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <img 
                                    src={`data:${img.mimeType};base64,${img.data}`} 
                                    alt={img.title} 
                                    className="h-20 w-20 object-cover rounded" 
                                    title={img.title} 
                                />
                                <button 
                                    onClick={() => handleDeleteReferenceImage(img.id)}
                                    className="absolute top-0 right-0 m-1 bg-black/50 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Delete image"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                     <div className="mt-2 flex items-end gap-4">
                        <ImageUploader label="Upload New" onImageUpload={handleNewReferenceUpload} />
                    </div>
                </div>
                 <Textarea 
                    label="AI Prompt"
                    value={editedPanelData.prompt || ''}
                    onChange={(e) => handlePanelDataChange('prompt', e.target.value)}
                    rows={6}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Textarea label="Description" value={editedPanelData.shot.description} onChange={(e) => handlePanelDataChange('description', e.target.value)} rows={3} className="md:col-span-2" />
                     <Input label="Shot Size" value={editedPanelData.shot.shotSize} onChange={(e) => handlePanelDataChange('shotSize', e.target.value)} />
                     <Input label="ERT" value={editedPanelData.shot.ert} onChange={(e) => handlePanelDataChange('ert', e.target.value)} />
                     <Input label="Perspective" value={editedPanelData.shot.perspective} onChange={(e) => handlePanelDataChange('perspective', e.target.value)} />
                     <Input label="Movement" value={editedPanelData.shot.movement} onChange={(e) => handlePanelDataChange('movement', e.target.value)} />
                     <Input label="Lighting" value={editedPanelData.shot.lighting} onChange={(e) => handlePanelDataChange('lighting', e.target.value)} />
                     <Input label="Music" value={editedPanelData.shot.music} onChange={(e) => handlePanelDataChange('music', e.target.value)} />
                     <Textarea label="Voice Over" value={editedPanelData.shot.vo} onChange={(e) => handlePanelDataChange('vo', e.target.value)} rows={2} />
                     <Textarea label="Sound Effects" value={editedPanelData.shot.sfx} onChange={(e) => handlePanelDataChange('sfx', e.target.value)} rows={2} />
                     <Textarea label="Notes" value={editedPanelData.shot.notes} onChange={(e) => handlePanelDataChange('notes', e.target.value)} rows={2} className="md:col-span-2" />
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
};

export default Step6_Storyboard;