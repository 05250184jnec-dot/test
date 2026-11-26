/**
 * EmployerDashboard - stats for THIS employer's tasks, applications-per-task chart, new applicants and the review queue (/employer).
 * FRONTEND: page of the "dashboards" feature. Calls dashboardApi.employerDashboard; Accept/Reject uses applicationApi.decideApplication.
 * TALKS TO (backend): GET /api/employer/dashboard -> controllers/dashboardController.js (employerDashboard) -> models/dashboardModel.js;
 *   POST /api/employer/applications/:id/decision -> controllers/employerApplicationController.js (decide)
 * HOW IT WORKS: one request fills the whole page. Accept/Reject buttons are a mutation; on success we invalidate every ['employer'] query so the page refreshes.
 */
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as dashboardApi from '../dashboardApi.js';
import * as applicationApi from '../../applications/applicationApi.js';
import { useAuth } from '../../../shared/context/AuthContext.jsx';
import { Stat } from '../../../shared/components/Stat.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { Stars } from '../../../shared/components/Badges.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { BarsChart } from '../../../shared/components/Charts.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function EmployerDashboard() {
  const { user } = useAuth(); const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['employer', 'dashboard'], queryFn: dashboardApi.employerDashboard });
  const decide = useMutation({
    mutationFn: ({ id, decision }) => applicationApi.decideApplication(id, decision),
    onSuccess: (_, v) => { toast(v.decision === 'accepted' ? 'Applicant accepted' : 'Applicant rejected'); qc.invalidateQueries({ queryKey: ['employer'] }); },
    onError: (e) => toast(e.message, 'error'),
  });
  return (
    <div className="stack">
      <div className="page-head"><h1>{user.organization || user.name}</h1><p className="muted">Your tasks, applicants and work to review.</p></div>
      <DataState q={q} rows={3}>{(d) => (<>
        <div className="stat-grid">
          <Stat label="Active tasks" value={d.stats.active} icon="📋" />
          <Stat label="Drafts" value={d.stats.drafts} icon="📝" tone="grey" />
          <Stat label="Pending applications" value={d.stats.pendingApplications} icon="📨" tone="gold" />
          <Stat label="To review" value={d.stats.toReview} icon="✅" tone="teal" />
          <Stat label="Completed work" value={d.stats.completedWork} icon="🏁" tone="green" />
        </div>
        <div className="grid-2">
          <section className="card"><div className="card-head"><h3>Applications per task</h3></div>
            {!d.perTask.length ? <Empty icon="📋" title="No tasks yet" action={<Link className="btn btn-primary" to="/employer/tasks/new">Post your first task</Link>} /> : <BarsChart data={d.perTask} x="title" y="applications" label="Applications" />}</section>
          <section className="card"><div className="card-head"><h3>Your ratings</h3></div>
            <div className="rating-pair"><div><span className="muted small">Given to students</span><div className="big">{d.stats.avgGiven ?? '–'}</div><Stars value={d.stats.avgGiven || 0} /></div>
              <div><span className="muted small">Received from students</span><div className="big">{d.stats.avgReceived ?? '–'}</div><Stars value={d.stats.avgReceived || 0} /></div></div></section>
        </div>
        <div className="grid-2">
          <section className="card"><div className="card-head"><h3>New applicants</h3><Link to="/employer/applications" className="small">All</Link></div>
            {!d.applicants.length ? <Empty icon="📨" title="No pending applicants" /> : d.applicants.map((a) => (
              <div key={a.id} className="row-link static"><div><b>{a.studentName}</b><div className="muted small">{a.taskTitle} · {a.studentCollege}</div></div>
                <div className="actions"><button className="btn btn-sm btn-primary" disabled={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: 'accepted' })}>Accept</button><button className="btn btn-sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: 'rejected' })}>Reject</button></div></div>))}</section>
          <section className="card"><div className="card-head"><h3>Review queue</h3><Link to="/employer/review" className="small">Open</Link></div>
            {!d.reviewQueue.length ? <Empty icon="✅" title="Nothing to review" /> : d.reviewQueue.map((a) => <Link key={a.id} to="/employer/review" className="row-link"><div><b>{a.studentName}</b><div className="muted small">{a.taskTitle}</div></div><span className="muted small">{fmtDate(a.submittedAt)}</span></Link>)}</section>
        </div>
      </>)}</DataState>
    </div>
  );
}
