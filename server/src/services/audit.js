/** services/audit.js - append-only audit trail; also pushes the new row live to admins. */
import { run } from '../config/db.js';
import { emitToRole } from '../socket/index.js';

export async function audit(req, action, targetType = null, targetId = null, details = null, conn) {
  const actor = req.user || {};
  await run('INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, details, ip) VALUES (?,?,?,?,?,?,?)',
    [actor.id ?? null, actor.name || 'system', action, targetType, targetId, details ? String(details).slice(0, 1000) : null, req.ip || null], conn);
  emitToRole('admin', 'audit:new', { action });
}
