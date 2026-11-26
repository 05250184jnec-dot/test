/**
 * RateEmployerModal - pop-up where a student rates the employer (1-5 stars + comment) after the task is completed.
 * FRONTEND: component of the "applications" feature, opened by pages/StudentApplications.jsx.
 * TALKS TO (backend): POST /api/student/applications/:id/feedback -> routes/studentRoutes.js
 *   -> controllers/studentApplicationController.js (studentFeedback) -> models/feedbackModel.js
 * HOW IT WORKS: the star picker sets `rating` (default 5). The server allows only one review per application (409 if repeated)
 * and shows that message in the modal.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import { Modal } from '../../../shared/components/Modal.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { Stars } from '../../../shared/components/Badges.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';

export default function RateEmployerModal({ a, onClose }) {
  const qc = useQueryClient(); const toast = useToast();
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(''); const [err, setErr] = useState(null);
  const m = useMutation({
    mutationFn: () => applicationApi.rateEmployer(a.id, { rating, comment }),
    onSuccess: () => { toast('Thanks for your feedback'); qc.invalidateQueries({ queryKey: ['student'] }); onClose(); }, onError: (e) => setErr(e.message),
  });
  return (
    <Modal title={`Rate ${a.organization}`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={m.isPending} onClick={() => m.mutate()}>Send feedback</button></>}>
      {err && <div className="alert alert-error">{err}</div>}
      <Stars value={rating} onChange={setRating} size={32} />
      <Field id="fc" label="Comment (optional)"><textarea id="fc" className="input" rows={4} maxLength={1500} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
    </Modal>
  );
}
