import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-brand-text-light">
        {label}
      </label>
      <div className="mt-2">
        <select
          id={id}
          className="block w-full rounded-md border-0 bg-brand-surface/50 dark:bg-brand-secondary/50 py-1.5 px-3 text-brand-text-light shadow-sm ring-1 ring-inset ring-brand-border focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition-colors"
          {...props}
        >
          {children}
        </select>
      </div>
    </div>
  );
};

export default Select;
