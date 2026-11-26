/**
 * Certificates - gallery of the student's earned certificates (/student/certificates).
 * FRONTEND: page of the "certificates" feature. Uses certificateApi.studentCertificates and downloadCertificate.
 * TALKS TO (backend): GET /api/student/certificates -> routes/studentRoutes.js; GET /api/certificates/:id/download -> routes/certificateRoutes.js
 *   -> controllers/certificateController.js -> models/certificateModel.js (+ services/certificate.js draws the PDF)
 * HOW IT WORKS: the PDF needs the login header, so it is fetched with downloadFile() and saved from a blob instead of a plain link.
 * "Copy link" copies the public /verify/<code> address that recruiters can open without an account.
 */
import { useQuery } from '@tanstack/react-query';
import * as certificateApi from '../certificateApi.js';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { Stars } from '../../../shared/components/Badges.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function Certificates() {
  const q = useQuery({ queryKey: ['student', 'certificates'], queryFn: certificateApi.studentCertificates });
  const toast = useToast();
  const dl = (c) => certificateApi.downloadCertificate(c).catch((e) => toast(e.message, 'error'));
  return (
    <div className="stack">
      <div className="page-head"><h1>My certificates</h1><p className="muted">Share the verification link with recruiters.</p></div>
      <DataState q={q} rows={2} empty={Object.assign((d) => !d.length, { node: <Empty icon="🎓" title="No certificates yet" hint="Complete a task and your employer's approval creates one automatically." /> })}>{(list) => (
        <div className="grid-3">{list.map((c) => (
          <article className="card cert-card" key={c.id}>
            <img src="/logo-mark.png" alt="" height="44" /><h3>{c.taskTitle}</h3><p className="muted">{c.organization}</p>
            <Stars value={c.rating} size={18} /><p className="small muted">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</p><code className="cert-id">{c.certCode}</code>
            <div className="actions"><button className="btn btn-primary" onClick={() => dl(c)}>⬇ Download PDF</button>
              <button className="btn" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/verify/${c.certCode}`); toast('Verification link copied'); }}>🔗 Copy link</button></div>
          </article>))}</div>)}</DataState>
    </div>
  );
}


