/**
 * models/taskModel.js - SQL for the `tasks` table (internship tasks posted by employers).
 *
 * LAYER: MODEL. Parameterized (`?`) + allow-listed ORDER BY.
 * One shared list() builds the WHERE clause; browse / byEmployer / all just pass a different mandatory filter:
 *   browse     -> only active, not-expired tasks (what students see)
 *   byEmployer -> only this employer's tasks
 *   all        -> every task (admin)
 * Used by: taskController, employerTaskController, adminTaskController, studentApplicationController, employerApplicationController
 */
import { q, run, one } from '../config/db.js';
import { like, orderBy } from '../utils/query.js';

const SORTS = { newest: 't.created_at DESC', deadline: 't.deadline ASC', pay_high: 't.pay DESC', pay_low: 't.pay ASC', title: 't.title ASC' };
const COLS = `t.id, t.employer_id, t.title, t.category, t.description, t.duration_days AS durationDays, t.pay, t.positions, t.deadline, t.status, t.created_at AS createdAt, t.updated_at AS updatedAt,
  u.name AS employerName, COALESCE(u.organization, u.name) AS organization,
  (SELECT COUNT(*) FROM applications a WHERE a.task_id = t.id) AS applicationCount`;

async function list(base, params, f) {
  const where = [...base]; const p = [...params];
  if (f.status) { where.push('t.status = ?'); p.push(f.status); }
  if (f.category) { where.push('t.category = ?'); p.push(f.category); }
  if (f.minPay !== undefined) { where.push('t.pay >= ?'); p.push(f.minPay); }
  if (f.maxPay !== undefined) { where.push('t.pay <= ?'); p.push(f.maxPay); }
  if (f.search) { where.push('(t.title LIKE ? OR t.category LIKE ? OR u.organization LIKE ?)'); const l = like(f.search); p.push(l, l, l); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [{ total }] = await q(`SELECT COUNT(*) total FROM tasks t JOIN users u ON u.id=t.employer_id ${w}`, p);
  const items = await q(`SELECT ${COLS} FROM tasks t JOIN users u ON u.id=t.employer_id ${w} ORDER BY ${orderBy(SORTS, f.sort, 'newest')} LIMIT ? OFFSET ?`, [...p, f.limit, f.offset]);
  return { items, total };
}

export const taskModel = {
  browse: (f) => list(["t.status = 'active'", 't.deadline >= UTC_DATE()'], [], f),
  byEmployer: (employerId, f) => list(['t.employer_id = ?'], [employerId], f),
  all: (f) => list([], [], f),
  byId: (id, conn) => one(`SELECT ${COLS} FROM tasks t JOIN users u ON u.id=t.employer_id WHERE t.id=?`, [id], conn),
  lockById: (id, conn) => one('SELECT * FROM tasks WHERE id=? FOR UPDATE', [id], conn),
  async create(employerId, t) {
    const r = await run('INSERT INTO tasks (employer_id,title,category,description,duration_days,pay,positions,deadline,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [employerId, t.title, t.category, t.description, t.durationDays, t.pay, t.positions, t.deadline, t.status]);
    return r.insertId;
  },
  // WHERE employer_id = ? makes ownership part of the SQL itself (can't edit someone else's task).
  update: (id, employerId, t) => run('UPDATE tasks SET title=?,category=?,description=?,duration_days=?,pay=?,positions=?,deadline=?,status=? WHERE id=? AND employer_id=?',
    [t.title, t.category, t.description, t.durationDays, t.pay, t.positions, t.deadline, t.status, id, employerId]),
  remove: (id, conn) => run('DELETE FROM tasks WHERE id=?', [id], conn),
  setStatus: (id, status, conn) => run('UPDATE tasks SET status=? WHERE id=?', [status, id], conn),
  hasLiveWork: (id) => one("SELECT COUNT(*) n FROM applications WHERE task_id=? AND status IN ('accepted','submitted')", [id]),
};
