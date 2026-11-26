/**
 * AuthShell.jsx - the centred card with the InternHive logo that wraps every public page (sign in, sign up, verify...).
 * FRONTEND: component of the "auth" feature (also used by certificates/VerifyCertificate.jsx).
 * TALKS TO (backend): none.
 * HOW IT WORKS: pass title, optional subtitle and footer; the form goes in as children.
 */
import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-side"><img src="/logo.png" alt="InternHive" /><h2>Real experience. Verified.</h2><p>Complete short tasks for real organizations and earn certificates employers can verify.</p></div>
      <div className="auth-main">
        <div className="auth-card">
          <Link to="/signin" className="auth-logo"><img src="/logo-mark.png" alt="" height="40" /><span>Intern<b>Hive</b></span></Link>
          <h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
