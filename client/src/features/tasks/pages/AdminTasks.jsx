/**
 * AdminTasks - every task on the platform; the admin can delete an inappropriate one (/admin/tasks).
 * FRONTEND: page of the "tasks" feature (admin side). Uses taskApi.adminTasks and taskApi.adminDeleteTask.
 * TALKS TO (backend): GET /api/admin/tasks and DELETE /api/admin/tasks/:id
 *   -> routes/adminRoutes.js -> controllers/adminTaskController.js -> models/taskModel.js (+ services/audit.js writes the audit log)
 * HOW IT WORKS: same list pattern as MyTasks. Deleting asks for confirmation and the server records who deleted what in the audit log.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as taskApi from '../taskApi.js';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { ConfirmDialog } from '../../../shared/components/Modal.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { nu, fmtDate } from '../../../shared/utils/format.js';

export default function AdminTasks() {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, status: p.status, sort: p.sort };
  const q = useQuery({ queryKey: ['admin', 'tasks', params], queryFn: () => taskApi.adminTasks(params), placeholderData: keepPreviousData });
  const qc = useQueryClient(); const toast = useToast(); const [t, setT] = useState(null);
  const rm = useMutation({
    mutationFn: () => taskApi.adminDeleteTask(t.id),
    onSuccess: () => { toast('Task deleted'); setT(null); qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); }, onError: (e) => { toast(e.message, 'error'); setT(null); },
  });
  return (
    <div className="stack">
      <div className="page-head"><h1>All tasks</h1></div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search tasks…" />
        <select className="input" aria-label="Status" value={p.status || ''} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="pending_review">Pending review</option><option value="completed">Completed</option></select>
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="deadline">Deadline</option><option value="pay_high">Pay high</option><option value="title">Title</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="📋" title="No tasks" /> })}>{(d) => (<>
        <div className="table-wrap card"><table className="table"><thead><tr><th>Title</th><th>Organization</th><th>Pay</th><th>Deadline</th><th>Apps</th><th>Status</th><th /></tr></thead>
          <tbody>{d.items.map((x) => (<tr key={x.id}><td data-label="Title"><b>{x.title}</b><div className="muted small">{x.category}</div></td><td data-label="Org">{x.organization}</td><td data-label="Pay">{nu(x.pay)}</td><td data-label="Deadline">{fmtDate(x.deadline)}</td><td data-label="Apps">{x.applicationCount}</td><td data-label="Status"><StatusPill status={x.status} /></td>
            <td className="actions"><button className="btn btn-sm btn-danger-ghost" onClick={() => setT(x)}>Delete</button></td></tr>))}</tbody></table></div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {t && <ConfirmDialog danger title="Delete this task?" message={`“${t.title}” by ${t.organization} and all its applications will be permanently removed. This is recorded in the audit log.`} confirmLabel="Delete task" busy={rm.isPending} onConfirm={() => rm.mutate()} onClose={() => setT(null)} />}
    </div>
  );
}
