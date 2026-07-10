import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * Confirmation dialog for critical/irreversible actions. If `requireNote` is
 * set, the confirm button stays disabled until a note of at least
 * `minNoteLength` characters is entered (used for reject/return/completion
 * reasons, which are mandatory per the business rules).
 */
function ConfirmDialog({ title, message, requireNote = false, minNoteLength = 10, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  const [note, setNote] = useState('');
  const noteValid = !requireNote || note.trim().length >= minNoteLength;

  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      {requireNote && (
        <div className="form-field">
          <label htmlFor="confirm-note">Reason (required, min {minNoteLength} characters)</label>
          <textarea
            id="confirm-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the reason for this decision..."
          />
        </div>
      )}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} disabled={!noteValid} onClick={() => onConfirm(note)}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
