/**
 * controllers/notificationController.js - the NOTIFICATION BELL: list, mark one read, mark all read.
 * LAYER: CONTROLLER.
 * ROUTES:  GET /api/notifications   POST /api/notifications/:id/read   POST /api/notifications/read-all
 * FRONTEND: features/notifications/components/NotificationBell.jsx -> notificationApi.js
 */
import { notificationModel } from '../models/notificationModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { withPaging } from '../utils/query.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const q = withPaging(req.valid.query);
  const r = await notificationModel.list(req.user.id, q);
  return ok(res, { items: r.items, total: r.total, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(r.total / q.pageSize)), unread: await notificationModel.unreadCount(req.user.id) });
});
export const readOne = asyncHandler(async (req, res) => { await notificationModel.markRead(req.valid.params.id, req.user.id); return ok(res, { unread: await notificationModel.unreadCount(req.user.id) }); });
export const readAll = asyncHandler(async (req, res) => { await notificationModel.markAll(req.user.id); return ok(res, { unread: 0 }); });
