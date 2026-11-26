// /**
//  * Layout.jsx - the signed-in shell: sidebar menu, top bar (theme toggle, bell, user) and the page area.
//  * FRONTEND: shared component; wraps every signed-in route in App.jsx (pages render inside <Outlet/>).
//  * TALKS TO (backend): none directly; it starts useSocket() for live updates and shows NotificationBell.
//  * HOW IT WORKS: MENUS lists the links for each role (student teal, employer orange, admin blue). Sign out clears the session and goes to /signin.
//  */
// import { useState } from 'react';
// import { NavLink, Outlet, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext.jsx';
// import { useSocket } from '../hooks/useSocket.js';
// import NotificationBell from '../../features/notifications/components/NotificationBell.jsx';

// export const MENUS = {
//   student: [['/student', '🏠', 'Dashboard', true], ['/student/browse', '🔎', 'Browse Tasks'], ['/student/applications', '📨', 'My Applications'], ['/student/history', '🕘', 'Task History'], ['/student/certificates', '🎓', 'Certificates'], ['/student/feedback', '⭐', 'Feedback'], ['/student/profile', '👤', 'Profile']],
//   employer: [['/employer', '🏠', 'Dashboard', true], ['/employer/tasks', '📋', 'My Tasks'], ['/employer/tasks/new', '➕', 'Post a Task'], ['/employer/applications', '📨', 'Applications'], ['/employer/review', '✅', 'Review Work'], ['/employer/feedback', '⭐', 'Feedback'], ['/employer/profile', '👤', 'Profile']],
//   admin: [['/admin', '🏠', 'Dashboard', true], ['/admin/registrations', '🛡️', 'Registrations'], ['/admin/users', '👥', 'Users'], ['/admin/tasks', '📋', 'Tasks'], ['/admin/audit', '🧾', 'Audit Log'], ['/admin/profile', '👤', 'Profile']],
// };
// const ROLE_LABEL = { student: 'Student', employer: 'Employer', admin: 'Admin · User Manager' };

// export default function Layout() {
//   const { user, logout, theme, toggleTheme } = useAuth();
//   const nav = useNavigate();
//   const [open, setOpen] = useState(false);
//   useSocket();
//   return (
//     <div className="shell" data-role={user.role}>
//       <aside className={`sidebar ${open ? 'open' : ''}`}>
//         <div className="brand"><img src="/logo-mark.png" alt="" height="38" /><span>Intern<b>Hive</b></span></div>
//         <div className="role-chip">{ROLE_LABEL[user.role]}</div>
//         <nav aria-label="Main">
//           {MENUS[user.role].map(([to, icon, label, end]) => (
//             <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span aria-hidden="true">{icon}</span>{label}</NavLink>
//           ))}
//         </nav>
//         <button className="btn btn-ghost signout" onClick={() => { logout(); nav('/signin'); }}>↩ Sign out</button>
//       </aside>
//       {open && <div className="scrim" onClick={() => setOpen(false)} />}
//       <div className="main">
//         <header className="topbar">
//           <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
//           <div className="grow" />
//           <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">{theme === 'light' ? '🌙' : '☀️'}</button>
//           <NotificationBell />
//           <div className="who"><div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div><div className="who-text"><b>{user.name}</b><span className="muted small">{user.email}</span></div></div>
//         </header>
//         <main className="content"><Outlet /></main>
//       </div>
//     </div>
//   );
// }

/**
 * Layout - the signed-in shell: sidebar menu, top bar, page area and footer.
 * Wraps every signed-in route in App.jsx. Pages render inside <Outlet />.
 * Starts useSocket() for live updates and shows the NotificationBell.
 */
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  Home,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Star,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import NotificationBell from '../../features/notifications/components/NotificationBell.jsx';
import Footer from './Footer.jsx';

const ICON_SIZE = 18;

/** Sidebar links per role: [route, icon, label, exactMatch]. */
export const MENUS = {
  student: [
    ['/student', Home, 'Dashboard', true],
    ['/student/browse', Search, 'Browse Tasks'],
    ['/student/applications', Send, 'My Applications'],
    ['/student/history', History, 'Task History'],
    ['/student/certificates', GraduationCap, 'Certificates'],
    ['/student/feedback', Star, 'Feedback'],
    ['/student/profile', User, 'Profile'],
  ],
  employer: [
    ['/employer', Home, 'Dashboard', true],
    ['/employer/tasks', ClipboardList, 'My Tasks'],
    ['/employer/tasks/new', PlusCircle, 'Post a Task'],
    ['/employer/applications', Send, 'Applications'],
    ['/employer/review', CheckSquare, 'Review Work'],
    ['/employer/feedback', Star, 'Feedback'],
    ['/employer/profile', User, 'Profile'],
  ],
  admin: [
    ['/admin', Home, 'Dashboard', true],
    ['/admin/registrations', ShieldCheck, 'Registrations'],
    ['/admin/users', Users, 'Users'],
    ['/admin/tasks', FileText, 'Tasks'],
    ['/admin/audit', History, 'Audit Log'],
    ['/admin/profile', User, 'Profile'],
  ],
};

const ROLE_LABEL = {
  student: 'Student',
  employer: 'Employer',
  admin: 'Admin · User Manager',
};

export default function Layout() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useSocket();

  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="shell" data-role={user.role}>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo-mark.png" alt="" height="38" />
          <span>
            Intern<b>Hive</b>
          </span>
        </div>

        <div className="role-chip">{ROLE_LABEL[user.role]}</div>

        <nav aria-label="Main">
          {MENUS[user.role].map(([to, Icon, label, exactMatch]) => (
            <NavLink
              key={to}
              to={to}
              end={exactMatch}
              onClick={closeMenu}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="btn btn-ghost signout" onClick={handleSignOut}>
          <LogOut size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />
          Sign out
        </button>
      </aside>

      {menuOpen && <div className="scrim" onClick={closeMenu} />}

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />
          </button>

          <div className="grow" />

          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {theme === 'light'
              ? <Moon size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              : <Sun size={ICON_SIZE} strokeWidth={2} aria-hidden="true" />}
          </button>

          <NotificationBell />

          <div className="who">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="who-text">
              <b>{user.name}</b>
              <span className="muted small">{user.email}</span>
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}