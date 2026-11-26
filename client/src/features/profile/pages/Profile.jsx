// /**
//  * Profile - edit your details and change your password (/student|employer|admin/profile). Same page for all 3 roles.
//  * FRONTEND: page of the "profile" feature. Uses profileApi and updates the user held in AuthContext.
//  * TALKS TO (backend): PUT /api/auth/profile -> controllers/profileController.js; POST /api/auth/change-password -> controllers/passwordController.js
//  *   (both via routes/authRoutes.js -> models/userModel.js)
//  * HOW IT WORKS: two forms with their own react-query mutations. Students edit "college", employers edit "organization".
//  * After saving, setUser() refreshes the name shown in the top bar. Server field errors appear under the inputs.
//  */
// import { useState } from 'react';
// import { useMutation } from '@tanstack/react-query';
// import * as profileApi from '../profileApi.js';
// import { useAuth } from '../../../shared/context/AuthContext.jsx';
// import { Field } from '../../../shared/components/Field.jsx';
// import { useToast } from '../../../shared/components/Toast.jsx';
// import { pwRules } from '../../auth/authRules.js';

// export default function Profile() {
//   const { user, setUser } = useAuth(); const toast = useToast();
//   const [f, setF] = useState({ name: user.name, phone: user.phone || '', bio: user.bio || '', college: user.college || '', organization: user.organization || '' });
//   const [err, setErr] = useState({});
//   const [pw, setPw] = useState({ currentPassword: '', newPassword: '' }); const [pwErr, setPwErr] = useState(null);
//   const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

//   const save = useMutation({
//     mutationFn: () => profileApi.updateProfile({ name: f.name, phone: f.phone, bio: f.bio, ...(user.role === 'student' ? { college: f.college } : user.role === 'employer' ? { organization: f.organization } : {}) }),
//     onSuccess: (u) => { setUser(u); setErr({}); toast('Profile saved'); }, onError: (e) => setErr(e.errors || { name: e.message }),
//   });
//   const change = useMutation({
//     mutationFn: () => profileApi.changePassword(pw),
//     onSuccess: () => { setPw({ currentPassword: '', newPassword: '' }); setPwErr(null); toast('Password changed'); }, onError: (e) => setPwErr(e.errors?.newPassword || e.message),
//   });
//   return (
//     <div className="stack">
//       <div className="page-head"><h1>My profile</h1><p className="muted">{user.email} · <span className="pill pill-primary">{user.role}</span></p></div>
//       <div className="grid-2">
//         <form className="card stack" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
//           <h3>Details</h3>
//           <Field id="n" label="Full name" error={err.name}><input id="n" className="input" value={f.name} onChange={set('name')} /></Field>
//           {user.role === 'student' && <Field id="c" label="College / university" error={err.college}><input id="c" className="input" value={f.college} onChange={set('college')} /></Field>}
//           {user.role === 'employer' && <Field id="o" label="Organization" error={err.organization}><input id="o" className="input" value={f.organization} onChange={set('organization')} /></Field>}
//           <Field id="p" label="Phone" error={err.phone}><input id="p" className="input" value={f.phone} onChange={set('phone')} /></Field>
//           <Field id="b" label="About you" error={err.bio}><textarea id="b" className="input" rows={4} maxLength={1000} value={f.bio} onChange={set('bio')} /></Field>
//           <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</button>
//         </form>
//         <form className="card stack" onSubmit={(e) => { e.preventDefault(); const bad = pwRules(pw.newPassword); if (bad) return setPwErr(bad); change.mutate(); }}>
//           <h3>Change password</h3>
//           {pwErr && <div className="alert alert-error" role="alert">{pwErr}</div>}
//           <Field id="cp" label="Current password"><input id="cp" className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
//           <Field id="np" label="New password" hint="8+ characters, upper + lower case and a number"><input id="np" className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
//           <button className="btn" disabled={change.isPending}>Update password</button>
//         </form>
//       </div>
//     </div>
//   );
// }


/**
 * Profile - edit your details and change your password (/student|employer|admin/profile). Same page for all 3 roles.
 * FRONTEND: page of the "profile" feature. Uses profileApi and updates the user held in AuthContext.
 * TALKS TO (backend): PUT /api/auth/profile -> controllers/profileController.js; POST /api/auth/change-password -> controllers/passwordController.js
 *   (both via routes/authRoutes.js -> models/userModel.js)
 * HOW IT WORKS: two forms with their own react-query mutations. Students edit "college", employers edit "organization".
 * After saving, setUser() refreshes the name shown in the top bar. Server field errors appear under the inputs.
 * The confirm-password check is frontend-only: confirmPassword is never sent to the server.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as profileApi from '../profileApi.js';
import { useAuth } from '../../../shared/context/AuthContext.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { pwRules } from '../../auth/authRules.js';

export default function Profile() {
  const { user, setUser } = useAuth(); const toast = useToast();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', bio: user.bio || '', college: user.college || '', organization: user.organization || '' });
  const [err, setErr] = useState({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwErr, setPwErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = useMutation({
    mutationFn: () => profileApi.updateProfile({ name: f.name, phone: f.phone, bio: f.bio, ...(user.role === 'student' ? { college: f.college } : user.role === 'employer' ? { organization: f.organization } : {}) }),
    onSuccess: (u) => { setUser(u); setErr({}); toast('Profile saved'); }, onError: (e) => setErr(e.errors || { name: e.message }),
  });
  const change = useMutation({
    mutationFn: () => profileApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
    onSuccess: () => { setPw({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwErr(null); toast('Password changed'); },
    onError: (e) => setPwErr(e.errors?.newPassword || e.message),
  });

  function submitPassword(e) {
    e.preventDefault();
    const bad = pwRules(pw.newPassword);
    if (bad) return setPwErr(bad);
    if (pw.newPassword !== pw.confirmPassword) return setPwErr('New passwords do not match');
    setPwErr(null);
    change.mutate();
  }

  const toggle = (
    <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: '#5b5bf0', fontWeight: 600 }}>
      {showPw ? 'Hide' : 'Show'}
    </button>
  );

  return (
    <div className="stack">
      <div className="page-head"><h1>My profile</h1><p className="muted">{user.email} · <span className="pill pill-primary">{user.role}</span></p></div>
      <div className="grid-2">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <h3>Details</h3>
          <Field id="n" label="Full name" error={err.name}><input id="n" className="input" value={f.name} onChange={set('name')} /></Field>
          {user.role === 'student' && <Field id="c" label="College / university" error={err.college}><input id="c" className="input" value={f.college} onChange={set('college')} /></Field>}
          {user.role === 'employer' && <Field id="o" label="Organization" error={err.organization}><input id="o" className="input" value={f.organization} onChange={set('organization')} /></Field>}
          <Field id="p" label="Phone" error={err.phone}><input id="p" className="input" value={f.phone} onChange={set('phone')} /></Field>
          <Field id="b" label="About you" error={err.bio}><textarea id="b" className="input" rows={4} maxLength={1000} value={f.bio} onChange={set('bio')} /></Field>
          <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</button>
        </form>

        <form className="card stack" onSubmit={submitPassword}>
          <h3>Change password</h3>
          {pwErr && <div className="alert alert-error" role="alert">{pwErr}</div>}
          <Field id="cp" label="Current password">
            <div style={{ position: 'relative' }}>
              <input id="cp" className="input" type={showPw ? 'text' : 'password'} value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" style={{ paddingRight: 64 }} />
              {toggle}
            </div>
          </Field>
          <Field id="np" label="New password" hint="8+ characters, upper + lower case and a number">
            <div style={{ position: 'relative' }}>
              <input id="np" className="input" type={showPw ? 'text' : 'password'} value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" style={{ paddingRight: 64 }} />
            </div>
          </Field>
          <Field id="cnp" label="Confirm new password">
            <div style={{ position: 'relative' }}>
              <input id="cnp" className="input" type={showPw ? 'text' : 'password'} value={pw.confirmPassword}
                onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" style={{ paddingRight: 64 }} />
            </div>
          </Field>
          <button className="btn" disabled={change.isPending}>{change.isPending ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </div>
  );
}