import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/cn';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export const Button = ({ className, variant = 'primary', icon, children, ...props }: ButtonProps) => (
  <button className={cn('button', `button--${variant}`, className)} type="button" {...props}>
    {icon}
    {children}
  </button>
);
