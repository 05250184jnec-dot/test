/**
 * Toast.jsx - pop-up messages ("Saved!") and the red banner shown when the server says "too many requests".
 * FRONTEND: shared component. <ToastProvider> wraps the app in main.jsx; any page calls useToast().
 * TALKS TO (backend): none directly. RateLimitBanner listens for the "ih:ratelimit" event that apiClient.js fires on HTTP 429.
 * HOW IT WORKS: ToastProvider keeps a list of messages in state and removes each after 4.5 s.
 * useToast() returns a function: toast('Saved') or toast('Oops', 'error').
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useCooldown } from '../hooks/hooks.js';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

/** Banner with a live countdown when the API answers 429 (rate limited). */
export function RateLimitBanner() {
  const [left, setLeft] = useCooldown(0);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const h = (e) => { setLeft(e.detail.retryAfter); setMsg(e.detail.message); };
    window.addEventListener('ih:ratelimit', h);
    return () => window.removeEventListener('ih:ratelimit', h);
  }, [setLeft]);
  if (left <= 0) return null;
  return <div className="ratelimit" role="alert">⏳ Too many requests. {msg ? '' : ''}You can try again in <b>{left}s</b>.</div>;
}
