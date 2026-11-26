/**
 * AdminDashboard - the "User Manager" home: platform stats, charts, live approval queue, audit feed, e-mail queue health (/admin).
 * FRONTEND: page of the "dashboards" feature. Calls dashboardApi.adminDashboard; Approve/Reject opens admin/components/DecisionModal.jsx.
 * TALKS TO (backend): GET /api/admin/dashboard -> routes/adminRoutes.js -> controllers/dashboardController.js (adminDashboard) -> models/dashboardModel.js (+ services/mailer.js mailHealth)
 * HOW IT WORKS: one request returns everything. Charts use shared/components/Charts.jsx. Socket events "registrations:changed" and
 * "audit:new" invalidate the ['admin'] queries, so the queue and the log update live.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../dashboardApi.js';
import DecisionModal from '../../admin/components/DecisionModal.jsx';
import { Stat } from '../../../shared/components/Stat.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { LinesChart, LineOnly, Donut } from '../../../shared/components/Charts.jsx';
import { fmtDateTime } from '../../../shared/utils/format.js';

export default function AdminDashboard() {
  const q = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: dashboardApi.adminDashboard });
  const [target, setTarget] = useState(null);
  return (
    <div className="stack">
      <div className="page-head"><h1>Admin dashboard</h1><p className="muted">Platform health, approvals and activity - updated live.</p></div>
      <DataState q={q} rows={3}>{(d) => (<>
        <div className="stat-grid">
          <Stat label="Students" value={d.stats.students} icon="🎓" tone="teal" />
          <Stat label="Employers" value={d.stats.employers} icon="🏢" tone="orange" />
          <Stat label="Pending approvals" value={d.stats.pendingApprovals} icon="🛡️" tone="gold" />
          <Stat label="Emails pending" value={d.mail.pending} icon="✉️" tone="primary" hint={d.mail.failed ? `${d.mail.failed} failed` : 'healthy'} />
        </div>
        <div className="grid-2">
          <section className="card"><div className="card-head"><h3>Sign-ups (30 days)</h3></div>
            <LinesChart data={d.signupsOverTime} x="day" series={[{ key: 'students', name: 'Students', color: '#2EC4B6' }, { key: 'employers', name: 'Employers', color: '#F28C38' }]} /></section>
          <section className="card"><div className="card-head"><h3>Applications per day (14 days)</h3></div><LineOnly data={d.applicationsPerDay} x="day" y="applications" label="Applications" /></section>
        </div>
        <div className="grid-2">
          <section className="card"><div className="card-head"><h3>Approval queue</h3><Link to="/admin/registrations" className="small">Open all</Link></div>
            {!d.queue.length ? <Empty icon="🛡️" title="Queue is empty" hint="New registrations appear here live." /> : d.queue.map((u) => (
              <div key={u.id} className="row-link static"><div><b>{u.name}</b> <span className={`pill pill-${u.role === 'student' ? 'teal' : 'orange'}`}>{u.role}</span><div className="muted small">{u.email} · {u.organization || u.college}</div></div>
                <div className="actions"><button className="btn btn-sm btn-primary" onClick={() => setTarget({ user: u, decision: 'approve' })}>Approve</button><button className="btn btn-sm" onClick={() => setTarget({ user: u, decision: 'reject' })}>Reject</button></div></div>))}</section>
          <section className="card"><div className="card-head"><h3>Tasks by status</h3></div><Donut data={d.tasksByStatus} /></section>
        </div>
        <div className="grid-2">
          <section className="card"><div className="card-head"><h3>Live audit log</h3><Link to="/admin/audit" className="small">Full log</Link></div>
            {!d.audit.length ? <Empty icon="🧾" title="No actions yet" /> : d.audit.map((a) => <div key={a.id} className="audit-row"><code>{a.action}</code><span>{a.details || '-'}</span><span className="muted small">{a.actorName} · {fmtDateTime(a.createdAt)}</span></div>)}</section>
          <section className="card"><div className="card-head"><h3>E-mail queue health</h3></div>
            <dl className="kv"><dt>Pending</dt><dd>{d.mail.pending}</dd><dt>Sent</dt><dd>{d.mail.sent}</dd><dt>Failed</dt><dd className={d.mail.failed ? 'text-bad' : ''}>{d.mail.failed}</dd><dt>Oldest pending</dt><dd>{d.mail.oldestPendingSec}s</dd></dl></section>
        </div>
      </>)}</DataState>
      {target && <DecisionModal {...target} onClose={() => setTarget(null)} />}
    </div>
  );
}
