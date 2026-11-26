/**
 * models/auditModel.js - SQL for reading the `audit_log` table (who did what, when).
 *
 * LAYER: MODEL.
 * Rows are WRITTEN by services/audit.js (append-only). This file only READS them for the admin's Audit Log page.
 */
import { q } from '../config/db.js';
import { like, orderBy } from '../utils/query.js';

const SORTS = { newest: 'id DESC', oldest: 'id ASC' };

export const auditModel = {
  async list({ action, search, sort, limit, offset }) {
    const where = ['1=1']; const p = [];
    if (action) { where.push('action = ?'); p.push(action); }
    if (search) { where.push('(actor_name LIKE ? OR details LIKE ? OR action LIKE ?)'); const l = like(search); p.push(l, l, l); }
    const w = where.join(' AND ');
    const [{ total }] = await q(`SELECT COUNT(*) total FROM audit_log WHERE ${w}`, p);
    const items = await q(`SELECT id, actor_id AS actorId, actor_name AS actorName, action, target_type AS targetType, target_id AS targetId, details, ip, created_at AS createdAt FROM audit_log WHERE ${w} ORDER BY ${orderBy(SORTS, sort, 'newest')} LIMIT ? OFFSET ?`, [...p, limit, offset]);
    return { items, total };
  },
};
