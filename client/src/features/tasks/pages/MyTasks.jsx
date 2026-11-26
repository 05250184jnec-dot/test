/**
 * MyTasks - the employer's own tasks with search / filter / pagination, edit and delete (/employer/tasks).
 * FRONTEND: page of the "tasks" feature. Uses taskApi.myTasks and taskApi.deleteTask.
 * TALKS TO (backend): GET /api/employer/tasks and DELETE /api/employer/tasks/:id
 *   -> routes/employerRoutes.js -> controllers/employerTaskController.js -> models/taskModel.js
 * HOW IT WORKS: the server only returns tasks whose employer_id is the signed-in user. Delete opens a confirm dialog first;
 * the server refuses (409) if students are still working on the task, and we show that message in a toast.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as taskApi from '../taskApi.js';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { ConfirmDialog } from '../../../shared/components/Modal.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { nu, fmtDate } from '../../../shared/utils/format.js';

export default function MyTasks() {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, status: p.status, sort: p.sort };
  const q = useQuery({ queryKey: ['employer', 'tasks', params], queryFn: () => taskApi.myTasks(params), placeholderData: keepPreviousData });
  const qc = useQueryClient(); const toast = useToast(); const [del, setDel] = useState(null);
  const rm = useMutation({
    mutationFn: (id) => taskApi.deleteTask(id),
    onSuccess: () => { toast('Task deleted'); setDel(null); qc.invalidateQueries({ queryKey: ['employer'] }); }, onError: (e) => { toast(e.message, 'error'); setDel(null); },
  });
  return (
    <div className="stack">
      <div className="page-head"><h1>My tasks</h1><Link className="btn btn-primary" to="/employer/tasks/new">➕ Post a task</Link></div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search my tasks…" />
        <select className="input" aria-label="Status" value={p.status || ''} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="pending_review">Pending review</option><option value="completed">Completed</option></select>
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="deadline">Deadline</option><option value="pay_high">Pay high</option><option value="title">Title</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="📋" title="No tasks found" action={<Link className="btn btn-primary" to="/employer/tasks/new">Post a task</Link>} /> })}>{(d) => (<>
        <div className="table-wrap card"><table className="table"><thead><tr><th>Title</th><th>Category</th><th>Pay</th><th>Deadline</th><th>Applicants</th><th>Status</th><th /></tr></thead>
          <tbody>{d.items.map((t) => (<tr key={t.id}><td data-label="Title"><b>{t.title}</b></td><td data-label="Category">{t.category}</td><td data-label="Pay">{nu(t.pay)}</td><td data-label="Deadline">{fmtDate(t.deadline)}</td>
            <td data-label="Applicants"><Link to={`/employer/applications?taskId=${t.id}`}>{t.applicationCount}</Link></td><td data-label="Status"><StatusPill status={t.status} /></td>
            <td className="actions"><Link className="btn btn-sm" to={`/employer/tasks/${t.id}/edit`}>Edit</Link><button className="btn btn-sm btn-danger-ghost" onClick={() => setDel(t)}>Delete</button></td></tr>))}</tbody></table></div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {del && <ConfirmDialog danger title="Delete task?" message={`“${del.title}” and its applications will be removed. This cannot be undone.`} confirmLabel="Delete" busy={rm.isPending} onConfirm={() => rm.mutate(del.id)} onClose={() => setDel(null)} />}
    </div>
  );
}
