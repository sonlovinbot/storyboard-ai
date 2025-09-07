
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-brand-text-light">
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          className="block w-full rounded-md border-0 bg-white/5 py-1.5 px-3 text-brand-text-light shadow-sm ring-1 ring-inset ring-brand-border focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;
