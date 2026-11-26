/**
 * controllers/taskController.js - STUDENT side of tasks: browse the list and open one task.
 * LAYER: CONTROLLER.
 * ROUTES:  GET /api/tasks   GET /api/tasks/:id        (routes/taskRoutes.js)
 * FRONTEND: features/tasks/pages/Browse.jsx and Apply.jsx (also TaskForm.jsx when an employer edits) -> taskApi.js
 * Students only see ACTIVE tasks; the owner employer and admins can open any status.
 */
import { taskModel } from '../models/taskModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';
import { ok, page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';
import { q, one } from '../config/db.js';

export const browse = asyncHandler(async (req, res) => {
  const f = withPaging(req.valid.query);
  const { items, total } = await taskModel.browse({ ...f, status: undefined });
  // Mark the tasks this student already applied to (so the card shows "Applied").
  const applied = items.length ? await q('SELECT task_id FROM applications WHERE student_id=? AND task_id IN (?)', [req.user.id, items.map((t) => t.id)]) : [];
  const set = new Set(applied.map((a) => a.task_id));
  return page(res, items.map((t) => ({ ...t, hasApplied: set.has(t.id) })), total, f);
});

export const detail = asyncHandler(async (req, res) => {
  const t = await taskModel.byId(req.valid.params.id);
  const visible = t && ((t.status === 'active') || t.employer_id === req.user.id || req.user.role === 'admin');
  if (!visible) throw notFound('Task');
  const a = req.user.role === 'student' ? await one('SELECT id, status FROM applications WHERE task_id=? AND student_id=?', [t.id, req.user.id]) : null;
  return ok(res, { ...t, myApplication: a });
});
