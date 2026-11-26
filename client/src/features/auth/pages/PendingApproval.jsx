/**
 * PendingApproval - "waiting for admin approval" screen (/pending), shown after e-mail verification.
 * FRONTEND: page of the "auth" feature. Purely informational.
 * TALKS TO (backend): none. (The admin's decision is made in admin/pages/Registrations.jsx and e-mailed to the user.)
 * HOW IT WORKS: draws the steps Register -> Verify e-mail -> Admin review -> Decision with the first two ticked.
 */
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';

export default function PendingApproval() {
  const steps = [['Register', 'done'], ['Verify e-mail', 'done'], ['Admin review', 'now'], ['Decision', '']];
  return (
    <AuthShell title="Waiting for approval" subtitle="Your e-mail is verified. An admin will review your registration and e-mail you the decision." footer={<Link to="/signin">Back to sign in</Link>}>
      <ol className="steps">{steps.map(([s, st], i) => <li key={s} className={st}><span>{st === 'done' ? '✓' : i + 1}</span>{s}</li>)}</ol>
      <div className="alert alert-info">You can sign in as soon as you are approved.</div>
    </AuthShell>
  );
}
