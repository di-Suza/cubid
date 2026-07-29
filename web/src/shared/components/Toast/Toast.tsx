import type { ToastMessage } from '../../../app/providers/toast/ToastContext';
import { Button } from '../../ui/Button';
import './Toast.css';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast = ({ toast, onDismiss }: ToastProps) => (
  <div className={`toast toast--${toast.tone}`} role="status">
    <span>{toast.message}</span>
    <Button variant="ghost" onClick={() => onDismiss(toast.id)}>
      Close
    </Button>
  </div>
);
