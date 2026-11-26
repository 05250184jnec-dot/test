
import { api } from '../../shared/api/apiClient.js';

/** GET /api/notifications -> notificationController.listNotifications */
export const listNotifications = (params) => api('/notifications', { params });
/** POST /api/notifications/:id/read -> notificationController.readOne */
export const markRead = (id) => api(`/notifications/${id}/read`, { method: 'POST' });
/** POST /api/notifications/read-all -> notificationController.readAll */
export const markAllRead = () => api('/notifications/read-all', { method: 'POST' });
