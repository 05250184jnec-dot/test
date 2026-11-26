/**
 * ForgotPassword - ask for a password-reset e-mail (/forgot-password).
 * FRONTEND: page of the "auth" feature. Calls authApi.forgotPassword.
 * TALKS TO (backend): POST /api/auth/forgot-password -> routes/authRoutes.js -> controllers/passwordController.js -> models/passwordResetModel.js
 * HOW IT WORKS: always shows the same "if that e-mail has an account..." message, so nobody can learn which e-mails are registered.
 * The e-mailed link works once and expires in 30 minutes.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../authApi.js';
import { Field } from '../../../shared/components/Field.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { emailRule } from '../authRules.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null); const [done, setDone] = useState(false);
  async function submit(e) {
    e.preventDefault(); const bad = emailRule(email); if (bad) return setMsg(bad);
    setBusy(true); setMsg(null);
    try { await authApi.forgotPassword(email); setDone(true); } catch (ex) { setMsg(ex.message); } finally { setBusy(false); }
  }
  return (
    <AuthShell title="Forgot password" subtitle="We'll e-mail you a single-use link that works for 30 minutes." footer={<Link to="/signin">Back to sign in</Link>}>
      {done ? <div className="alert alert-success">If that e-mail has an account, a reset link is on its way.</div> : (
        <form onSubmit={submit} noValidate>
          {msg && <div className="alert alert-error" role="alert">{msg}</div>}
          <Field id="email" label="E-mail"><input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>)}
    </AuthShell>
  );
}
