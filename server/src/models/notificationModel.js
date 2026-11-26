/**
 * models/notificationModel.js - SQL for the `notifications` table (the bell icon in the top bar).
 *
 * LAYER: MODEL.
 * Rows are created by services/notify.js and read/marked by controllers/notificationController.js.
 */
import { q, run, one } from '../config/db.js';

export const notificationModel = {
  async list(userId, { unread, limit, offset }) {
    const w = unread === '1' ? 'AND is_read=0' : '';
    const [{ total }] = await q(`SELECT COUNT(*) total FROM notifications WHERE user_id=? ${w}`, [userId]);
    const items = await q(`SELECT id, type, title, body, link, is_read AS isRead, created_at AS createdAt FROM notifications WHERE user_id=? ${w} ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit, offset]);
    return { items, total };
  },
  unreadCount: async (userId) => (await one('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0', [userId])).n,
  markRead: (id, userId) => run('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [id, userId]),   // user_id in WHERE: you can't touch someone else's
  markAll: (userId) => run('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0', [userId]),
};
