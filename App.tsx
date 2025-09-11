
import React, { useState, useCallback, useEffect } from 'react';
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

// --- ICONS ---
const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-primary">
        <path d="M7 4V20M17 4V20M4 7H10M4 17H10M14 7H20M14 17H20M4 4H20V7H4V4ZM4 17H20V20H4V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.95-.464l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm14 0a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1z" clipRule="evenodd" />
  </svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Project);
  const [project, setProject] = useState<Project>(getInitialProjectState());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeChange = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => (prev < BREADCRUMB_STEPS.length - 1 ? prev + 1 : prev));
  }, []);

  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
  }, []);

  const handleResetProject = () => {
    if (window.confirm("Are you sure you want to start a new project? All current progress will be permanently deleted.")) {
      setProject(getInitialProjectState());
      setCurrentStep(Step.Project);
      setIsMenuOpen(false);
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

  const MenuContent = () => (
    <>
       {currentStep > Step.Project && (
          <Button variant="danger" onClick={handleResetProject} size="sm" className="w-full justify-center md:w-auto">
            New Project
          </Button>
      )}
      <button
        onClick={handleThemeChange}
        className="p-2 rounded-full bg-brand-secondary hover:bg-brand-border text-brand-text-dark hover:text-brand-text-light transition-colors"
        aria-label="Toggle theme"
      >
        <span className="dark:hidden"><MoonIcon /></span>
        <span className="hidden dark:inline"><SunIcon /></span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8 flex flex-col">
       <header className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <LogoIcon />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-brand-text-light">
                Storyboard AI
              </h1>
              <p className="text-xs text-brand-text-dark hidden sm:block">From Idea to Storyboard</p>
            </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-4">
          <MenuContent />
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden p-2 rounded-md hover:bg-brand-secondary transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Mobile Menu Panel */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`fixed top-0 right-0 z-50 h-full w-64 bg-brand-surface/80 dark:bg-brand-surface/50 backdrop-blur-xl border-l border-brand-border/20 p-6 transform transition-transform md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-semibold text-brand-text-light">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1 rounded-md hover:bg-brand-secondary"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex flex-col items-start gap-4">
          <MenuContent />
        </div>
      </aside>
      
      <Breadcrumb
        steps={BREADCRUMB_STEPS}
        currentStep={currentStep}
        onStepClick={handleBreadcrumbClick}
      />

      <main className="flex-grow bg-brand-surface/50 dark:bg-brand-surface/20 backdrop-blur-lg border border-brand-border/20 rounded-xl p-6 md:p-8 mt-6 shadow-2xl shadow-indigo-900/10">
        {renderStep()}
      </main>
    </div>
  );
}

export default App;
