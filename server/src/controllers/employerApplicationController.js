/**
 * controllers/employerApplicationController.js - EMPLOYER actions on applications:
 *   list applicants, ACCEPT/REJECT, see the review queue, REVIEW submitted work (complete + certificate, or request changes).
 * LAYER: CONTROLLER.
 * ROUTES (routes/employerRoutes.js):
 *   GET /api/employer/applications   POST /api/employer/applications/:id/decision
 *   GET /api/employer/review         POST /api/employer/applications/:id/review
 * FRONTEND: features/applications/pages/EmployerApplications.jsx, ReviewWork.jsx -> applicationApi.js
 * reviewWork is the biggest transaction: submission + application + feedback + certificate + task status change ALL or NOTHING.
 */
import { applicationModel } from '../models/applicationModel.js';
import { submissionModel } from '../models/submissionModel.js';
import { feedbackModel } from '../models/feedbackModel.js';
import { certificateModel } from '../models/certificateModel.js';
import { taskModel } from '../models/taskModel.js';
import { userModel } from '../models/userModel.js';
import { withTransaction, one } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { ok, page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';
import { certCode } from '../utils/crypto.js';
import { queueMail } from '../services/mailer.js';
import { notify } from '../services/notify.js';
import { pingApplications, emitToRole } from '../socket/index.js';

export const listApplications = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await applicationModel.forEmployer(req.user.id, q);
  return page(res, r.items, r.total, q);
});

export const reviewQueue = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await applicationModel.forEmployer(req.user.id, { ...q, statuses: ['submitted'], status: undefined });
  return page(res, r.items, r.total, q);
});

export const decide = asyncHandler(async (req, res) => {
  const accepted = req.valid.body.decision === 'accepted';
  const info = await withTransaction(async (conn) => {
    const a = await applicationModel.lockWithTask(req.valid.params.id, conn);
    if (!a || a.employer_id !== req.user.id) throw notFound('Application');
    if (a.status !== 'applied') throw new HttpError(409, 'ALREADY_DECIDED', 'This application was already decided.');
    if (['draft', 'completed'].includes(a.task_status)) throw new HttpError(409, 'TASK_CLOSED', 'This task is not open.');
    if (accepted && (await applicationModel.acceptedCount(a.task_id, conn)).n >= a.positions) throw new HttpError(409, 'POSITIONS_FILLED', 'All positions for this task are filled.');
    await applicationModel.decide(a.id, accepted, conn);
    return a;
  });
  const student = await userModel.findPublicById(info.student_id);
  const org = await userModel.findPublicById(req.user.id);
  notify(student.id, { type: 'application', title: accepted ? 'Application accepted!' : 'Application not selected', body: `"${info.task_title}"`, link: '/student/applications' });
  queueMail(student.email, 'applicationDecision', { student: student.name, task: info.task_title, accepted, organization: org.organization || org.name });
  pingApplications(student.id, req.user.id);
  return ok(res, null, accepted ? 'Application accepted' : 'Application rejected');
});

export const reviewWork = asyncHandler(async (req, res) => {
  const { decision, rating, comment, note } = req.valid.body;
  const out = await withTransaction(async (conn) => {
    const a = await applicationModel.lockWithTask(req.valid.params.id, conn);
    if (!a || a.employer_id !== req.user.id) throw notFound('Application');
    if (a.status !== 'submitted') throw new HttpError(409, 'NOT_SUBMITTED', 'There is no submitted work to review.');
    const sub = await submissionModel.latest(a.id, conn);
    const student = await userModel.findPublicById(a.student_id, conn);
    if (decision === 'revision') {
      await submissionModel.review(sub.id, 'revision_requested', note, conn);
      await applicationModel.setStatus(a.id, 'accepted', conn);
      if ((await applicationModel.countByStatus(a.task_id, 'submitted', conn)).n === 0 && a.task_status === 'pending_review') await taskModel.setStatus(a.task_id, 'active', conn);
      return { a, student, revision: true };
    }
    // ---- complete: submission + application + feedback + certificate + task status, ALL or nothing ----
    await submissionModel.review(sub.id, 'approved', null, conn);
    await applicationModel.setCompleted(a.id, conn);
    await feedbackModel.add(a.id, req.user.id, a.student_id, 'employer_to_student', rating, comment, conn);
    const employer = await userModel.findPublicById(req.user.id, conn);
    const accepted = await one('SELECT DATE(accepted_at) d FROM applications WHERE id=?', [a.id], conn);
    const today = new Date().toISOString().slice(0, 10);
    let code;
    for (let i = 0; i < 3; i++) { // retry if the random code collides (UNIQUE key)
      code = certCode();
      try {
        await certificateModel.create({ code, applicationId: a.id, studentId: a.student_id, employerId: req.user.id, taskId: a.task_id, studentName: student.name, taskTitle: a.task_title,
          organization: employer.organization || employer.name, startDate: accepted?.d ? new Date(accepted.d).toISOString().slice(0, 10) : today, endDate: today, rating }, conn);
        break;
      } catch (e) { if (e.errno !== 1062 || i === 2) throw e; }
    }
    const done = (await applicationModel.countByStatus(a.task_id, 'completed', conn)).n;
    const waiting = (await applicationModel.countByStatus(a.task_id, 'submitted', conn)).n;
    await taskModel.setStatus(a.task_id, done >= a.positions ? 'completed' : waiting ? 'pending_review' : 'active', conn);
    return { a, student, code };
  });
  const { a, student } = out;
  if (out.revision) {
    notify(student.id, { type: 'submission', title: 'Changes requested', body: `"${a.task_title}"`, link: '/student/applications' });
    queueMail(student.email, 'revisionRequested', { student: student.name, task: a.task_title, note });
  } else {
    notify(student.id, { type: 'certificate', title: 'Certificate ready 🎓', body: `You completed "${a.task_title}"`, link: '/student/certificates' });
    queueMail(student.email, 'certificateReady', { student: student.name, task: a.task_title, certCode: out.code });
  }
  pingApplications(student.id, req.user.id);
  emitToRole('student', 'tasks:changed');
  return ok(res, { certCode: out.code ?? null }, out.revision ? 'Changes requested' : 'Marked completed. Certificate issued.');
});
