/**
 * StudentDashboard - personal stats, recommended tasks, deadlines, application timeline and certificates (/student).
 * FRONTEND: page of the "dashboards" feature. Calls dashboardApi.studentDashboard.
 * TALKS TO (backend): GET /api/student/dashboard -> routes/studentRoutes.js -> controllers/dashboardController.js (studentDashboard) -> models/dashboardModel.js
 * HOW IT WORKS: ONE request returns everything ({ stats, recommended, timeline, deadlines, certificates }); the page just draws it.
 * The numbers come from SQL COUNT/SUM queries filtered by the signed-in student's id. Live socket events refetch it.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../dashboardApi.js';
import { useAuth } from '../../../shared/context/AuthContext.jsx';
import { Stat } from '../../../shared/components/Stat.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { Countdown } from '../../../shared/components/Countdown.jsx';
import Timeline from '../../../shared/components/Timeline.jsx';
import { nu, fmtDate } from '../../../shared/utils/format.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['student', 'dashboard'], queryFn: dashboardApi.studentDashboard });
  return (
    <div className="stack">
      <div className="page-head"><h1>Hello, {user.name.split(' ')[0]} 👋</h1><p className="muted">Your progress at a glance.</p></div>
      <DataState q={q} rows={3}>{(d) => (<>
        <div className="stat-grid">
          <Stat label="Applications" value={d.stats.applications} icon="📨" />
          <Stat label="Accepted" value={d.stats.accepted} icon="✅" tone="teal" />
          <Stat label="Completed" value={d.stats.completed} icon="🏁" tone="green" />
          <Stat label="Certificates" value={d.stats.certificates} icon="🎓" tone="gold" />
          <Stat label="Avg. rating" value={d.stats.avgRating} decimals suffix=" / 5" icon="⭐" tone="gold" />
        </div>
        <div className="grid-2">
          <section className="card"><div className="card-head"><h3>Recommended for you</h3><Link to="/student/browse" className="small">Browse all</Link></div>
            {!d.recommended.length ? <Empty icon="🔎" title="No open tasks right now" hint="Check back soon." /> : d.recommended.map((t) => (
              <Link key={t.id} to={`/student/tasks/${t.id}`} className="row-link"><div><b>{t.title}</b><div className="muted small">{t.organization} · {t.category}</div></div><div className="right"><b>{nu(t.pay)}</b><div><Countdown date={t.deadline} /></div></div></Link>))}
          </section>
          <section className="card"><div className="card-head"><h3>Upcoming deadlines</h3></div>
            {!d.deadlines.length ? <Empty icon="⏰" title="No deadlines" hint="Accepted tasks show up here." /> : d.deadlines.map((x) => <div key={x.id} className="row-link static"><div><b>{x.taskTitle}</b><div className="muted small">Due {fmtDate(x.deadline)}</div></div><Countdown date={x.deadline} /></div>)}
          </section>
        </div>
        <section className="card"><div className="card-head"><h3>My applications</h3><Link to="/student/applications" className="small">View all</Link></div>
          {!d.timeline.length ? <Empty icon="📨" title="You haven't applied yet" hint="Find a task and send your first application." action={<Link className="btn btn-primary" to="/student/browse">Browse tasks</Link>} /> : d.timeline.map((a) => (
            <div key={a.id} className="timeline-row"><div className="tl-head"><b>{a.taskTitle}</b><span className="muted small">{a.organization}</span><StatusPill status={a.status} /></div><Timeline a={a} /></div>))}
        </section>
        {!!d.certificates.length && <section className="card"><div className="card-head"><h3>Certificates</h3><Link to="/student/certificates" className="small">Gallery</Link></div>
          <div className="cert-row">{d.certificates.map((c) => <div className="cert-mini" key={c.id}><span>🎓</span><b>{c.taskTitle}</b><span className="muted small">{c.organization}</span></div>)}</div></section>}
      </>)}</DataState>
    </div>
  );
}
