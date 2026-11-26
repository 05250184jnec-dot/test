/**
 * useSocket.js - live updates: opens a Socket.IO connection and refreshes the right data when the server pushes an event.
 * FRONTEND: shared hook, called once inside Layout.jsx (only for signed-in users).
 * TALKS TO (backend): Socket.IO at /socket.io -> server/src/socket/index.js (JWT sent in auth.token).
 * HOW IT WORKS: when the server emits e.g. "applications:changed", we invalidate the matching react-query keys
 * so every open list/dashboard refetches by itself. "notification:new" also shows a toast.
 */
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../api/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export function useSocket() {
  const qc = useQueryClient();
  const { user, refresh } = useAuth();
  const toast = useToast();
  useEffect(() => {
    if (!user) return undefined;
    const socket = io('/', { auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    const inv = (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    socket.on('notification:new', (n) => { toast(n.title, 'info'); inv('notifications', user.role); });
    socket.on('applications:changed', () => inv('student', 'employer', 'notifications'));
    socket.on('tasks:changed', () => inv('tasks', 'student', 'employer', 'admin'));
    socket.on('registrations:changed', () => inv('admin'));
    socket.on('audit:new', () => inv('admin'));
    socket.on('account:changed', () => refresh().catch(() => window.dispatchEvent(new CustomEvent('ih:logout'))));
    return () => socket.disconnect();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
