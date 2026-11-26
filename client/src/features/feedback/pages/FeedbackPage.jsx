/**
 * FeedbackPage - ratings you received and gave (/student/feedback and /employer/feedback). One component for both roles.
 * FRONTEND: page of the "feedback" feature. Calls feedbackApi.myFeedback(role).
 * TALKS TO (backend): GET /api/{student|employer}/feedback -> routes/studentRoutes.js, employerRoutes.js
 *   -> controllers/applicationController.js (myFeedback) -> models/feedbackModel.js
 * HOW IT WORKS: the role comes from useAuth(); the server returns { received, given } and we draw two columns.
 */
import { useQuery } from '@tanstack/react-query';
import * as feedbackApi from '../feedbackApi.js';
import { useAuth } from '../../../shared/context/AuthContext.jsx';
import { DataState, Empty } from '../../../shared/components/Loading.jsx';
import { Stars } from '../../../shared/components/Badges.jsx';
import { fmtDate } from '../../../shared/utils/format.js';

export default function FeedbackPage() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: [user.role, 'feedback'], queryFn: () => feedbackApi.myFeedback(user.role) });
  const List = ({ items, who }) => (!items.length ? <Empty icon="⭐" title="No feedback yet" /> : items.map((f) => (
    <div className="card" key={f.id}><div className="card-head"><b>{f.taskTitle}</b><Stars value={f.rating} size={18} /></div>
      <p className="muted small">{who === 'from' ? `From ${f.fromOrg || f.fromName}` : `To ${f.toName}`} · {fmtDate(f.createdAt)}</p>{f.comment && <p className="pre">“{f.comment}”</p>}</div>)));
  return (
    <div className="stack">
      <div className="page-head"><h1>Feedback</h1></div>
      <DataState q={q}>{(d) => (<div className="grid-2"><section className="stack"><h3>Received</h3><List items={d.received} who="from" /></section><section className="stack"><h3>Given</h3><List items={d.given} who="to" /></section></div>)}</DataState>
    </div>
  );
}
