
import { api } from '../../shared/api/apiClient.js';

/** GET /api/admin/registrations -> adminUserController.registrations */
export const registrations = (params) => api('/admin/registrations', { params });
/** GET /api/admin/users -> adminUserController.users */
export const users = (params) => api('/admin/users', { params });
/** POST /api/admin/users/:id/decision -> adminUserController.decideUser ('approve' | 'reject' + reason) */
export const decideUser = (id, body) => api(`/admin/users/${id}/decision`, { method: 'POST', body });
/** POST /api/admin/users/:id/suspend -> adminUserController.suspend */
export const suspendUser = (id, body) => api(`/admin/users/${id}/suspend`, { method: 'POST', body });
/** GET /api/admin/audit -> auditController.auditLog */
export const auditLog = (params) => api('/admin/audit', { params });
