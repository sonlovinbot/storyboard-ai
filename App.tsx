import React, { useState, useCallback } from 'react';
import { Step, Project } from './types';
import { BREADCRUMB_STEPS, getInitialProjectState } from './constants';
import Breadcrumb from './components/Breadcrumb';
import Step1_Project from './components/Step1_Project';
import Step2_Idea from './components/Step2_Idea';
import Step3_Screenplay from './components/Step3_Screenplay';
import Step4_Characters from './components/Step4_Characters';
import Step5_Shotlist from './components/Step5_Shotlist';
import Step6_Storyboard from './components/Step6_Storyboard';
import Step7_Export from './components/Step7_Export';
import Button from './components/ui/Button';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Project);
  const [project, setProject] = useState<Project>(getInitialProjectState());

  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => (prev < BREADCRUMB_STEPS.length - 1 ? prev + 1 : prev));
  }, []);

  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
  }, []);

  const handleResetProject = () => {
    if (window.confirm("Are you sure you want to reset the project? All progress will be permanently deleted.")) {
      setProject(getInitialProjectState());
      setCurrentStep(Step.Project);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.Project:
        return <Step1_Project project={project} setProject={setProject} goToNextStep={goToNextStep} />;
      case Step.Idea:
        return <Step2_Idea project={project} setProject={setProject} goToNextStep={goToNextStep} />;
      case Step.Screenplay:
        return <Step3_Screenplay project={project} setProject={setProject} goToNextStep={goToNextStep} />;
      case Step.Characters:
        return <Step4_Characters project={project} setProject={setProject} goToNextStep={goToNextStep} />;
      case Step.Shotlist:
        return <Step5_Shotlist project={project} setProject={setProject} goToNextStep={goToNextStep} />;
      case Step.Storyboard:
        return <Step6_Storyboard project={project} setProject={setProject} goToNextStep={goToNextStep} />;
      case Step.Export:
        return <Step7_Export project={project} setProject={setProject} />;
      default:
        return <div>Unknown Step</div>;
    }
  };

  const isStepCompleted = (stepIndex: number): boolean => {
    if (stepIndex < currentStep) return true;
    if (stepIndex === currentStep) {
        switch (stepIndex) {
            case Step.Project: return project.title !== "";
            case Step.Idea: return project.storyConcept !== "";
            case Step.Screenplay: return project.screenplay.length > 0;
            case Step.Characters: 
                return project.characters.length > 0 && 
                       project.characters.every(c => c.imageUrl) &&
                       project.sceneSettings.length > 0 &&
                       project.sceneSettings.some(s => s.imageUrl);
            case Step.Shotlist: return project.shotlist.length > 0;
            case Step.Storyboard: return project.storyboard.length > 0 && project.storyboard.filter(p => p.imageUrl).length >= 6;
            case Step.Export: return false; 
        }
    }
    return false;
  }
  
  const handleBreadcrumbClick = (index: number) => {
    if (index < currentStep || isStepCompleted(index - 1)) {
        goToStep(index);
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8 flex flex-col">
      <header className="relative text-center mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            Storyboard AI
          </h1>
          <p className="text-brand-text-dark mt-2">From Idea to Screenplay to Storyboard</p>
        </div>
        {currentStep > Step.Project && (
          <div className="absolute top-1/2 -translate-y-1/2 right-0">
            <Button variant="danger" onClick={handleResetProject}>
              Reset Project
            </Button>
          </div>
        )}
      </header>
      
      <Breadcrumb
        steps={BREADCRUMB_STEPS}
        currentStep={currentStep}
        onStepClick={handleBreadcrumbClick}
      />

      <main className="flex-grow bg-brand-surface rounded-xl p-6 md:p-8 mt-6 shadow-2xl shadow-indigo-900/20">
        {renderStep()}
      </main>
    </div>
  );
}

export default App;