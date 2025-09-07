
import React from 'react';
import { Project } from '../types';
import Textarea from './ui/Textarea';
import FileUploader from './ui/FileUploader';
import Button from './ui/Button';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  goToNextStep: () => void;
}

const Step2_Idea: React.FC<Props> = ({ project, setProject, goToNextStep }) => {

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProject(prev => ({ ...prev, storyConcept: e.target.value }));
  };

  const handleFileUpload = (content: string) => {
    setProject(prev => ({ ...prev, storyConcept: content }));
  };

  const canProceed = project.storyConcept.trim() !== "";

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-text-light">Share Your Idea</h2>
      <div className="space-y-4">
        <Textarea
          label="Describe your story idea"
          id="storyConcept"
          name="storyConcept"
          value={project.storyConcept}
          onChange={handleTextChange}
          rows={10}
          placeholder="A lone astronaut stranded on a distant planet discovers she's not alone..."
        />
        <div className="text-center text-brand-text-dark">OR</div>
        <FileUploader 
          onFileUpload={handleFileUpload} 
          acceptedFileTypes=".txt" 
        />
      </div>
      <div className="flex justify-end pt-6">
        <Button onClick={goToNextStep} disabled={!canProceed}>
          Generate Screenplay
        </Button>
      </div>
    </div>
  );
};

export default Step2_Idea;
