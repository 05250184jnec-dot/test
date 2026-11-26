/**
 * ResetPassword - choose a new password from the e-mailed link (/reset-password?token=...).
 * FRONTEND: page of the "auth" feature. Reads the token from the URL, calls authApi.resetPassword.
 * TALKS TO (backend): POST /api/auth/reset-password -> routes/authRoutes.js -> controllers/passwordController.js -> models/passwordResetModel.js, userModel.js
 * HOW IT WORKS: checks the two passwords match and are strong, sends token + password. The server checks the token hash,
 * expiry and single use. On success we go to /signin with a toast.
 */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../authApi.js';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { pwRules } from '../authRules.js';

export default function ResetPassword() {
  const [sp] = useSearchParams(); const nav = useNavigate(); const toast = useToast();
  const token = sp.get('token') || '';
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); const bad = pwRules(pw) || (pw !== pw2 ? 'Passwords do not match' : null);
    if (bad) return setMsg(bad);
    setBusy(true); setMsg(null);
    try { await authApi.resetPassword(token, pw); toast('Password updated. Please sign in.'); nav('/signin'); }
    catch (ex) { setMsg(ex.errors?.password || ex.message); } finally { setBusy(false); }
  }
  return (
    <AuthShell title="Choose a new password" footer={<Link to="/signin">Back to sign in</Link>}>
      <form onSubmit={submit} noValidate>
        {msg && <div className="alert alert-error" role="alert">{msg}</div>}
        <Field id="pw" label="New password" hint="8+ characters, upper + lower case and a number"><input id="pw" className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
        <Field id="pw2" label="Repeat password"><input id="pw2" className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
        <button className="btn btn-primary btn-block" disabled={busy || !token}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </AuthShell>
  );
}
