/**
 * models/userModel.js - ALL SQL for the `users` table (students, employers, admins).
 *
 * LAYER: MODEL. A model is the only place that talks to MySQL. It knows nothing about
 * HTTP (no req / res). Controllers call these functions and get plain JS objects back.
 *
 * Every value goes in as a `?` placeholder (never glued into the SQL string) so SQL
 * injection is impossible. See config/db.js for the explanation.
 *
 * Used by: registerController, loginController, verifyEmailController, passwordController,
 *          profileController, adminUserController, middleware/auth.js, server.js (admin seed)
 */
import { q, run, one } from '../config/db.js';
import { like, orderBy } from '../utils/query.js';

// Columns that are safe to send to the browser. NOTE: password_hash is NOT in this list.
const PUBLIC = 'id, role, name, email, organization, college, phone, bio, status, rejection_reason, suspended, suspended_reason, email_verified_at, last_login_at, created_at';
// Allow-list for ORDER BY: the browser sends a KEY ("newest"), we map it to fixed SQL.
const SORTS = { newest: 'created_at DESC', oldest: 'created_at ASC', name: 'name ASC', role: 'role ASC, name ASC' };

export const userModel = {
  /* ---------- single-user lookups ---------- */
  findByEmail: (email, conn) => one('SELECT * FROM users WHERE email = ?', [email], conn),     // includes password_hash (login only)
  findAuthById: (id, conn) => one('SELECT * FROM users WHERE id = ?', [id], conn),
  findPublicById: (id, conn) => one(`SELECT ${PUBLIC} FROM users WHERE id = ?`, [id], conn),   // safe to return to the browser
  lockById: (id, conn) => one('SELECT * FROM users WHERE id = ? FOR UPDATE', [id], conn),      // FOR UPDATE = row lock inside a transaction

  /* ---------- create / update ---------- */
  async create(u, conn) {
    const r = await run('INSERT INTO users (role, name, email, password_hash, organization, college, status) VALUES (?,?,?,?,?,?,?)',
      [u.role, u.name, u.email, u.passwordHash, u.organization ?? null, u.college ?? null, u.status ?? 'pending_verification'], conn);
    return r.insertId; // the new row's id
  },
  markVerified: (id, conn) => run("UPDATE users SET status='pending_approval', email_verified_at=UTC_TIMESTAMP() WHERE id=? AND status='pending_verification'", [id], conn),
  setDecision: (id, status, reason, conn) => run('UPDATE users SET status=?, rejection_reason=? WHERE id=?', [status, reason ?? null, id], conn),
  setSuspended: (id, suspended, reason, conn) => run('UPDATE users SET suspended=?, suspended_reason=? WHERE id=?', [suspended ? 1 : 0, suspended ? reason ?? null : null, id], conn),
  touchLogin: (id) => run('UPDATE users SET last_login_at=UTC_TIMESTAMP() WHERE id=?', [id]),
  updatePassword: (id, hash, conn) => run('UPDATE users SET password_hash=? WHERE id=?', [hash, id], conn),
  // Only these columns can ever be changed through the profile endpoint (allow-list).
  updateProfile: (id, p, role) => run(
    `UPDATE users SET name=?, phone=?, bio=?, ${role === 'student' ? 'college' : 'organization'}=? WHERE id=?`,
    [p.name, p.phone, p.bio, role === 'student' ? p.college : p.organization, id]),

  /* ---------- admin lists ---------- */
  async list({ search, role, statuses, status, suspended, sort, limit, offset }) {
    const where = ["role <> 'admin'"]; const params = [];     // admins never appear in the lists
    if (role) { where.push('role = ?'); params.push(role); }
    if (statuses) { where.push('status IN (?)'); params.push(statuses); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (suspended !== undefined) { where.push('suspended = ?'); params.push(Number(suspended)); }
    if (search) { where.push('(name LIKE ? OR email LIKE ? OR organization LIKE ? OR college LIKE ?)'); const l = like(search); params.push(l, l, l, l); }
    const w = where.join(' AND ');
    const [{ total }] = await q(`SELECT COUNT(*) total FROM users WHERE ${w}`, params);
    const items = await q(`SELECT ${PUBLIC} FROM users WHERE ${w} ORDER BY ${orderBy(SORTS, sort, 'newest')} LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { items, total };
  },
  async tabCounts() {
    const [r] = await q("SELECT CAST(COALESCE(SUM(status='pending_approval'),0) AS SIGNED) pending, CAST(COALESCE(SUM(status='approved'),0) AS SIGNED) approved, CAST(COALESCE(SUM(status='rejected'),0) AS SIGNED) rejected FROM users WHERE role<>'admin'");
    return r;
  },
  adminIds: () => q("SELECT id FROM users WHERE role='admin' AND status='approved'"),
  countAdmins: () => one("SELECT COUNT(*) n FROM users WHERE role='admin'"),
};
