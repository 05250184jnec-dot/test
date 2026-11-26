/**
 * Field.jsx - a form row: label + input (passed as children) + hint + red error text.
 * FRONTEND: shared component used by every form.
 * TALKS TO (backend): none. The `error` text usually comes from the server's per-field validation errors.
 * HOW IT WORKS: wrap any <input>/<textarea>/<select> in <Field id label error hint>. The hint hides when an error shows.
 */
export function Field({ label, error, hint, children, id }) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>{children}
      {hint && !error && <span className="muted small">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}
