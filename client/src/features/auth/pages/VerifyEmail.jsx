/**
 * VerifyEmail - enter the 6-digit e-mail code (/verify-email). Code expires in 10 minutes; resend has a 60 s cooldown.
 * FRONTEND: page of the "auth" feature. Gets the e-mail from the router state set by SignUp/SignIn.
 * TALKS TO (backend): POST /api/auth/verify-email and POST /api/auth/resend-code
 *   -> routes/authRoutes.js -> controllers/verifyEmailController.js -> models/emailCodeModel.js, userModel.js
 * HOW IT WORKS: only digits are accepted. On success the account becomes "pending approval" and we go to /pending.
 * The Resend button is disabled while useCooldown() counts down from 60.
 */
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as authApi from '../authApi.js';
import { useCooldown } from '../../../shared/hooks/hooks.js';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function VerifyEmail() {
  const { state } = useLocation(); const nav = useNavigate(); const toast = useToast();
  const email = state?.email;
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  const [left, setLeft] = useCooldown(state?.fresh ? 60 : 0);
  if (!email) return <Navigate to="/signin" replace />;

  async function submit(e) {
    e.preventDefault(); setMsg(null);
    if (!/^\d{6}$/.test(code)) return setMsg('Enter the 6-digit code');
    setBusy(true);
    try { await authApi.verifyEmail(email, code); nav('/pending', { replace: true }); }
    catch (ex) { setMsg(ex.message); } finally { setBusy(false); }
  }
  async function resend() {
    try { await authApi.resendCode(email); setLeft(60); toast('A new code was sent if the account is waiting for verification'); }
    catch (ex) { setMsg(ex.message); }
  }
  return (
    <AuthShell title="Verify your e-mail" subtitle={<>We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.</>}>
      <form onSubmit={submit} noValidate>
        {msg && <div className="alert alert-error" role="alert">{msg}</div>}
        <Field id="code" label="Verification code"><input id="code" className="input code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Checking…' : 'Verify'}</button>
      </form>
      <button className="btn btn-block btn-ghost" disabled={left > 0} onClick={resend}>{left > 0 ? `Resend code in ${left}s` : 'Resend code'}</button>
    </AuthShell>
  );
}
