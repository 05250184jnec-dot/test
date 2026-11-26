/**
 * controllers/studentApplicationController.js - STUDENT actions on applications:
 *   list my applications, APPLY to a task, SUBMIT work, RATE the employer.
 * LAYER: CONTROLLER.
 * ROUTES (routes/studentRoutes.js):
 *   GET  /api/student/applications            POST /api/student/tasks/:id/apply
 *   POST /api/student/applications/:id/submit POST /api/student/applications/:id/feedback
 * FRONTEND: features/applications/pages/StudentApplications.jsx, tasks/pages/Apply.jsx -> applicationApi.js
 * Notifications and e-mails are sent AFTER the transaction commits, so a rollback never sends a false message.
 */
import { applicationModel } from '../models/applicationModel.js';
import { submissionModel } from '../models/submissionModel.js';
import { feedbackModel } from '../models/feedbackModel.js';
import { taskModel } from '../models/taskModel.js';
import { userModel } from '../models/userModel.js';
import { withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { ok, page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';
import { queueMail } from '../services/mailer.js';
import { notify } from '../services/notify.js';
import { pingApplications } from '../socket/index.js';

export const listApplications = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await applicationModel.forStudent(req.user.id, q);
  return page(res, r.items, r.total, q);
});

export const apply = asyncHandler(async (req, res) => {
  const taskId = req.valid.params.id; const body = req.valid.body;
  const task = await taskModel.byId(taskId);
  if (!task || task.status !== 'active') throw notFound('Task');
  if (task.deadline < new Date().toISOString().slice(0, 10)) throw new HttpError(409, 'DEADLINE_PASSED', 'The deadline for this task has passed.');
  let id;
  try { id = await applicationModel.create(taskId, req.user.id, body); } // UNIQUE(task_id, student_id) in the DB blocks duplicates, even in a race
  catch (e) { if (e.errno === 1062) throw new HttpError(409, 'ALREADY_APPLIED', 'You already applied for this task.'); throw e; }
  const employer = await userModel.findPublicById(task.employer_id);
  notify(employer.id, { type: 'application', title: 'New application', body: `${req.user.name} applied for "${task.title}"`, link: '/employer/applications' });
  queueMail(employer.email, 'applicationReceived', { employer: employer.name, student: req.user.name, task: task.title });
  pingApplications(employer.id, req.user.id);
  return ok(res, { id }, 'Application sent', 201);
});

export const submitWork = asyncHandler(async (req, res) => {
  const info = await withTransaction(async (conn) => {
    const a = await applicationModel.lockWithTask(req.valid.params.id, conn);
    if (!a || a.student_id !== req.user.id) throw notFound('Application');
    if (a.status !== 'accepted') throw new HttpError(409, 'NOT_ACCEPTED', 'You can submit work only after you are accepted.');
    await submissionModel.add(a.id, req.valid.body, conn);
    await applicationModel.setSubmitted(a.id, conn);
    if (a.task_status === 'active') await taskModel.setStatus(a.task_id, 'pending_review', conn);
    return a;
  });
  const employer = await userModel.findPublicById(info.employer_id);
  notify(employer.id, { type: 'submission', title: 'Work submitted', body: `${req.user.name} submitted "${info.task_title}"`, link: '/employer/review' });
  queueMail(employer.email, 'workSubmitted', { employer: employer.name, student: req.user.name, task: info.task_title });
  pingApplications(employer.id, req.user.id);
  return ok(res, null, 'Work submitted for review', 201);
});

export const rateEmployer = asyncHandler(async (req, res) => {
  const a = await applicationModel.byId(req.valid.params.id);
  if (!a || a.studentId !== req.user.id) throw notFound('Application');
  if (a.status !== 'completed') throw new HttpError(409, 'NOT_COMPLETED', 'You can review the employer after the task is completed.');
  try { await feedbackModel.add(a.id, req.user.id, a.employerId, 'student_to_employer', req.valid.body.rating, req.valid.body.comment); }
  catch (e) { if (e.errno === 1062) throw new HttpError(409, 'ALREADY_REVIEWED', 'You already left feedback.'); throw e; }
  notify(a.employerId, { type: 'feedback', title: 'New feedback received', body: `${req.user.name} rated you ${req.valid.body.rating}/5`, link: '/employer/feedback' });
  pingApplications(a.employerId, req.user.id);
  return ok(res, null, 'Thanks for your feedback', 201);
});
