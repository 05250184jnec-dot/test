/**
 * App.jsx - the route table: which URL shows which page. Nothing else lives here.
 * FRONTEND: top-level router. Public pages first, then role-guarded areas inside the shared Layout.
 * TALKS TO (backend): none (pages load their own data through features/<name>/<name>Api.js).
 * HOW IT WORKS: <PublicOnly> pages need you signed out; <Protected> needs you signed in; <RoleRoute role="x"> needs that role.
 * To add a page: create it in its feature's pages/ folder, import it here and add one <Route>.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { Protected, PublicOnly, RoleRoute } from './shared/routes/guards.jsx';
import Layout from './shared/components/Layout.jsx';
import { RateLimitBanner } from './shared/components/Toast.jsx';
import DashboardRouter from './features/dashboards/DashboardRouter.jsx';
import SignIn from './features/auth/pages/SignIn.jsx';
import SignUp from './features/auth/pages/SignUp.jsx';
import VerifyEmail from './features/auth/pages/VerifyEmail.jsx';
import PendingApproval from './features/auth/pages/PendingApproval.jsx';
import ForgotPassword from './features/auth/pages/ForgotPassword.jsx';
import ResetPassword from './features/auth/pages/ResetPassword.jsx';
import VerifyCertificate from './features/certificates/pages/VerifyCertificate.jsx';
import Certificates from './features/certificates/pages/Certificates.jsx';
import Profile from './features/profile/pages/Profile.jsx';
import FeedbackPage from './features/feedback/pages/FeedbackPage.jsx';
import Browse from './features/tasks/pages/Browse.jsx';
import Apply from './features/tasks/pages/Apply.jsx';
import MyTasks from './features/tasks/pages/MyTasks.jsx';
import TaskForm from './features/tasks/pages/TaskForm.jsx';
import AdminTasks from './features/tasks/pages/AdminTasks.jsx';
import StudentApplications from './features/applications/pages/StudentApplications.jsx';
import EmployerApplications from './features/applications/pages/EmployerApplications.jsx';
import ReviewWork from './features/applications/pages/ReviewWork.jsx';
import Registrations from './features/admin/pages/Registrations.jsx';
import Users from './features/admin/pages/Users.jsx';
import AuditLog from './features/admin/pages/AuditLog.jsx';

export default function App() {
  return (
    <>
      <RateLimitBanner />
      <Routes>
        <Route path="/verify/:certCode" element={<VerifyCertificate />} />
        <Route element={<PublicOnly />}>
          <Route path="/signin" element={<SignIn />} /><Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} /><Route path="/pending" element={<PendingApproval />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route element={<RoleRoute role="student" />}>
              <Route path="/student" element={<DashboardRouter />} />
              <Route path="/student/browse" element={<Browse />} />
              <Route path="/student/tasks/:id" element={<Apply />} />
              <Route path="/student/applications" element={<StudentApplications scope="active" />} />
              <Route path="/student/history" element={<StudentApplications scope="history" />} />
              <Route path="/student/certificates" element={<Certificates />} />
              <Route path="/student/feedback" element={<FeedbackPage />} />
              <Route path="/student/profile" element={<Profile />} />
            </Route>
            <Route element={<RoleRoute role="employer" />}>
              <Route path="/employer" element={<DashboardRouter />} />
              <Route path="/employer/tasks" element={<MyTasks />} />
              <Route path="/employer/tasks/new" element={<TaskForm />} />
              <Route path="/employer/tasks/:id/edit" element={<TaskForm />} />
              <Route path="/employer/applications" element={<EmployerApplications />} />
              <Route path="/employer/review" element={<ReviewWork />} />
              <Route path="/employer/feedback" element={<FeedbackPage />} />
              <Route path="/employer/profile" element={<Profile />} />
            </Route>
            <Route element={<RoleRoute role="admin" />}>
              <Route path="/admin" element={<DashboardRouter />} />
              <Route path="/admin/registrations" element={<Registrations />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/audit" element={<AuditLog />} />
              <Route path="/admin/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </>
  );
}
