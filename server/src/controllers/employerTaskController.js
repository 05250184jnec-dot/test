/**
 * controllers/employerTaskController.js - EMPLOYER task CRUD (Create, Read, Update, Delete) - own tasks only.
 * LAYER: CONTROLLER.
 * ROUTES:  GET/POST /api/employer/tasks   PUT/DELETE /api/employer/tasks/:id     (routes/employerRoutes.js)
 * FRONTEND: features/tasks/pages/MyTasks.jsx and TaskForm.jsx -> taskApi.js
 * OWNERSHIP: employer_id comes from the JWT and is part of the SQL WHERE, so nobody can edit another employer's task.
 */
import { taskModel } from '../models/taskModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { ok, page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';
import { emitToRole } from '../socket/index.js';

export const myTasks = asyncHandler(async (req, res) => {
  const f = withPaging(req.valid.query);
  const { items, total } = await taskModel.byEmployer(req.user.id, f);
  return page(res, items, total, f);
});

export const createTask = asyncHandler(async (req, res) => {
  const id = await taskModel.create(req.user.id, req.valid.body);
  if (req.valid.body.status === 'active') emitToRole('student', 'tasks:changed', { id }); // live update for students
  emitToRole('admin', 'tasks:changed', { id });
  return ok(res, await taskModel.byId(id), 'Task saved', 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  const r = await taskModel.update(req.valid.params.id, req.user.id, req.valid.body);
  if (!r.affectedRows) throw notFound('Task'); // 404 (not 403) hides other employers' task ids
  emitToRole('student', 'tasks:changed', { id: req.valid.params.id });
  return ok(res, await taskModel.byId(req.valid.params.id), 'Task updated');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const t = await taskModel.byId(req.valid.params.id);
  if (!t || t.employer_id !== req.user.id) throw notFound('Task');
  if ((await taskModel.hasLiveWork(t.id)).n > 0) throw new HttpError(409, 'HAS_LIVE_WORK', 'Students are working on this task. Complete or review their work first.');
  await taskModel.remove(t.id);
  emitToRole('student', 'tasks:changed', { id: t.id });
  return ok(res, null, 'Task deleted');
});
