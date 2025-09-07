
import React, { useState, useEffect, useCallback } from 'react';
import { Project, Shot } from '../types';
import * as geminiService from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const ShotRow: React.FC<{ shot: Shot }> = ({ shot }) => {
  return (
    <tr className="border-b border-brand-border hover:bg-brand-secondary/50">
      <td className="px-4 py-3 text-sm">{shot.sceneNumber}.{shot.shotNumber}</td>
      <td className="px-4 py-3">
        <p className="font-semibold">{shot.description}</p>
        {shot.vo && <p className="text-xs text-cyan-400 italic">VO: "{shot.vo}"</p>}
        {shot.sfx && <p className="text-xs text-amber-400 font-bold">SFX: {shot.sfx}</p>}
      </td>
      <td className="px-4 py-3 text-sm">{shot.shotSize}</td>
      <td className="px-4 py-3 text-sm">{shot.perspective}</td>
      <td className="px-4 py-3 text-sm">{shot.movement}</td>
      <td className="px-4 py-3 text-sm">{shot.equipment}</td>
      <td className="px-4 py-3 text-sm">{shot.ert}</td>
    </tr>
  );
};

const Step5_Shotlist: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateShotlist = useCallback(async () => {
    if (project.shotlist.length > 0) return;
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Shotlist</h2>
      
      {isLoading && <Spinner message="Generating shotlist..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!isLoading && !error && project.shotlist.length > 0 && (
        <>
          <div className="overflow-x-auto max-h-[60vh] rounded-lg border border-brand-border">
            <table className="min-w-full divide-y divide-brand-border text-left">
              <thead className="bg-brand-secondary sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">Shot</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">Description</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">Size</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">Angle</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">Move</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">ERT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-brand-bg/50">
                {project.shotlist.map((shot, index) => (
                  <ShotRow key={`${shot.sceneNumber}-${shot.shotNumber}-${index}`} shot={shot} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={goToNextStep} disabled={project.shotlist.length === 0}>
              Next: Create Storyboard
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step5_Shotlist;