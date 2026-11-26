/**
 * controllers/adminTaskController.js - ADMIN: list every task and delete inappropriate ones (audited).
 * LAYER: CONTROLLER.
 * ROUTES:  GET /api/admin/tasks   DELETE /api/admin/tasks/:id        (routes/adminRoutes.js)
 * FRONTEND: features/tasks/pages/AdminTasks.jsx -> taskApi.js
 */
import { taskModel } from '../models/taskModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';
import { ok, page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';
import { audit } from '../services/audit.js';
import { emitToRole } from '../socket/index.js';

export const listTasks = asyncHandler(async (req, res) => {
  const f = withPaging(req.valid.query);
  const { items, total } = await taskModel.all(f);
  return page(res, items, total, f);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const t = await taskModel.byId(req.valid.params.id);
  if (!t) throw notFound('Task');
  await taskModel.remove(t.id);
  await audit(req, 'task.delete', 'task', t.id, `Deleted "${t.title}" by ${t.organization}`); // who deleted what, kept forever
  emitToRole('student', 'tasks:changed', { id: t.id });
  return ok(res, null, 'Task deleted');
});
