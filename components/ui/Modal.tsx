import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" aria-labelledby="modal-title" role="dialog" aria-modal="true" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-4xl mx-4 my-8 bg-brand-surface/80 dark:bg-brand-surface/50 backdrop-blur-xl border border-brand-border/20 rounded-lg shadow-xl transform transition-all"
      >
        <div className="flex items-start justify-between p-5 border-b border-solid border-brand-border rounded-t">
          <h3 className="text-2xl font-semibold text-brand-text-light" id="modal-title">
            {title}
          </h3>
          <button onClick={onClose} className="p-1 ml-auto bg-transparent border-0 text-brand-text-dark hover:text-brand-text-light float-right text-3xl leading-none font-semibold outline-none focus:outline-none">
            <span className="h-6 w-6 text-2xl block">×</span>
          </button>
        </div>
        <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto">
            {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end p-6 border-t border-solid border-brand-border rounded-b">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
