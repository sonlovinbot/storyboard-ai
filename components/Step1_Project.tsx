
import React from 'react';
import { Project } from '../types';
import { GENRES, MAX_CHARACTERS_OPTIONS, MAX_SCENES_OPTIONS, ART_STYLES } from '../constants';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const Step1_Project: React.FC<Props> = ({ project, setProject, goToNextStep }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: name === 'maxCharacters' || name === 'maxScenes' ? parseInt(value) : value }));
  };

  const canProceed = project.title.trim() !== "";

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Create a New Project</h2>
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
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={goToNextStep} disabled={!canProceed}>
            Next: Share Idea
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step1_Project;