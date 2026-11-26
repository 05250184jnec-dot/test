
import { useAuth } from '../../shared/context/AuthContext.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function DashboardRouter() {
  const { user } = useAuth();
  if (user.role === 'student') return <StudentDashboard />;
  if (user.role === 'employer') return <EmployerDashboard />;
  return <AdminDashboard />;
}
