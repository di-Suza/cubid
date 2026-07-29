import type { ToastMessage } from '../../../app/providers/toast/ToastContext';
import { Toast } from './Toast';
import './Toast.css';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => (
  <div className="toast-container" aria-live="polite" aria-relevant="additions">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
);
