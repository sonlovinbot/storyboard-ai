import React from 'react';

interface BreadcrumbProps {
  steps: string[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex flex-wrap items-center justify-center gap-y-4 gap-x-2 sm:gap-x-4">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center">
            <button
              onClick={() => onStepClick(index)}
              className={`flex flex-col items-center text-center p-2 rounded-lg transition-colors duration-300 ${index <= currentStep ? 'cursor-pointer hover:bg-brand-secondary' : 'cursor-not-allowed'}`}
              disabled={index > currentStep}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300
                  ${index < currentStep ? 'bg-indigo-600 text-white' : ''}
                  ${index === currentStep ? 'bg-brand-primary ring-2 ring-offset-2 ring-offset-brand-bg ring-brand-primary text-white' : ''}
                  ${index > currentStep ? 'bg-brand-secondary text-brand-text-dark' : ''}
                `}
              >
                {index < currentStep ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-xs sm:text-sm font-medium ${index <= currentStep ? 'text-brand-text-light' : 'text-brand-text-dark'}`}>{step}</span>
            </button>

            {index !== steps.length - 1 && (
              <div className="hidden sm:block w-8 sm:w-16 h-0.5 bg-brand-border/50 mx-2" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
