import type { InputHTMLAttributes } from 'react';

import { cn } from '../utils/cn';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ className, id, label, error, ...props }: InputProps) => {
  const inputId = id ?? props.name;

  return (
    <label className="input-field" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input id={inputId} className={cn('input', error && 'input--error', className)} {...props} />
      {error ? <small>{error}</small> : null}
    </label>
  );
};
