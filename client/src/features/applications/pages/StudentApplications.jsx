/**
 * StudentApplications - used for BOTH "My Applications" (scope="active", /student/applications) and "Task History" (scope="history", /student/history).
 * FRONTEND: page of the "applications" feature. Uses applicationApi.studentApplications and opens three modals from components/.
 * TALKS TO (backend): GET /api/student/applications?scope=... -> routes/studentRoutes.js
 *   -> controllers/studentApplicationController.js (studentApplications) -> models/applicationModel.js
 * HOW IT WORKS: filters live in the URL. Each card shows a Timeline and buttons that depend on the status:
 * accepted -> "Submit work" (SubmitWorkModal), completed -> "Rate employer" (RateEmployerModal) and certificate link,
 * always "Details" (StudentApplicationDetail). The list refreshes live when the employer acts (socket "applications:changed").
 */
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as applicationApi from '../applicationApi.js';
import SubmitWorkModal from '../components/SubmitWorkModal.jsx';
import RateEmployerModal from '../components/RateEmployerModal.jsx';
import StudentApplicationDetail from '../components/StudentApplicationDetail.jsx';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { Countdown } from '../../../shared/components/Countdown.jsx';
import Timeline from '../../../shared/components/Timeline.jsx';
import { nu } from '../../../shared/utils/format.js';

export default function StudentApplications({ scope }) {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, status: p.status, sort: p.sort, scope };
  const q = useQuery({ queryKey: ['student', 'applications', params], queryFn: () => applicationApi.studentApplications(params), placeholderData: keepPreviousData });
  const [submitFor, setSubmitFor] = useState(null); const [rateFor, setRateFor] = useState(null); const [detail, setDetail] = useState(null);
  const statuses = scope === 'history' ? ['completed', 'rejected'] : ['applied', 'accepted', 'submitted'];
  return (
    <div className="stack">
      <div className="page-head"><h1>{scope === 'history' ? 'Task history' : 'My applications'}</h1><p className="muted">{scope === 'history' ? 'Every task you finished or that was closed.' : 'Track each application from applied to completed.'}</p></div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search task…" />
        <select className="input" aria-label="Status" value={p.status || ''} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="status">Status</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="📨" title="Nothing here yet" action={<Link className="btn btn-primary" to="/student/browse">Browse tasks</Link>} /> })}>{(d) => (<>
        <div className="stack">{d.items.map((a) => (
          <article className="card" key={a.id}>
            <div className="card-head"><div><h3>{a.taskTitle}</h3><span className="muted small">{a.organization} · {a.category} · {nu(a.pay)}</span></div><StatusPill status={a.status} /></div>
            <Timeline a={a} />
            <div className="actions">
              {a.status === 'accepted' && <><Countdown date={a.deadline} /><button className="btn btn-primary" onClick={() => setSubmitFor(a)}>Submit work</button></>}
              {a.status === 'completed' && <>{a.certificateId && <Link className="btn" to="/student/certificates">🎓 Certificate</Link>}{!a.studentFeedbackGiven && <button className="btn" onClick={() => setRateFor(a)}>Rate employer</button>}</>}
              <button className="btn btn-ghost" onClick={() => setDetail(a)}>Details</button>
            </div>
          </article>))}</div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {submitFor && <SubmitWorkModal a={submitFor} onClose={() => setSubmitFor(null)} />}
      {rateFor && <RateEmployerModal a={rateFor} onClose={() => setRateFor(null)} />}
      {detail && <StudentApplicationDetail id={detail.id} onClose={() => setDetail(null)} />}
    </div>
  );
}
