/**
 * Modal.jsx - a pop-up dialog (or side panel) and a ready-made "Are you sure?" dialog.
 * FRONTEND: shared component used by many feature components (SubmitWorkModal, DecisionModal, ...).
 * TALKS TO (backend): none.
 * HOW IT WORKS: the parent decides when to render it (e.g. {open && <Modal .../>}) and passes onClose.
 * Escape key and clicking the dark background both call onClose. ConfirmDialog adds Cancel/Confirm buttons.
 */
import { useEffect } from 'react';

export function Modal({ title, onClose, children, footer, side = false, wide = false }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${side ? 'slide' : ''} ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose, children }) {
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button></>}>
      <p>{message}</p>{children}
    </Modal>
  );
}
