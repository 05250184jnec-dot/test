/**
 * Timeline.jsx - Applied → Accepted → Submitted → Completed (or Rejected) progress bar for one application.
 * FRONTEND: shared component used on student/employer application cards and the student dashboard.
 * TALKS TO (backend): none. It reads the date fields (appliedAt, acceptedAt...) of an application object.
 * HOW IT WORKS: a step is "done" when its date exists; the last done step is highlighted as "current".
 */
import { fmtDate } from '../utils/format.js';

export default function Timeline({ a }) {
  if (a.status === 'rejected') return <div className="tl"><div className="tl-step done"><i />Applied<small>{fmtDate(a.appliedAt)}</small></div><div className="tl-step bad"><i />Rejected<small>{fmtDate(a.decidedAt)}</small></div></div>;
  const steps = [['Applied', a.appliedAt], ['Accepted', a.acceptedAt], ['Submitted', a.submittedAt], ['Completed', a.completedAt]];
  const lastDone = steps.reduce((acc, [, d], i) => (d ? i : acc), 0);
  return <div className="tl">{steps.map(([label, d], i) => <div key={label} className={`tl-step ${i <= lastDone ? 'done' : ''} ${i === lastDone ? 'current' : ''}`}><i />{label}<small>{d ? fmtDate(d) : ''}</small></div>)}</div>;
}
