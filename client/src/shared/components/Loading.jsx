/**
 * Loading.jsx - what to show while data loads, when a list is empty, or when a request failed.
 * FRONTEND: shared component. DataState is used by almost every page.
 * TALKS TO (backend): none. It receives the result object of a react-query useQuery() call.
 * HOW IT WORKS: DataState(q) shows skeleton boxes while q.isLoading, an error box with Retry if q.isError,
 * the "empty" node if empty(data) is true, otherwise calls children(data) to draw the real content.
 */
export const Skeleton = ({ h = 16, w = '100%', r = 8 }) => <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
export const SkeletonRows = ({ n = 4 }) => <div className="stack">{Array.from({ length: n }, (_, i) => <div className="card" key={i}><Skeleton h={18} w="40%" /><div style={{ height: 8 }} /><Skeleton h={12} /></div>)}</div>;
export const Empty = ({ icon = '🐝', title, hint, action }) => <div className="empty"><div className="empty-icon">{icon}</div><h4>{title}</h4>{hint && <p className="muted">{hint}</p>}{action}</div>;
export const ErrorBox = ({ error, retry }) => <div className="errorbox" role="alert"><b>Couldn't load this.</b> {error?.message}{retry && <button className="btn btn-sm" onClick={retry}>Retry</button>}</div>;

/** Renders skeleton / error / empty / content from a useQuery result. */
export function DataState({ q, empty, rows = 4, children }) {
  if (q.isLoading) return <SkeletonRows n={rows} />;
  if (q.isError) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (empty?.(q.data)) return empty.node;
  return children(q.data);
}
