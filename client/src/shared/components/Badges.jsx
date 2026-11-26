/**
 * Badges.jsx - StatusPill (coloured status label) and Stars (1-5 rating, clickable or read-only).
 * FRONTEND: shared component.
 * TALKS TO (backend): none. Status words ("applied", "pending_review"...) come from the API.
 * HOW IT WORKS: StatusPill looks the status up in LABEL/TONE tables to pick the text and colour.
 * Stars is read-only unless you pass onChange, then each star is a button that reports its number.
 */
const LABEL = {
  applied: 'Applied', accepted: 'Accepted', rejected: 'Rejected', submitted: 'Submitted', completed: 'Completed',
  draft: 'Draft', active: 'Active', pending_review: 'Pending review', pending_approval: 'Pending approval', pending_verification: 'Unverified', approved: 'Approved',
  pending: 'Pending', sent: 'Sent', failed: 'Failed',
};
const TONE = { applied: 'blue', accepted: 'teal', rejected: 'red', submitted: 'gold', completed: 'green', draft: 'grey', active: 'green', pending_review: 'gold', pending_approval: 'gold', pending_verification: 'grey', approved: 'green' };
export const StatusPill = ({ status }) => <span className={`pill pill-${TONE[status] || 'grey'}`}>{LABEL[status] || status}</span>;

export function Stars({ value = 0, onChange, size = 20 }) {
  return (
    <span className="stars" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} disabled={!onChange} className={n <= Math.round(value) ? 'on' : ''} style={{ fontSize: size }} onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>★</button>
      ))}
    </span>
  );
}
