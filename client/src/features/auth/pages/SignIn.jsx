// /**
//  * SignIn - the login page (/signin).
//  * FRONTEND: page of the "auth" feature. Uses login() from shared/context/AuthContext.jsx, which calls authApi.login.
//  * TALKS TO (backend): POST /api/auth/login -> routes/authRoutes.js -> controllers/loginController.js -> models/userModel.js
//  * HOW IT WORKS: checks e-mail/password shape in the browser, then calls login(). On success it stores the token and goes to
//  * the user's dashboard. The server explains WHY a login is blocked only after the password was correct
//  * (not verified -> /verify-email, pending -> /pending), otherwise a generic "Invalid e-mail or password".
//  */
// import { useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../../shared/context/AuthContext.jsx';
// import { Field } from '../../../shared/components/Field.jsx';
// import { useToast } from '../../../shared/components/Toast.jsx';
// import AuthShell from '../components/AuthShell.jsx';
// import { emailRule } from '../authRules.js';

// export default function SignIn() {
//   const { login } = useAuth();
//   const nav = useNavigate(); const loc = useLocation(); const toast = useToast();
//   const [f, setF] = useState({ email: '', password: '' });
//   const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
//   const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

//   async function submit(e) {
//     e.preventDefault(); setMsg(null);
//     const v = { email: emailRule(f.email), password: f.password ? null : 'Password is required' };
//     setErr(v); if (v.email || v.password) return;
//     setBusy(true);
//     try { const u = await login(f.email.trim(), f.password); toast(`Welcome back, ${u.name.split(' ')[0]}!`); nav(loc.state?.from?.startsWith(`/${u.role}`) ? loc.state.from : `/${u.role}`, { replace: true }); }
//     catch (ex) {
//       if (ex.code === 'EMAIL_NOT_VERIFIED') return nav('/verify-email', { state: { email: ex.extra.email || f.email } });
//       if (ex.code === 'PENDING_APPROVAL') return nav('/pending');
//       setMsg(ex.message);
//     } finally { setBusy(false); }
//   }
//   return (
//     <AuthShell title="Sign in" subtitle="Welcome back to InternHive." footer={<>New here? <Link to="/signup">Create an account</Link></>}>
//       <form onSubmit={submit} noValidate>
//         {msg && <div className="alert alert-error" role="alert">{msg}</div>}
//         <Field id="email" label="E-mail" error={err.email}><input id="email" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
//         <Field id="password" label="Password" error={err.password}><input id="password" className="input" type="password" autoComplete="current-password" value={f.password} onChange={set('password')} /></Field>
//         <div className="right"><Link to="/forgot-password" className="small">Forgot password?</Link></div>
//         <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
//       </form>
//     </AuthShell>
//   );
// }


/**
 * SignIn - the login page (/signin).
 * FRONTEND: page of the "auth" feature. Uses login() from shared/context/AuthContext.jsx, which calls authApi.login.
 * TALKS TO (backend): POST /api/auth/login -> routes/authRoutes.js -> controllers/loginController.js -> models/userModel.js
 * HOW IT WORKS: checks e-mail/password shape in the browser, then calls login(). On success it stores the token and goes to
 * the user's dashboard. The server explains WHY a login is blocked only after the password was correct
 * (not verified -> /verify-email, pending -> /pending), otherwise a generic "Invalid e-mail or password".
 * The Show/Hide toggle only changes the input type in the browser; the password is never sent anywhere else.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { emailRule } from '../authRules.js';

export default function SignIn() {
  const { login } = useAuth();
  const nav = useNavigate(); const loc = useLocation(); const toast = useToast();
  const [f, setF] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setMsg(null);
    const v = { email: emailRule(f.email), password: f.password ? null : 'Password is required' };
    setErr(v); if (v.email || v.password) return;
    setBusy(true);
    try { const u = await login(f.email.trim(), f.password); toast(`Welcome back, ${u.name.split(' ')[0]}!`); nav(loc.state?.from?.startsWith(`/${u.role}`) ? loc.state.from : `/${u.role}`, { replace: true }); }
    catch (ex) {
      if (ex.code === 'EMAIL_NOT_VERIFIED') return nav('/verify-email', { state: { email: ex.extra.email || f.email } });
      if (ex.code === 'PENDING_APPROVAL') return nav('/pending');
      setMsg(ex.message);
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to InternHive." footer={<>New here? <Link to="/signup">Create an account</Link></>}>
      <form onSubmit={submit} noValidate>
        {msg && <div className="alert alert-error" role="alert">{msg}</div>}
        <Field id="email" label="E-mail" error={err.email}>
          <input id="email" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} />
        </Field>
        <Field id="password" label="Password" error={err.password}>
          <div style={{ position: 'relative' }}>
            <input id="password" className="input" type={showPw ? 'text' : 'password'} autoComplete="current-password"
              value={f.password} onChange={set('password')} style={{ paddingRight: 64 }} />
            <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: '#5b5bf0', fontWeight: 600 }}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <div className="right"><Link to="/forgot-password" className="small">Forgot password?</Link></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthShell>
  );
}