import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} InternHive</span>
      <nav className="app-footer-links">
        <Link to="/help">Help</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </footer>
  );
}