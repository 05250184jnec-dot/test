/**
 * Registrations - tabs Pending / Approved / Rejected with live counts; approve or reject people (/admin/registrations).
 * FRONTEND: page of the "admin" feature. Uses adminApi.registrations and opens components/DecisionModal.jsx.
 * TALKS TO (backend): GET /api/admin/registrations?tab=... -> routes/adminRoutes.js -> controllers/adminUserController.js (registrations) -> models/userModel.js
 * HOW IT WORKS: the active tab is stored in the URL (?tab=pending). The server returns the items plus per-tab counts for the badges.
 * Pending is sorted oldest-first so the longest-waiting person is on top.
 */
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import * as adminApi from '../adminApi.js';
import DecisionModal from '../components/DecisionModal.jsx';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { fmtDateTime } from '../../../shared/utils/format.js';

export default function Registrations() {
  const [p, set] = useListParams({ tab: 'pending', sort: 'oldest' });
  const params = { page: p.page, tab: p.tab, search: p.search, role: p.role, sort: p.tab === 'pending' ? 'oldest' : 'newest' };
  const q = useQuery({ queryKey: ['admin', 'registrations', params], queryFn: () => adminApi.registrations(params), placeholderData: keepPreviousData });
  const [target, setTarget] = useState(null);
  const c = q.data?.counts;
  return (
    <div className="stack">
      <div className="page-head"><h1>Registration requests</h1><p className="muted">Review students and organizations before they can use InternHive.</p></div>
      <div className="tabs" role="tablist">{[['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([k, label]) => (
        <button key={k} role="tab" aria-selected={p.tab === k} className={p.tab === k ? 'on' : ''} onClick={() => set({ tab: k })}>{label}<span className="count">{c ? c[k] : '–'}</span></button>))}</div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search name, e-mail, organization…" />
        <select className="input" aria-label="Role" value={p.role || ''} onChange={(e) => set({ role: e.target.value })}><option value="">Students & employers</option><option value="student">Students</option><option value="employer">Employers</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="🛡️" title={`No ${p.tab} registrations`} /> })}>{(d) => (<>
        <div className="stack">{d.items.map((u) => (
          <article className="card" key={u.id}>
            <div className="card-head"><div><h3>{u.name} <span className={`pill pill-${u.role === 'student' ? 'teal' : 'orange'}`}>{u.role}</span></h3><span className="muted small">{u.email} · {u.organization || u.college} · registered {fmtDateTime(u.created_at)}</span></div><StatusPill status={u.status} /></div>
            {u.rejection_reason && <div className="alert alert-info">Reason: {u.rejection_reason}</div>}
            <div className="actions">
              {u.status !== 'approved' && <button className="btn btn-primary" onClick={() => setTarget({ user: u, decision: 'approve' })}>Approve</button>}
              {u.status === 'pending_approval' && <button className="btn" onClick={() => setTarget({ user: u, decision: 'reject' })}>Reject</button>}
            </div>
          </article>))}</div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {target && <DecisionModal {...target} onClose={() => setTarget(null)} />}
    </div>
  );
}
