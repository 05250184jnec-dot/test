/**
 * routes/employerRoutes.js - /api/employer/* : everything only an EMPLOYER may do (own data only).
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { idParams } from '../validators/common.js';
import { taskBody, taskListQuery } from '../validators/taskValidators.js';
import { decisionBody, reviewBody, applicationListQuery } from '../validators/applicationValidators.js';
import { employerDashboard } from '../controllers/dashboardController.js';
import { myTasks, createTask, updateTask, deleteTask } from '../controllers/employerTaskController.js';
import { listApplications, decide, reviewQueue, reviewWork } from '../controllers/employerApplicationController.js';
import { applicationDetail, myFeedback } from '../controllers/applicationController.js';

const r = Router();
r.use(requireAuth, requireRole('employer'));
r.get('/dashboard', employerDashboard);
r.get('/tasks', validate({ query: taskListQuery }), myTasks);
r.post('/tasks', writeLimiter, validate({ body: taskBody }), createTask);
r.put('/tasks/:id', writeLimiter, validate({ params: idParams, body: taskBody }), updateTask);
r.delete('/tasks/:id', writeLimiter, validate({ params: idParams }), deleteTask);
r.get('/applications', validate({ query: applicationListQuery }), listApplications);
r.get('/applications/:id', validate({ params: idParams }), applicationDetail);
r.post('/applications/:id/decision', writeLimiter, validate({ params: idParams, body: decisionBody }), decide);
r.get('/review', validate({ query: applicationListQuery }), reviewQueue);
r.post('/applications/:id/review', writeLimiter, validate({ params: idParams, body: reviewBody }), reviewWork);
r.get('/feedback', myFeedback);
export default r;
