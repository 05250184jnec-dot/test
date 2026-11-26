/**
 * hooks.js - small reusable React hooks (useDebounce, useListParams, useCountUp, useCooldown).
 * FRONTEND: shared hooks, used by many pages.
 * TALKS TO (backend): none (they only manage UI state).
 * HOW IT WORKS: useListParams keeps list filters in the URL (?page=2&search=x) so refresh/share works;
 * useDebounce waits for typing to pause; useCooldown counts seconds down; useCountUp animates numbers.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

/** List filters live in the URL (?page=2&search=x) so they survive refresh and can be shared. */
export function useListParams(defaults = {}) {
  const [sp, setSp] = useSearchParams();
  const params = { ...defaults, ...Object.fromEntries(sp.entries()) };
  params.page = Number(params.page) || 1;
  const set = useCallback((patch) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v === '' || v === undefined || v === null ? next.delete(k) : next.set(k, v)));
      if (!('page' in patch)) next.delete('page'); // any filter change goes back to page 1
      return next;
    }, { replace: true });
  }, [setSp]);
  return [params, set];
}

/** Animated number counter for stat cards. */
export function useCountUp(target, ms = 600) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const to = Number(target) || 0; const from = prev.current; const start = performance.now(); let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      setVal(Math.round(from + (to - from) * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

/** Countdown seconds helper (resend cooldown, rate limits). */
export function useCooldown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}
