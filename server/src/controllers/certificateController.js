/**
 * controllers/certificateController.js - CERTIFICATES: student's list, PDF download, and PUBLIC verification.
 * LAYER: CONTROLLER.
 * ROUTES:  GET /api/student/certificates   GET /api/certificates/:id/download   GET /api/certificates/verify/:certCode (public)
 * FRONTEND: features/certificates/pages/Certificates.jsx and VerifyCertificate.jsx -> certificateApi.js
 */
import { certificateModel } from '../models/certificateModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { streamCertificate } from '../services/certificate.js';

export const studentCertificates = asyncHandler(async (req, res) => ok(res, await certificateModel.forStudent(req.user.id)));

/** Only the owning student, the issuing employer, or an admin may download. */
export const download = asyncHandler(async (req, res) => {
  const c = await certificateModel.byId(req.valid.params.id);
  const allowed = c && (c.student_id === req.user.id || c.employer_id === req.user.id || req.user.role === 'admin');
  if (!allowed) throw notFound('Certificate');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="InternHive-${c.cert_code}.pdf"`);
  streamCertificate(res, c);
});

/** Public: anyone with the certificate ID can verify it (no login). */
export const verify = asyncHandler(async (req, res) => {
  const c = await certificateModel.byCode(req.valid.params.certCode);
  if (!c) return ok(res, { valid: false });
  return ok(res, { valid: true, certCode: c.cert_code, studentName: c.student_name, taskTitle: c.task_title, organization: c.organization, startDate: c.start_date, endDate: c.end_date, rating: c.rating, issuedAt: c.issued_at });
});
