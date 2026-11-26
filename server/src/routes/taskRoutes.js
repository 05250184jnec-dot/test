/**
 * routes/taskRoutes.js - /api/tasks : read-only task endpoints for signed-in users.
 *  GET /tasks      students browse active tasks   (taskController.browse)      <- Browse.jsx
 *  GET /tasks/:id  one task                        (taskController.detail)      <- Apply.jsx, TaskForm.jsx
 * (Employer create/edit/delete lives in employerRoutes.js, admin delete in adminRoutes.js.)
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { idParams } from '../validators/common.js';
import { taskListQuery } from '../validators/taskValidators.js';
import { browse, detail } from '../controllers/taskController.js';

const r = Router();
r.use(requireAuth);
r.get('/', requireRole('student'), validate({ query: taskListQuery }), browse);
r.get('/:id', validate({ params: idParams }), detail);
export default r;
