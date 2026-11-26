/**
 * controllers/auditController.js - ADMIN: read the audit log (who did what, when).
 * LAYER: CONTROLLER.  ROUTE: GET /api/admin/audit     FRONTEND: features/admin/pages/AuditLog.jsx -> adminApi.js
 * Rows are written by services/audit.js whenever an admin approves, rejects, suspends or deletes something.
 */
import { auditModel } from '../models/auditModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';

export const auditLog = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await auditModel.list(q);
  return page(res, r.items, r.total, q);
});
