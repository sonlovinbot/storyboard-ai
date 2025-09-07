import React, { useState, useEffect, useCallback } from 'react';
import { Project, Shot } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const Step5_Shotlist: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [editedShotData, setEditedShotData] = useState<Shot | null>(null);


  const handleGenerateShotlist = useCallback(async (force = false) => {
    if (project.shotlist.length > 0 && !force) return;
    setIsLoading(true);
    setError(null);
    try {
      const { shots } = await geminiService.generateShotlist(project.screenplay);
      setProject(p => ({ ...p, shotlist: shots }));
    } catch (e) {
      console.error(e);
      setError("Failed to generate shotlist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [project.screenplay, project.shotlist.length, setProject]);

  useEffect(() => {
    handleGenerateShotlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerateClick = () => {
    if (window.confirm("Are you sure you want to regenerate the entire shotlist? This will replace the current version.")) {
        handleGenerateShotlist(true);
    }
  };

  const handleOpenEditModal = (shot: Shot) => {
    setEditingShot(shot);
    setEditedShotData(JSON.parse(JSON.stringify(shot))); // Deep copy
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingShot(null);
    setEditedShotData(null);
  };

  const handleShotChange = (field: keyof Shot, value: string) => {
    if (editedShotData) {
        setEditedShotData({ ...editedShotData, [field]: value });
    }
  };

  const handleSaveChanges = () => {
    if (editedShotData && editingShot) {
        setProject(p => ({
            ...p,
            shotlist: p.shotlist.map(s => 
                (s.sceneNumber === editingShot.sceneNumber && s.shotNumber === editingShot.shotNumber) 
                ? editedShotData 
                : s
            )
        }));
    }
    handleCloseEditModal();
  };

  const shotFields: { key: keyof Shot; label: string; type: 'input' | 'textarea' }[] = [
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'vo', label: 'Voice Over', type: 'textarea' },
    { key: 'sfx', label: 'Sound Effect', type: 'textarea' },
    { key: 'music', label: 'Music', type: 'input' },
    { key: 'lighting', label: 'Lighting', type: 'input' },
    { key: 'ert', label: 'ERT', type: 'input' },
    { key: 'shotSize', label: 'Size', type: 'input' },
    { key: 'perspective', label: 'Perspective', type: 'input' },
    { key: 'movement', label: 'Movement', type: 'input' },
    { key: 'equipment', label: 'Equipment', type: 'input' },
    { key: 'lens', label: 'Lens', type: 'input' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Generated Shotlist</h2>
      
      {isLoading && <Spinner message="Generating shotlist..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!isLoading && !error && project.shotlist.length > 0 && (
        <>
          <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            <table className="w-full text-sm text-left text-brand-text-dark">
                <thead className="text-xs text-brand-text-light uppercase bg-brand-secondary/80 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3">Shot</th>
                        <th scope="col" className="px-4 py-3">Description</th>
                        <th scope="col" className="px-4 py-3">Voice Over</th>
                        <th scope="col" className="px-4 py-3">SFX</th>
                        <th scope="col" className="px-4 py-3">ERT</th>
                        <th scope="col" className="px-4 py-3">Size</th>
                        <th scope="col" className="px-4 py-3">Perspective</th>
                        <th scope="col" className="px-4 py-3">Movement</th>
                        <th scope="col" className="px-4 py-3">Equipment</th>
                        <th scope="col" className="px-4 py-3">Lens</th>
                        <th scope="col" className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody>
                    {project.shotlist.map((shot, index) => (
                        <tr key={`${shot.sceneNumber}-${shot.shotNumber}-${index}`} className="border-b border-brand-border hover:bg-brand-secondary/50">
                            <td className="px-4 py-4 font-medium text-brand-text-light whitespace-nowrap">{shot.sceneNumber}.{shot.shotNumber}</td>
                            <td className="px-4 py-4 min-w-[250px]">{shot.description}</td>
                            <td className="px-4 py-4">{shot.vo}</td>
                            <td className="px-4 py-4">{shot.sfx}</td>
                            <td className="px-4 py-4">{shot.ert}</td>
                            <td className="px-4 py-4">{shot.shotSize}</td>
                            <td className="px-4 py-4">{shot.perspective}</td>
                            <td className="px-4 py-4">{shot.movement}</td>
                            <td className="px-4 py-4">{shot.equipment}</td>
                            <td className="px-4 py-4">{shot.lens}</td>
                            <td className="px-4 py-4">
                                <Button size="sm" variant="secondary" onClick={() => handleOpenEditModal(shot)}>Edit</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center pt-6 mt-4 border-t border-brand-border">
            <Button variant="secondary" onClick={handleRegenerateClick}>
              Regenerate Shotlist
            </Button>
            <Button onClick={goToNextStep} disabled={project.shotlist.length === 0}>
              Continue to Storyboard
            </Button>
          </div>
        </>
      )}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={`Edit Shot ${editingShot?.sceneNumber}.${editingShot?.shotNumber}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCloseEditModal}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        }
      >
        {editedShotData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shotFields.map(field => (
                field.type === 'textarea' ? (
                    <Textarea 
                        key={field.key}
                        label={field.label}
                        id={field.key}
                        value={editedShotData[field.key] as string}
                        onChange={(e) => handleShotChange(field.key, e.target.value)}
                        rows={3}
                        className={field.key === 'description' || field.key === 'notes' ? 'md:col-span-2' : ''}
                    />
                ) : (
                    <Input 
                        key={field.key}
                        label={field.label}
                        id={field.key}
                        value={editedShotData[field.key] as string}
                        onChange={(e) => handleShotChange(field.key, e.target.value)}
                    />
                )
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Step5_Shotlist;
