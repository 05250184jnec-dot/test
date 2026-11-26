/**
 * ApplicantDetail - side panel where an employer reads an applicant's cover letter and contact details.
 * FRONTEND: component of the "applications" feature, opened by pages/EmployerApplications.jsx.
 * TALKS TO (backend): GET /api/employer/applications/:id -> routes/employerRoutes.js
 *   -> controllers/applicationController.js (applicationDetail) -> models/applicationModel.js
 * HOW IT WORKS: loaded only when opened. The server returns 404 unless the application belongs to one of this employer's tasks.
 */
import { useQuery } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import { Modal } from '../../../shared/components/Modal.jsx';
import { DataState } from '../../../shared/components/Loading.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function ApplicantDetail({ id, onClose }) {
  const q = useQuery({ queryKey: ['employer', 'application', id], queryFn: () => applicationApi.employerApplicationDetail(id) });
  return (
    <Modal title="Applicant" side onClose={onClose}>
      <DataState q={q} rows={2}>{(a) => (<div className="stack"><h3>{a.studentName}</h3><p className="muted">{a.studentEmail} · {a.studentCollege}</p><h4>Cover letter</h4><p className="pre">{a.coverLetter}</p><p className="muted small">Available from {fmtDate(a.availableFrom)}</p></div>)}</DataState>
    </Modal>
  );
}
