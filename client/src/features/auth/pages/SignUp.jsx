// /**
//  * SignUp - the register page (/signup). Students and employers only; the admin role can never be chosen here.
//  * FRONTEND: page of the "auth" feature. Calls authApi.register.
//  * TALKS TO (backend): POST /api/auth/register -> routes/authRoutes.js -> controllers/registerController.js -> models/userModel.js (+ emailCodeModel.js)
//  * HOW IT WORKS: the role tabs switch between the college field and the organization field. Rules mirror the server's zod
//  * validation. On success the server e-mails a 6-digit code and we go to /verify-email. Server field errors are shown under each input.
//  */
// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import * as authApi from '../authApi.js';
// import { Field } from '../../../shared/components/Field.jsx';
// import AuthShell from '../components/AuthShell.jsx';
// import { pwRules, emailRule } from '../authRules.js';

// export default function SignUp() {
//   const nav = useNavigate();
//   const [role, setRole] = useState('student');
//   const [f, setF] = useState({ name: '', email: '', password: '', college: '', organization: '' });
//   const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
//   const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

//   async function submit(e) {
//     e.preventDefault(); setMsg(null);
//     const v = {
//       name: f.name.trim().length < 2 ? 'Enter your full name' : null, email: emailRule(f.email), password: pwRules(f.password),
//       college: role === 'student' && !f.college.trim() ? 'College / university is required' : null,
//       organization: role === 'employer' && !f.organization.trim() ? 'Organization is required' : null,
//     };
//     setErr(v); if (Object.values(v).some(Boolean)) return;
//     setBusy(true);
//     try {
//       await authApi.register({ role, name: f.name, email: f.email, password: f.password, ...(role === 'student' ? { college: f.college } : { organization: f.organization }) });
//       nav('/verify-email', { state: { email: f.email.trim().toLowerCase(), fresh: true } });
//     } catch (ex) { setErr(ex.errors || {}); setMsg(ex.message); } finally { setBusy(false); }
//   }
//   return (
//     <AuthShell title="Create your account" subtitle="Students and organizations are approved by an admin before first use." footer={<>Already registered? <Link to="/signin">Sign in</Link></>}>
//       <div className="seg" role="tablist" aria-label="Account type">
//         {['student', 'employer'].map((r) => <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'on' : ''} onClick={() => setRole(r)}>{r === 'student' ? '🎓 Student' : '🏢 Employer'}</button>)}
//       </div>
//       <form onSubmit={submit} noValidate>
//         {msg && <div className="alert alert-error" role="alert">{msg}</div>}
//         <Field id="name" label="Full name" error={err.name}><input id="name" className="input" value={f.name} onChange={set('name')} autoComplete="name" /></Field>
//         {role === 'student'
//           ? <Field id="college" label="College / university" error={err.college}><input id="college" className="input" value={f.college} onChange={set('college')} /></Field>
//           : <Field id="org" label="Organization" error={err.organization}><input id="org" className="input" value={f.organization} onChange={set('organization')} /></Field>}
//         <Field id="email" label="E-mail" error={err.email}><input id="email" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
//         <Field id="pw" label="Password" error={err.password} hint="8+ characters with upper-case, lower-case and a number"><input id="pw" className="input" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
//         <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
//       </form>
//     </AuthShell>
//   );
// }



/**
 * SignUp - the register page (/signup). Students and employers only; the admin role can never be chosen here.
 * FRONTEND: page of the "auth" feature. Calls authApi.register.
 * TALKS TO (backend): POST /api/auth/register -> routes/authRoutes.js -> controllers/registerController.js -> models/userModel.js (+ emailCodeModel.js)
 * HOW IT WORKS: the role tabs switch between the college field and the organization field. Rules mirror the server's zod
 * validation. The confirm-password check is frontend-only: confirmPassword is never sent to the server.
 * On success the server e-mails a 6-digit code and we go to /verify-email. Server field errors are shown under each input.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../authApi.js';
import { Field } from '../../../shared/components/Field.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { pwRules, emailRule } from '../authRules.js';

export default function SignUp() {
  const nav = useNavigate();
  const [role, setRole] = useState('student');
  const [f, setF] = useState({ name: '', email: '', password: '', confirmPassword: '', college: '', organization: '' });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setMsg(null);
    const v = {
      name: f.name.trim().length < 2 ? 'Enter your full name' : null,
      email: emailRule(f.email),
      password: pwRules(f.password),
      confirmPassword: f.confirmPassword !== f.password ? 'Passwords do not match' : null,
      college: role === 'student' && !f.college.trim() ? 'College / university is required' : null,
      organization: role === 'employer' && !f.organization.trim() ? 'Organization is required' : null,
    };
    setErr(v); if (Object.values(v).some(Boolean)) return;
    setBusy(true);
    try {
      // Send only the fields the server expects. confirmPassword stays on the frontend.
      await authApi.register({
        role,
        name: f.name,
        email: f.email,
        password: f.password,
        ...(role === 'student' ? { college: f.college } : { organization: f.organization }),
      });
      nav('/verify-email', { state: { email: f.email.trim().toLowerCase(), fresh: true } });
    } catch (ex) { setErr(ex.errors || {}); setMsg(ex.message); } finally { setBusy(false); }
  }

  const toggle = (
    <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: '#5b5bf0', fontWeight: 600 }}>
      {showPw ? 'Hide' : 'Show'}
    </button>
  );

  return (
    <AuthShell title="Create your account" subtitle="Students and organizations are approved by an admin before first use." footer={<>Already registered? <Link to="/signin">Sign in</Link></>}>
      <div className="seg" role="tablist" aria-label="Account type">
        {['student', 'employer'].map((r) => <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'on' : ''} onClick={() => setRole(r)}>{r === 'student' ? '🎓 Student' : '🏢 Employer'}</button>)}
      </div>
      <form onSubmit={submit} noValidate>
        {msg && <div className="alert alert-error" role="alert">{msg}</div>}
        <Field id="name" label="Full name" error={err.name}><input id="name" className="input" value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        {role === 'student'
          ? <Field id="college" label="College / university" error={err.college}><input id="college" className="input" value={f.college} onChange={set('college')} /></Field>
          : <Field id="org" label="Organization" error={err.organization}><input id="org" className="input" value={f.organization} onChange={set('organization')} /></Field>}
        <Field id="email" label="E-mail" error={err.email}><input id="email" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field id="pw" label="Password" error={err.password} hint="8+ characters with upper-case, lower-case and a number">
          <div style={{ position: 'relative' }}>
            <input id="pw" className="input" type={showPw ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete="new-password" style={{ paddingRight: 64 }} />
            {toggle}
          </div>
        </Field>
        <Field id="confirmPw" label="Confirm password" error={err.confirmPassword}>
          <div style={{ position: 'relative' }}>
            <input id="confirmPw" className="input" type={showPw ? 'text' : 'password'} value={f.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" style={{ paddingRight: 64 }} />
          </div>
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}