import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  size?: 'sm' | 'md';
  credit?: number;
}

const CoinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v1.076a4.5 4.5 0 00-1.581 1.088l-.494-.494a1 1 0 00-1.414 1.414l.494.494A4.5 4.5 0 004 10.5v1.076a4.5 4.5 0 001.088 1.581l-.494.494a1 1 0 101.414 1.414l.494-.494A4.5 4.5 0 008.5 16v1.076a1 1 0 102 0V16a4.5 4.5 0 001.581-1.088l.494.494a1 1 0 101.414-1.414l-.494-.494A4.5 4.5 0 0016 11.576V10.5a4.5 4.5 0 00-1.088-1.581l.494-.494a1 1 0 10-1.414-1.414l-.494.494A4.5 4.5 0 0011.5 6V5zM6 10.5a2.5 2.5 0 012.5-2.5h1a2.5 2.5 0 012.5 2.5v1a2.5 2.5 0 01-2.5 2.5h-1a2.5 2.5 0 01-2.5-2.5v-1z" clipRule="evenodd" />
    </svg>
);

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, size = 'md', className = '', credit, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5";
  
  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary',
    secondary: 'bg-brand-secondary text-brand-text-light hover:bg-brand-border focus:ring-brand-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  const creditPillClasses = {
      primary: 'bg-white/90 text-brand-primary',
      secondary: 'bg-brand-bg text-brand-text-light',
      danger: 'bg-white/90 text-red-600'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
      {typeof credit === 'number' && (
          <span className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${creditPillClasses[variant]}`}>
              <CoinIcon className="w-3.5 h-3.5 mr-1"/>
              {credit}
          </span>
      )}
    </button>
  );
};

export default Button;
