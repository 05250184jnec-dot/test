/**
 * AuthContext.jsx - holds "who is signed in" (user + token) and the light/dark theme for the whole app.
 * FRONTEND: shared React context. Any component calls useAuth() to get { user, login, logout, ... }.
 * TALKS TO (backend): GET /api/auth/me (restore session) and POST /api/auth/login via features/auth/authApi.js
 *   -> routes/authRoutes.js -> controllers/loginController.js -> models/userModel.js
 * HOW IT WORKS: on page load, if a token is saved in localStorage we ask the server "who am I?".
 * login() stores the returned token and user. Any 401 reply fires "ih:logout" and we sign out automatically.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken, setToken } from '../api/apiClient.js';
import * as authApi from '../../features/auth/authApi.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('ih_theme') || 'light'; } catch { return 'light'; } });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('ih_theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const logout = useCallback(() => { setToken(null); setUser(null); qc.clear(); }, [qc]);

  useEffect(() => { // restore session on page load
    if (!getToken()) return;
    authApi.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { // auto-logout when any request returns 401
    window.addEventListener('ih:logout', logout);
    return () => window.removeEventListener('ih:logout', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const d = await authApi.login(email, password);
    setToken(d.token); setUser(d.user); qc.clear();
    return d.user;
  }, [qc]);
  const refresh = useCallback(() => authApi.me().then(setUser), []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh, setUser, theme, toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }), [user, loading, login, logout, refresh, theme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
