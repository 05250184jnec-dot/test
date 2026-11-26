/**
 * Users - every user with search / filter / sort; suspend or reactivate (/admin/users).
 * FRONTEND: page of the "admin" feature. Uses adminApi.users and adminApi.suspendUser.
 * TALKS TO (backend): GET /api/admin/users and POST /api/admin/users/:id/suspend -> routes/adminRoutes.js
 *   -> controllers/adminUserController.js (users, suspend) -> models/userModel.js (+ services/audit.js)
 * HOW IT WORKS: Suspend opens a confirm dialog with an optional reason. A suspended user is signed out immediately because the
 * server re-checks the user on every request and notifies their browser through the socket ("account:changed").
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as adminApi from '../adminApi.js';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { ConfirmDialog } from '../../../shared/components/Modal.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function Users() {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, role: p.role, status: p.status, suspended: p.suspended, sort: p.sort };
  const q = useQuery({ queryKey: ['admin', 'users', params], queryFn: () => adminApi.users(params), placeholderData: keepPreviousData });
  const qc = useQueryClient(); const toast = useToast(); const [t, setT] = useState(null); const [reason, setReason] = useState('');
  const m = useMutation({
    mutationFn: () => adminApi.suspendUser(t.id, { suspended: !t.suspended, reason: reason || undefined }),
    onSuccess: () => { toast(t.suspended ? 'User reactivated' : 'User suspended'); setT(null); setReason(''); qc.invalidateQueries({ queryKey: ['admin'] }); }, onError: (e) => { toast(e.message, 'error'); setT(null); },
  });
  return (
    <div className="stack">
      <div className="page-head"><h1>Users</h1></div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search name, e-mail…" />
        <select className="input" aria-label="Role" value={p.role || ''} onChange={(e) => set({ role: e.target.value })}><option value="">All roles</option><option value="student">Student</option><option value="employer">Employer</option></select>
        <select className="input" aria-label="Status" value={p.status || ''} onChange={(e) => set({ status: e.target.value })}><option value="">Any status</option><option value="approved">Approved</option><option value="pending_approval">Pending</option><option value="rejected">Rejected</option><option value="pending_verification">Unverified</option></select>
        <select className="input" aria-label="Suspended" value={p.suspended || ''} onChange={(e) => set({ suspended: e.target.value })}><option value="">All</option><option value="1">Suspended</option><option value="0">Not suspended</option></select>
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="role">Role</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="👥" title="No users match" /> })}>{(d) => (<>
        <div className="table-wrap card"><table className="table"><thead><tr><th>Name</th><th>Role</th><th>Organization / College</th><th>Joined</th><th>Status</th><th /></tr></thead>
          <tbody>{d.items.map((u) => (<tr key={u.id}><td data-label="Name"><b>{u.name}</b><div className="muted small">{u.email}</div></td><td data-label="Role">{u.role}</td><td data-label="Org">{u.organization || u.college || '-'}</td><td data-label="Joined">{fmtDate(u.created_at)}</td>
            <td data-label="Status"><StatusPill status={u.status} />{!!u.suspended && <span className="pill pill-red">Suspended</span>}</td>
            <td className="actions">{u.status === 'approved' && <button className={`btn btn-sm ${u.suspended ? '' : 'btn-danger-ghost'}`} onClick={() => setT(u)}>{u.suspended ? 'Reactivate' : 'Suspend'}</button>}</td></tr>))}</tbody></table></div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {t && <ConfirmDialog danger={!t.suspended} title={`${t.suspended ? 'Reactivate' : 'Suspend'} ${t.name}?`} message={t.suspended ? 'They will be able to sign in again.' : 'They are signed out immediately and cannot sign in.'} confirmLabel={t.suspended ? 'Reactivate' : 'Suspend'} busy={m.isPending} onConfirm={() => m.mutate()} onClose={() => setT(null)}>
        {!t.suspended && <Field id="sr" label="Reason (optional)"><input id="sr" className="input" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}</ConfirmDialog>}
    </div>
  );
}
