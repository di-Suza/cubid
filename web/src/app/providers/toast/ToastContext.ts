import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
