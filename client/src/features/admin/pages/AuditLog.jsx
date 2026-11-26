/**
 * AuditLog - who did what, when. New rows stream in live (/admin/audit).
 * FRONTEND: page of the "admin" feature. Uses adminApi.auditLog.
 * TALKS TO (backend): GET /api/admin/audit -> routes/adminRoutes.js -> controllers/auditController.js (auditLog) -> models/auditModel.js
 * HOW IT WORKS: filter by action or search text. The server emits "audit:new" over the socket whenever an admin acts, which
 * invalidates the ['admin'] queries so this table refetches by itself.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import * as adminApi from '../adminApi.js';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { fmtDateTime } from '../../../shared/utils/format.js';

const ACTIONS = ['user.approve', 'user.reject', 'user.suspend', 'user.reactivate', 'task.delete'];

export default function AuditLog() {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, action: p.action, sort: p.sort, pageSize: 15 };
  const q = useQuery({ queryKey: ['admin', 'audit', params], queryFn: () => adminApi.auditLog(params), placeholderData: keepPreviousData });
  return (
    <div className="stack">
      <div className="page-head"><h1>Audit log</h1><p className="muted">Every admin action, newest first.</p></div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search actor or details…" />
        <select className="input" aria-label="Action" value={p.action || ''} onChange={(e) => set({ action: e.target.value })}><option value="">All actions</option>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select>
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="oldest">Oldest</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="🧾" title="No entries" /> })}>{(d) => (<>
        <div className="table-wrap card"><table className="table"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th><th>IP</th></tr></thead>
          <tbody>{d.items.map((a) => (<tr key={a.id}><td data-label="When">{fmtDateTime(a.createdAt)}</td><td data-label="Who">{a.actorName}</td><td data-label="Action"><code>{a.action}</code></td><td data-label="Details">{a.details || '-'}</td><td data-label="IP" className="muted small">{a.ip || '-'}</td></tr>))}</tbody></table></div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
    </div>
  );
}
