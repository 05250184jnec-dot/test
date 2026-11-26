/**
 * controllers/adminUserController.js - ADMIN "User Manager": registration approvals, user list, suspend/reactivate.
 * LAYER: CONTROLLER.
 * ROUTES (routes/adminRoutes.js):
 *   GET /api/admin/registrations   GET /api/admin/users
 *   POST /api/admin/users/:id/decision   POST /api/admin/users/:id/suspend
 * FRONTEND: features/admin/pages/Registrations.jsx, Users.jsx, components/DecisionModal.jsx -> adminApi.js
 */
import { userModel } from '../models/userModel.js';
import { withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { ok, page } from '../utils/response.js';
import { withPaging } from '../utils/query.js';
import { audit } from '../services/audit.js';
import { queueMail } from '../services/mailer.js';
import { notify } from '../services/notify.js';
import { emitToRole, emitToUser } from '../socket/index.js';

const TAB = { pending: ['pending_approval'], approved: ['approved'], rejected: ['rejected'] };

export const registrations = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await userModel.list({ ...q, statuses: TAB[q.tab] });
  return ok(res, { items: r.items, total: r.total, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(r.total / q.pageSize)), counts: await userModel.tabCounts() });
});

export const users = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await userModel.list(q);
  return page(res, r.items, r.total, q);
});

export const decideUser = asyncHandler(async (req, res) => {
  const { decision, reason } = req.valid.body;
  const user = await withTransaction(async (conn) => {
    const u = await userModel.lockById(req.valid.params.id, conn); // lock: two admins deciding at once can't both win
    if (!u || u.role === 'admin') throw notFound('User');
    const allowed = decision === 'approve' ? ['pending_approval', 'rejected'] : ['pending_approval'];
    if (!allowed.includes(u.status)) throw new HttpError(409, 'ALREADY_DECIDED', 'This registration was already decided by another admin.');
    await userModel.setDecision(u.id, decision === 'approve' ? 'approved' : 'rejected', decision === 'reject' ? reason : null, conn);
    await audit(req, `user.${decision}`, 'user', u.id, `${u.name} <${u.email}>${reason ? ` - ${reason}` : ''}`, conn);
    return u;
  });
  queueMail(user.email, decision === 'approve' ? 'approved' : 'rejected', { name: user.name, reason });
  emitToRole('admin', 'registrations:changed');
  emitToUser(user.id, 'account:changed');
  return ok(res, null, decision === 'approve' ? 'User approved' : 'User rejected');
});

export const suspendUser = asyncHandler(async (req, res) => {
  const u = await userModel.findPublicById(req.valid.params.id);
  if (!u || u.role === 'admin') throw notFound('User');
  const { suspended, reason } = req.valid.body;
  await userModel.setSuspended(u.id, suspended, reason);
  await audit(req, suspended ? 'user.suspend' : 'user.reactivate', 'user', u.id, `${u.name}${reason ? ` - ${reason}` : ''}`);
  if (suspended) notify(u.id, { type: 'account', title: 'Account suspended', body: reason || '' });
  emitToUser(u.id, 'account:changed'); emitToRole('admin', 'registrations:changed');
  return ok(res, null, suspended ? 'User suspended' : 'User reactivated');
});
