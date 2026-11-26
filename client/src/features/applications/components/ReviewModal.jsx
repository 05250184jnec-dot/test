/**
 * ReviewModal - pop-up where the employer approves submitted work (rating + feedback -> certificate) or asks for changes.
 * FRONTEND: component of the "applications" feature, opened by pages/ReviewWork.jsx.
 * TALKS TO (backend): GET /api/employer/applications/:id (to read the submission) and POST /api/employer/applications/:id/review
 *   -> routes/employerRoutes.js -> controllers/employerApplicationController.js (review) -> models/applicationModel.js, submissionModel.js, feedbackModel.js, certificateModel.js
 * HOW IT WORKS: two modes switched by tabs. "Approve" sends { decision:'complete', rating, comment }; the server then (in ONE database
 * transaction) completes the work, saves feedback and creates the certificate. "Request changes" sends { decision:'revision', note }.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import { Modal } from '../../../shared/components/Modal.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { DataState } from '../../../shared/components/Loading.jsx';
import { Stars } from '../../../shared/components/Badges.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';

export default function ReviewModal({ a, onClose }) {
  const qc = useQueryClient(); const toast = useToast();
  const d = useQuery({ queryKey: ['employer', 'application', a.id], queryFn: () => applicationApi.employerApplicationDetail(a.id) });
  const [mode, setMode] = useState('complete'); const [rating, setRating] = useState(5); const [comment, setComment] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState(null);
  const m = useMutation({
    mutationFn: () => applicationApi.reviewApplication(a.id, mode === 'complete' ? { decision: 'complete', rating, comment } : { decision: 'revision', note }),
    onSuccess: () => { toast(mode === 'complete' ? 'Completed. Certificate issued 🎓' : 'Changes requested'); qc.invalidateQueries({ queryKey: ['employer'] }); onClose(); }, onError: (e) => setErr(e.errors?.note || e.errors?.rating || e.message),
  });
  const latest = d.data?.submissions?.[0];
  return (
    <Modal title={`${a.studentName} · ${a.taskTitle}`} onClose={onClose} wide footer={<><button className="btn" onClick={onClose}>Close</button><button className="btn btn-primary" disabled={m.isPending} onClick={() => (mode === 'revision' && note.trim().length < 3 ? setErr('Explain what to change') : m.mutate())}>{mode === 'complete' ? 'Mark completed' : 'Request changes'}</button></>}>
      <DataState q={d} rows={1}>{() => (<div className="stack">
        {latest ? <div className="card soft"><b>Submitted work</b><p className="pre">{latest.note}</p>{latest.link && <a href={latest.link} target="_blank" rel="noopener noreferrer">{latest.link}</a>}</div> : <p className="muted">No submission text.</p>}
        <div className="seg"><button type="button" className={mode === 'complete' ? 'on' : ''} onClick={() => setMode('complete')}>✅ Approve</button><button type="button" className={mode === 'revision' ? 'on' : ''} onClick={() => setMode('revision')}>↩ Request changes</button></div>
        {err && <div className="alert alert-error">{err}</div>}
        {mode === 'complete' ? (<><div><span className="field-label">Rating</span><Stars value={rating} onChange={setRating} size={32} /></div>
          <Field id="cm" label="Written feedback for the student"><textarea id="cm" className="input" rows={4} maxLength={1500} value={comment} onChange={(e) => setComment(e.target.value)} /></Field></>)
          : <Field id="nt" label="What should change?"><textarea id="nt" className="input" rows={4} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>}
      </div>)}</DataState>
    </Modal>
  );
}
