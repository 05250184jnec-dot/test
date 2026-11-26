/**
 * StudentApplicationDetail - side panel with one application's full story: cover letter and every submission with employer notes.
 * FRONTEND: component of the "applications" feature, opened by pages/StudentApplications.jsx.
 * TALKS TO (backend): GET /api/student/applications/:id -> routes/studentRoutes.js
 *   -> controllers/applicationController.js (applicationDetail) -> models/applicationModel.js, submissionModel.js
 * HOW IT WORKS: loads only when opened (it is rendered on demand). The server returns 404 if the application is not yours.
 */
import { useQuery } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import { Modal } from '../../../shared/components/Modal.jsx';
import { DataState } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import Timeline from '../../../shared/components/Timeline.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function StudentApplicationDetail({ id, onClose }) {
  const q = useQuery({ queryKey: ['student', 'application', id], queryFn: () => applicationApi.studentApplicationDetail(id) });
  return (
    <Modal title="Application details" side onClose={onClose}>
      <DataState q={q} rows={2}>{(a) => (<div className="stack">
        <h3>{a.taskTitle}</h3><p className="muted">{a.organization}</p><Timeline a={a} />
        <h4>Your cover letter</h4><p className="pre">{a.coverLetter}</p><p className="muted small">Available from {fmtDate(a.availableFrom)}</p>
        <h4>Submissions</h4>{!a.submissions.length ? <p className="muted">Nothing submitted yet.</p> : a.submissions.map((s) => (
          <div className="card soft" key={s.id}><StatusPill status={s.status === 'revision_requested' ? 'draft' : s.status === 'approved' ? 'completed' : 'submitted'} /> <span className="muted small">{fmtDate(s.createdAt)}</span><p className="pre">{s.note}</p>
            {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer">{s.link}</a>}{s.reviewNote && <div className="alert alert-info">Employer: {s.reviewNote}</div>}</div>))}
      </div>)}</DataState>
    </Modal>
  );
}
