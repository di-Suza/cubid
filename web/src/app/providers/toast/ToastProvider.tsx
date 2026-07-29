import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { ToastContainer } from '../../../shared/components/Toast/ToastContainer';
import { ToastContext, type ToastMessage, type ToastTone } from './ToastContext';

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismissToast(id), 5000);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast
    }),
    [dismissToast, showToast, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};
