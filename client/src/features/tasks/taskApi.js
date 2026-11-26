/**
 * taskApi.js - HTTP calls for tasks: browsing (student), posting/editing (employer), moderating (admin).
 * FRONTEND: API layer of the "tasks" feature.
 * TALKS TO (backend): /api/tasks, /api/employer/tasks, /api/admin/tasks -> routes/taskRoutes.js, employerRoutes.js, adminRoutes.js
 *   -> taskController.js, employerTaskController.js, adminTaskController.js -> models/taskModel.js
 * HOW IT WORKS: list functions take a `params` object (page, search, sort, filters) that becomes the query string.
 */
import { api } from '../../shared/api/apiClient.js';

/** GET /api/tasks -> taskController.browse (student: active tasks) */
export const browseTasks = (params) => api('/tasks', { params });
/** GET /api/tasks/:id -> taskController.detail */
export const getTask = (id) => api(`/tasks/${id}`);
/** GET /api/employer/tasks -> employerTaskController.myTasks */
export const myTasks = (params) => api('/employer/tasks', { params });
/** POST /api/employer/tasks -> employerTaskController.create */
export const createTask = (body) => api('/employer/tasks', { method: 'POST', body });
/** PUT /api/employer/tasks/:id -> employerTaskController.update */
export const updateTask = (id, body) => api(`/employer/tasks/${id}`, { method: 'PUT', body });
/** DELETE /api/employer/tasks/:id -> employerTaskController.remove */
export const deleteTask = (id) => api(`/employer/tasks/${id}`, { method: 'DELETE' });
/** GET /api/admin/tasks -> adminTaskController.adminList */
export const adminTasks = (params) => api('/admin/tasks', { params });
/** DELETE /api/admin/tasks/:id -> adminTaskController.adminRemove */
export const adminDeleteTask = (id) => api(`/admin/tasks/${id}`, { method: 'DELETE' });
