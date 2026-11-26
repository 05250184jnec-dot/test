/**
 * Stat.jsx - a dashboard number card whose value counts up when it appears.
 * FRONTEND: shared component used by the three dashboards.
 * TALKS TO (backend): none (the number is passed in from dashboard data).
 * HOW IT WORKS: useCountUp animates from the old value to the new one in 600 ms. With decimals it shows
 * the exact value (e.g. an average rating 4.5) and a null value shows "-".
 */
import { useCountUp } from '../hooks/hooks.js';

export function Stat({ label, value, icon, tone = 'primary', suffix = '', decimals = false, hint }) {
  const n = useCountUp(decimals ? 0 : value);
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <div><div className="stat-value">{value === null || value === undefined ? '-' : decimals ? Number(value).toFixed(1) : n}{value !== null && suffix}</div>
        <div className="stat-label">{label}</div>{hint && <div className="stat-hint">{hint}</div>}</div>
    </div>
  );
}
