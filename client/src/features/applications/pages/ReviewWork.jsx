/**
 * ReviewWork - the employer's queue of submitted work waiting for review (/employer/review).
 * FRONTEND: page of the "applications" feature. Uses applicationApi.reviewQueue; opens ReviewModal for the chosen item.
 * TALKS TO (backend): GET /api/employer/review -> routes/employerRoutes.js -> controllers/employerApplicationController.js (reviewQueue) -> models/applicationModel.js
 * HOW IT WORKS: lists applications with status "submitted", oldest first. Click Review to approve (rating + feedback, which issues
 * the certificate) or request changes. New submissions show up live through the socket.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as applicationApi from '../applicationApi.js';
import ReviewModal from '../components/ReviewModal.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { Pagination } from '../../../shared/components/ListControls.jsx';
import { useListParams } from '../../../shared/hooks/hooks.js';
import { fmtDateTime } from '../../../shared/utils/format.js';

export default function ReviewWork() {
  const [p, set] = useListParams({});
  const q = useQuery({ queryKey: ['employer', 'review', p.page], queryFn: () => applicationApi.reviewQueue({ page: p.page, sort: 'oldest' }) });
  const [sel, setSel] = useState(null);
  return (
    <div className="stack">
      <div className="page-head"><h1>Review work</h1><p className="muted">Approve finished work to issue the student's certificate.</p></div>
      <DataState q={q} empty={Object.assign((d) => !d.items.length, { node: <Empty icon="✅" title="Nothing waiting" hint="Submitted work shows up here instantly." /> })}>{(d) => (<>
        <div className="stack">{d.items.map((a) => (<article className="card" key={a.id}><div className="card-head"><div><h3>{a.studentName}</h3><span className="muted small">{a.taskTitle} · submitted {fmtDateTime(a.submittedAt)}</span></div><button className="btn btn-primary" onClick={() => setSel(a)}>Review</button></div></article>))}</div>
        <Pagination data={d} onPage={(n) => set({ page: n })} />
      </>)}</DataState>
      {sel && <ReviewModal a={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
