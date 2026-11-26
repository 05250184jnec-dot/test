/**
 * EmployerApplications - applicants across the employer's tasks, with accept / reject (/employer/applications).
 * FRONTEND: page of the "applications" feature. Uses applicationApi.employerApplications and applicationApi.decideApplication; opens ApplicantDetail.
 * TALKS TO (backend): GET /api/employer/applications and POST /api/employer/applications/:id/decision -> routes/employerRoutes.js
 *   -> controllers/employerApplicationController.js (employerApplications, decide) -> models/applicationModel.js
 * HOW IT WORKS: accept/reject uses an OPTIMISTIC update: the status pill flips instantly, and is rolled back if the server says no
 * (e.g. positions already filled). ?taskId=... in the URL filters to one task.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import ApplicantDetail from '../components/ApplicantDetail.jsx';
import { APP_STATUSES } from '../../../shared/constants.js';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { SearchBox, Pagination } from '../../../shared/components/ListControls.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import Timeline from '../../../shared/components/Timeline.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function EmployerApplications() {
  const [p, set] = useListParams({ sort: 'newest' });
  const params = { page: p.page, search: p.search, status: p.status, sort: p.sort, taskId: p.taskId };
  const key = ['employer', 'applications', params];
  const q = useQuery({ queryKey: key, queryFn: () => applicationApi.employerApplications(params), placeholderData: keepPreviousData });
  const qc = useQueryClient(); const toast = useToast(); const [open, setOpen] = useState(null);
  const decide = useMutation({
    mutationFn: ({ id, decision }) => applicationApi.decideApplication(id, decision),
    onMutate: async ({ id, decision }) => { // optimistic: flip the pill instantly, roll back if the server says no
      await qc.cancelQueries({ queryKey: ['employer', 'applications'] });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => old && { ...old, items: old.items.map((a) => (a.id === id ? { ...a, status: decision } : a)) });
      return { prev };
    },
    onError: (e, _v, ctx) => { qc.setQueryData(key, ctx.prev); toast(e.message, 'error'); },
    onSuccess: (_d, v) => toast(v.decision === 'accepted' ? 'Applicant accepted' : 'Applicant rejected'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['employer'] }),
  });
  return (
    <div className="stack">
      <div className="page-head"><h1>Applications</h1>{p.taskId && <button className="btn btn-sm" onClick={() => set({ taskId: '' })}>Clear task filter ✕</button>}</div>
      <div className="filters card">
        <SearchBox value={p.search || ''} onChange={(v) => set({ search: v })} placeholder="Search student or task…" />
        <select className="input" aria-label="Status" value={p.status || ''} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option>{APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select className="input" aria-label="Sort" value={p.sort} onChange={(e) => set({ sort: e.target.value })}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="status">Status</option></select>
      </div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="📨" title="No applications yet" hint="Applicants appear here live." /> })}>{(d) => (<>
        <div className="stack">{d.items.map((a) => (
          <article className="card" key={a.id}>
            <div className="card-head"><div><h3>{a.studentName}</h3><span className="muted small">{a.studentCollege} · applied to <b>{a.taskTitle}</b> · {fmtDate(a.appliedAt)}</span></div><StatusPill status={a.status} /></div>
            <Timeline a={a} />
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setOpen(a.id)}>View details</button>
              {a.status === 'applied' && <><button className="btn btn-primary" disabled={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: 'accepted' })}>Accept</button><button className="btn" disabled={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: 'rejected' })}>Reject</button></>}
            </div>
          </article>))}</div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {open && <ApplicantDetail id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
