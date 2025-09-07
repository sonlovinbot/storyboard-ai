import React, { useRef } from 'react';
import { Project } from '../types';
import { GENRES, MAX_CHARACTERS_OPTIONS, MAX_SCENES_OPTIONS, ART_STYLES, ASPECT_RATIOS } from '../constants';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const Step1_Project: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: name === 'maxCharacters' || name === 'maxScenes' ? parseInt(value) : value }));
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProject = JSON.parse(e.target?.result as string);
          setProject(importedProject);
          alert('Project imported successfully! The project data is loaded. You can now navigate to the relevant step using the breadcrumb.');
        } catch (error) {
          alert('Failed to import project. The file may be corrupt.');
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const canProceed = project.title.trim() !== "";

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Project Setup</h2>
      
      <div className="bg-brand-secondary p-6 md:p-8 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-center mb-6 text-brand-text-light">Start a New Project</h3>
        <div className="space-y-6">
          <Input 
            label="Project Title" 
            id="title"
            name="title"
            value={project.title} 
            onChange={handleChange} 
            placeholder="e.g., Cyberpunk Detective"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Genre" id="genre" name="genre" value={project.genre} onChange={handleChange}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select label="Art Style" id="artStyle" name="artStyle" value={project.artStyle} onChange={handleChange}>
              {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Max Characters" id="maxCharacters" name="maxCharacters" value={project.maxCharacters} onChange={handleChange}>
              {MAX_CHARACTERS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
            <Select label="Max Scenes" id="maxScenes" name="maxScenes" value={project.maxScenes} onChange={handleChange}>
              {MAX_SCENES_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
            <Select label="Aspect Ratio" id="aspectRatio" name="aspectRatio" value={project.aspectRatio} onChange={handleChange}>
              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t border-brand-border">
          <Button onClick={goToNextStep} disabled={!canProceed}>
            Next: Share Idea
          </Button>
        </div>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-brand-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-brand-surface px-2 text-sm text-brand-text-dark">OR</span>
        </div>
      </div>

      <div className="bg-brand-secondary p-6 md:p-8 rounded-lg shadow-lg text-center">
        <h3 className="text-xl font-semibold text-brand-text-light">Load Existing Project</h3>
        <p className="mt-2 text-sm text-brand-text-dark">Continue working on a project you saved earlier from the 'Export' step.</p>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="mt-4">
          Import Project (.json)
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
      </div>
    </div>
  );
};

export default Step1_Project;
