/**
 * guards.jsx - route guards: Protected (must be signed in), RoleRoute (must have this role), PublicOnly (must be signed out).
 * FRONTEND: shared routing helpers used in App.jsx.
 * TALKS TO (backend): none. The SERVER enforces the same rules (middleware/auth.js); these only give a clean experience.
 * HOW IT WORKS: each guard reads useAuth() and either renders <Outlet/> (the child routes) or redirects with <Navigate/>.
 * RoleRoute sends a user who opens another role's area back to their own dashboard.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Skeleton } from '../components/Loading.jsx';

export const Splash = () => <div className="splash"><img src="/logo.png" alt="InternHive" width="140" /><Skeleton w={160} h={10} /></div>;

export function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Splash />;
  return user ? <Outlet /> : <Navigate to="/signin" replace state={{ from: loc.pathname }} />;
}
export function RoleRoute({ role }) {
  const { user } = useAuth();
  return user.role === role ? <Outlet /> : <Navigate to={`/${user.role}`} replace />;
}
export function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to={`/${user.role}`} replace /> : <Outlet />;
}
