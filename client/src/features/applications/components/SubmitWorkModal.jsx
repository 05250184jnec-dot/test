/**
 * SubmitWorkModal - pop-up where an accepted student sends their finished work (note + optional link).
 * FRONTEND: component of the "applications" feature, opened by pages/StudentApplications.jsx.
 * TALKS TO (backend): POST /api/student/applications/:id/submit -> routes/studentRoutes.js
 *   -> controllers/studentApplicationController.js (submitWork) -> models/applicationModel.js, submissionModel.js
 * HOW IT WORKS: needs a note of 10+ characters (checked here and on the server). The link must be http/https. On success
 * we refresh the ['student'] queries and close; the employer is notified by the server (e-mail + live notification).
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import { Modal } from '../../../shared/components/Modal.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';

export default function SubmitWorkModal({ a, onClose }) {
  const qc = useQueryClient(); const toast = useToast();
  const [f, setF] = useState({ note: '', link: '' }); const [err, setErr] = useState({});
  const m = useMutation({
    mutationFn: () => applicationApi.submitWork(a.id, { note: f.note, link: f.link }),
    onSuccess: () => { toast('Work submitted'); qc.invalidateQueries({ queryKey: ['student'] }); onClose(); }, onError: (e) => setErr(e.errors || { note: e.message }),
  });
  return (
    <Modal title={`Submit work · ${a.taskTitle}`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={m.isPending} onClick={() => (f.note.trim().length < 10 ? setErr({ note: 'Describe your work (10+ characters)' }) : m.mutate())}>{m.isPending ? 'Submitting…' : 'Submit'}</button></>}>
      <Field id="note" label="Note to the employer" error={err.note}><textarea id="note" className="input" rows={5} maxLength={3000} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <Field id="link" label="Link to your work (optional)" error={err.link} hint="Google Drive, GitHub, Figma… (http/https)"><input id="link" className="input" type="url" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} /></Field>
    </Modal>
  );
}
