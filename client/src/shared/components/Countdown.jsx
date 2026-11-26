/**
 * Countdown.jsx - small "3 days left" / "Due today" / "Overdue" label for a deadline date.
 * FRONTEND: shared component (task cards, dashboards, applications).
 * TALKS TO (backend): none. The deadline date comes from the task data.
 * HOW IT WORKS: counts days with daysLeft() from utils/format.js; 2 days or fewer gets the red "urgent" style.
 */
import { daysLeft } from '../utils/format.js';

export function Countdown({ date }) {
  const n = daysLeft(date);
  return <span className={`countdown ${n <= 2 ? 'urgent' : ''}`}>{n < 0 ? 'Overdue' : n === 0 ? 'Due today' : `${n} day${n > 1 ? 's' : ''} left`}</span>;
}
