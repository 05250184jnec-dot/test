/**
 * routes/adminRoutes.js - /api/admin/* : only the ADMIN ("User Manager"). Admins are never self-registered (see server.js).
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { idParams } from '../validators/common.js';
import { taskListQuery } from '../validators/taskValidators.js';
import { userDecisionBody, suspendBody, registrationsQuery, usersQuery, auditQuery } from '../validators/adminValidators.js';
import { adminDashboard } from '../controllers/dashboardController.js';
import { registrations, users, decideUser, suspendUser } from '../controllers/adminUserController.js';
import { listTasks, deleteTask } from '../controllers/adminTaskController.js';
import { auditLog } from '../controllers/auditController.js';

const r = Router();
r.use(requireAuth, requireRole('admin'));
r.get('/dashboard', adminDashboard);
r.get('/registrations', validate({ query: registrationsQuery }), registrations);
r.get('/users', validate({ query: usersQuery }), users);
r.post('/users/:id/decision', writeLimiter, validate({ params: idParams, body: userDecisionBody }), decideUser);
r.post('/users/:id/suspend', writeLimiter, validate({ params: idParams, body: suspendBody }), suspendUser);
r.get('/tasks', validate({ query: taskListQuery }), listTasks);
r.delete('/tasks/:id', writeLimiter, validate({ params: idParams }), deleteTask);
r.get('/audit', validate({ query: auditQuery }), auditLog);
export default r;
