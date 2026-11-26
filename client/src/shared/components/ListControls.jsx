/**
 * ListControls.jsx - SearchBox (debounced) and Pagination (Prev / Next) for every list page.
 * FRONTEND: shared component.
 * TALKS TO (backend): none itself; it changes the URL params, which makes the page re-query the API.
 * HOW IT WORKS: SearchBox waits 350 ms after you stop typing, then calls onChange(text).
 * Pagination reads { total, page, totalPages } from the API reply and calls onPage(newPage).
 */
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../hooks/hooks.js';

export function SearchBox({ value = '', onChange, placeholder = 'Search…' }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 350);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (debounced !== value) onChange(debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input className="input search" type="search" aria-label="Search" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />;
}

export function Pagination({ data, onPage }) {
  if (!data || data.totalPages <= 1) return data ? <div className="muted small right">{data.total} result{data.total === 1 ? '' : 's'}</div> : null;
  return (
    <div className="pagination">
      <span className="muted small">{data.total} results</span>
      <button className="btn btn-sm" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>← Prev</button>
      <span>Page {data.page} / {data.totalPages}</span>
      <button className="btn btn-sm" disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>Next →</button>
    </div>
  );
}
