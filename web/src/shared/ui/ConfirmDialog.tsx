import { Button } from './Button';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmDialogProps) => (
  <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
    <div className="confirm-dialog__panel">
      <h2 id="confirm-dialog-title">{title}</h2>
      <p>{message}</p>
      <div className="confirm-dialog__actions">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);
