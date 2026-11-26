/**
 * Browse - student page listing active tasks with search / filter / sort / pagination (/student/browse).
 * FRONTEND: page of the "tasks" feature. Calls taskApi.browseTasks. Filters live in the URL via useListParams.
 * TALKS TO (backend): GET /api/tasks -> routes/taskRoutes.js -> controllers/taskController.js (browse) -> models/taskModel.js
 * HOW IT WORKS: useQuery key ['tasks','browse',params] re-runs whenever a filter changes. The socket event
 * "tasks:changed" invalidates the ['tasks'] key so new tasks appear live. Each card links to the Apply page.
 */
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import * as taskApi from '../taskApi.js';
import { CATEGORIES } from '../../../shared/constants.js';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { Countdown } from '../../../shared/components/Countdown.jsx';
import { nu } from '../../../shared/utils/format.js';

export default function Browse() {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, category: p.category, minPay: p.minPay, maxPay: p.maxPay, sort: p.sort, pageSize: 9 };
  const q = useQuery({ queryKey: ['tasks', 'browse', params], queryFn: () => taskApi.browseTasks(params), placeholderData: keepPreviousData });
  return (
    <div className="stack">
      <div className="page-head"><h1>Browse tasks</h1><p className="muted">Real tasks from real organizations. New ones appear here live.</p></div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search title, category or organization…" />
        <select className="input" aria-label="Category" value={p.category || ''} onChange={(e) => set({ category: e.target.value })}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="input narrow" type="number" min="0" placeholder="Min pay" aria-label="Minimum pay" value={p.minPay || ''} onChange={(e) => set({ minPay: e.target.value })} />
        <input className="input narrow" type="number" min="0" placeholder="Max pay" aria-label="Maximum pay" value={p.maxPay || ''} onChange={(e) => set({ maxPay: e.target.value })} />
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="deadline">Deadline soonest</option><option value="pay_high">Pay: high → low</option><option value="pay_low">Pay: low → high</option></select>
      </div>
      <DataState q={q} rows={3} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="🔎" title="No tasks match" hint="Try clearing some filters." /> })}>{(d) => (<>
        <div className="grid-3">{d.items.map((t) => (
          <article className="card task-card" key={t.id}>
            <div className="card-head"><span className="pill pill-primary">{t.category}</span>{t.hasApplied && <span className="pill pill-green">Applied</span>}</div>
            <h3>{t.title}</h3><p className="muted small">{t.organization}</p>
            <p className="clamp">{t.description}</p>
            <div className="meta"><b>{nu(t.pay)}</b><span>{t.durationDays} days</span><Countdown date={t.deadline} /></div>
            <Link className="btn btn-primary btn-block" to={`/student/tasks/${t.id}`}>{t.hasApplied ? 'View' : 'View & apply'}</Link>
          </article>))}</div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
    </div>
  );
}
