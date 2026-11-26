/**
 * VerifyCertificate - PUBLIC page (/verify/:certCode): anyone (e.g. a recruiter) can check a certificate is genuine. No login needed.
 * FRONTEND: page of the "certificates" feature. Calls certificateApi.verifyCertificate.
 * TALKS TO (backend): GET /api/certificates/verify/:certCode -> routes/certificateRoutes.js -> controllers/certificateController.js (verify) -> models/certificateModel.js
 * HOW IT WORKS: the code is read from the URL. The server answers { valid: false } or the certificate details, and we show a green or red box.
 */
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as certificateApi from '../certificateApi.js';
import AuthShell from '../../auth/components/AuthShell.jsx';
import { Skeleton } from '../../../shared/components/Loading.jsx';
import { Stars } from '../../../shared/components/Badges.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function VerifyCertificate() {
  const { certCode } = useParams();
  const q = useQuery({ queryKey: ['verify', certCode], queryFn: () => certificateApi.verifyCertificate(certCode), retry: false });
  const c = q.data;
  return (
    <AuthShell title="Certificate verification" subtitle={`ID: ${certCode}`}>
      {q.isLoading && <Skeleton h={80} />}
      {q.isError && <div className="alert alert-error">{q.error.message}</div>}
      {c && !c.valid && <div className="alert alert-error">❌ No certificate was found with this ID.</div>}
      {c?.valid && (
        <div className="verify-ok">
          <div className="alert alert-success">✅ This certificate is genuine.</div>
          <dl className="kv"><dt>Awarded to</dt><dd>{c.studentName}</dd><dt>Task</dt><dd>{c.taskTitle}</dd><dt>Organization</dt><dd>{c.organization}</dd>
            <dt>Period</dt><dd>{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</dd><dt>Rating</dt><dd><Stars value={c.rating} size={18} /></dd><dt>Issued</dt><dd>{fmtDate(c.issuedAt)}</dd></dl>
        </div>)}
    </AuthShell>
  );
}

