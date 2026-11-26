/**
 * services/notify.js - in-app notification (DB row) + live push to the user's socket room.
 * Never throws: a notification failure must not break the main action.
 */
import { run } from '../config/db.js';
import { emitToUser } from '../socket/index.js';

export async function notify(userId, { type, title, body = '', link = null }) {
  try {
    const r = await run('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?,?,?,?,?)',
      [userId, type, String(title).slice(0, 150), String(body).slice(0, 400), link]);
    emitToUser(userId, 'notification:new', { id: r.insertId, type, title, body, link });
  } catch (e) { console.error('[notify]', e.message); }
}
