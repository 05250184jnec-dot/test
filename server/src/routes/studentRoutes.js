/**
 * routes/studentRoutes.js - /api/student/* : everything only a STUDENT may do.
 * r.use(requireAuth, requireRole('student')) guards the whole file: other roles get 403.
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { idParams } from '../validators/common.js';
import { applyBody, submitWorkBody, feedbackBody, applicationListQuery } from '../validators/applicationValidators.js';
import { studentDashboard } from '../controllers/dashboardController.js';
import { listApplications, apply, submitWork, rateEmployer } from '../controllers/studentApplicationController.js';
import { applicationDetail, myFeedback } from '../controllers/applicationController.js';
import { studentCertificates } from '../controllers/certificateController.js';

const r = Router();
r.use(requireAuth, requireRole('student'));
r.get('/dashboard', studentDashboard);
r.get('/applications', validate({ query: applicationListQuery }), listApplications);
r.get('/applications/:id', validate({ params: idParams }), applicationDetail);
r.post('/tasks/:id/apply', writeLimiter, validate({ params: idParams, body: applyBody }), apply);
r.post('/applications/:id/submit', writeLimiter, validate({ params: idParams, body: submitWorkBody }), submitWork);
r.post('/applications/:id/feedback', writeLimiter, validate({ params: idParams, body: feedbackBody }), rateEmployer);
r.get('/feedback', myFeedback);
r.get('/certificates', studentCertificates);
export default r;
