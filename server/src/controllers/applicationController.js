/**
 * controllers/applicationController.js - things BOTH students and employers use: one application's details, and feedback lists.
 * LAYER: CONTROLLER.
 * ROUTES:  GET /api/student|employer/applications/:id     GET /api/student|employer/feedback
 * FRONTEND: features/applications/components/StudentApplicationDetail.jsx, ApplicantDetail.jsx, features/feedback/pages/FeedbackPage.jsx
 */
import { applicationModel } from '../models/applicationModel.js';
import { submissionModel } from '../models/submissionModel.js';
import { feedbackModel } from '../models/feedbackModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';
import { ok } from '../utils/response.js';

export const applicationDetail = asyncHandler(async (req, res) => {
  const a = await applicationModel.byId(req.valid.params.id);
  const mine = a && (a.studentId === req.user.id || a.employerId === req.user.id); // only the two people involved
  if (!mine) throw notFound('Application');
  return ok(res, { ...a, submissions: await submissionModel.forApplication(a.id) });
});

export const myFeedback = asyncHandler(async (req, res) =>
  ok(res, { received: await feedbackModel.listFor(req.user.id, 'received'), given: await feedbackModel.listFor(req.user.id, 'given') }));
