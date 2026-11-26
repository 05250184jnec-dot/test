/**
 * DecisionModal - pop-up to approve or reject one registration. Rejecting requires a reason (stored and e-mailed to the user).
 * FRONTEND: component of the "admin" feature, opened by pages/Registrations.jsx and dashboards/pages/AdminDashboard.jsx.
 * TALKS TO (backend): POST /api/admin/users/:id/decision -> routes/adminRoutes.js -> controllers/adminUserController.js (decideUser) -> models/userModel.js (+ services/audit.js)
 * HOW IT WORKS: sends { decision, reason }. The server locks the user row so two admins can't both decide; if another admin already did,
 * it answers ALREADY_DECIDED and we refresh the lists. On success all ['admin'] queries are refetched.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '../adminApi.js';
import { Modal } from '../../../shared/components/Modal.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';

export default function DecisionModal({ user, decision, onClose }) {
  const qc = useQueryClient(); const toast = useToast();
  const [reason, setReason] = useState(''); const [err, setErr] = useState(null);
  const m = useMutation({
    mutationFn: () => adminApi.decideUser(user.id, { decision, reason: reason || undefined }),
    onSuccess: (_d) => { toast(decision === 'approve' ? 'User approved' : 'User rejected'); qc.invalidateQueries({ queryKey: ['admin'] }); onClose(); },
    onError: (e) => { setErr(e.errors?.reason || e.message); if (e.code === 'ALREADY_DECIDED') qc.invalidateQueries({ queryKey: ['admin'] }); },
  });
  const approve = decision === 'approve';
  return (
    <Modal title={`${approve ? 'Approve' : 'Reject'} ${user.name}?`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button>
      <button className={`btn ${approve ? 'btn-primary' : 'btn-danger'}`} disabled={m.isPending} onClick={() => (!approve && reason.trim().length < 3 ? setErr('Please give a short reason') : m.mutate())}>{m.isPending ? 'Saving…' : approve ? 'Approve' : 'Reject'}</button></>}>
      <p>{user.email} · {user.role} · {user.organization || user.college}</p>
      {err && <div className="alert alert-error" role="alert">{err}</div>}
      {!approve && <Field id="rs" label="Reason (shown to the user)"><textarea id="rs" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
      {approve && <p className="muted">They will be e-mailed and can sign in immediately.</p>}
    </Modal>
  );
}
