/**
 * models/applicationModel.js - SQL for the `applications` table (a student applying to a task).
 *
 * LAYER: MODEL.
 * Status life-cycle of one application:  applied -> accepted -> submitted -> completed   (or: applied -> rejected)
 * Related tables have their own model files: submissionModel, feedbackModel, certificateModel.
 * Used by: studentApplicationController, employerApplicationController, applicationController
 */
import { q, run, one } from '../config/db.js';
import { like, orderBy } from '../utils/query.js';

const SORTS = { newest: 'a.applied_at DESC', oldest: 'a.applied_at ASC', status: 'a.status ASC, a.applied_at DESC' };
// `AS camelCase` renames SQL columns (snake_case) to what the React code expects.
const COLS = `a.id, a.task_id AS taskId, a.student_id AS studentId, a.cover_letter AS coverLetter, a.available_from AS availableFrom, a.status,
  a.applied_at AS appliedAt, a.decided_at AS decidedAt, a.accepted_at AS acceptedAt, a.submitted_at AS submittedAt, a.completed_at AS completedAt,
  t.title AS taskTitle, t.category, t.pay, t.deadline, t.status AS taskStatus, t.employer_id AS employerId,
  COALESCE(e.organization, e.name) AS organization, s.name AS studentName, s.email AS studentEmail, s.college AS studentCollege,
  (SELECT c.id FROM certificates c WHERE c.application_id=a.id) AS certificateId,
  (SELECT COUNT(*) FROM feedback f WHERE f.application_id=a.id AND f.direction='student_to_employer') AS studentFeedbackGiven`;
// JOIN = combine rows from several tables: application + its task + the employer (e) + the student (s).
const FROM = 'FROM applications a JOIN tasks t ON t.id=a.task_id JOIN users e ON e.id=t.employer_id JOIN users s ON s.id=a.student_id';

/** Shared list query: `base` is the mandatory ownership filter (student_id = ? OR employer_id = ?), the rest are optional filters. */
async function list(base, params, f) {
  const where = [...base]; const p = [...params];
  if (f.status) { where.push('a.status = ?'); p.push(f.status); }
  if (f.statuses) { where.push('a.status IN (?)'); p.push(f.statuses); }
  if (f.taskId) { where.push('a.task_id = ?'); p.push(f.taskId); }
  if (f.scope === 'history') where.push("a.status IN ('completed','rejected')");
  if (f.scope === 'active') where.push("a.status IN ('applied','accepted','submitted')");
  if (f.search) { where.push('(t.title LIKE ? OR s.name LIKE ? OR e.organization LIKE ?)'); const l = like(f.search); p.push(l, l, l); }
  const w = `WHERE ${where.join(' AND ')}`;
  const [{ total }] = await q(`SELECT COUNT(*) total ${FROM} ${w}`, p);
  const items = await q(`SELECT ${COLS} ${FROM} ${w} ORDER BY ${orderBy(SORTS, f.sort, 'newest')} LIMIT ? OFFSET ?`, [...p, f.limit, f.offset]);
  return { items, total };
}

export const applicationModel = {
  forStudent: (studentId, f) => list(['a.student_id = ?'], [studentId], f),   // student_id comes from the JWT, never from the browser
  forEmployer: (employerId, f) => list(['t.employer_id = ?'], [employerId], f),
  byId: (id) => one(`SELECT ${COLS} ${FROM} WHERE a.id=?`, [id]),
  // Lock application + its task row so two people changing the same application at once are handled one after the other.
  lockWithTask: (id, conn) => one('SELECT a.*, t.employer_id, t.title AS task_title, t.positions, t.status AS task_status, t.deadline FROM applications a JOIN tasks t ON t.id=a.task_id WHERE a.id=? FOR UPDATE', [id], conn),
  create: async (taskId, studentId, a, conn) => (await run('INSERT INTO applications (task_id, student_id, cover_letter, available_from) VALUES (?,?,?,?)', [taskId, studentId, a.coverLetter, a.availableFrom], conn)).insertId,
  acceptedCount: (taskId, conn) => one("SELECT COUNT(*) n FROM applications WHERE task_id=? AND accepted_at IS NOT NULL", [taskId], conn),
  decide: (id, accepted, conn) => run(`UPDATE applications SET status=?, decided_at=UTC_TIMESTAMP(), accepted_at=${accepted ? 'UTC_TIMESTAMP()' : 'NULL'} WHERE id=?`, [accepted ? 'accepted' : 'rejected', id], conn),
  setSubmitted: (id, conn) => run("UPDATE applications SET status='submitted', submitted_at=UTC_TIMESTAMP() WHERE id=?", [id], conn),
  setStatus: (id, status, conn) => run('UPDATE applications SET status=? WHERE id=?', [status, id], conn),
  setCompleted: (id, conn) => run("UPDATE applications SET status='completed', completed_at=UTC_TIMESTAMP() WHERE id=?", [id], conn),
  countByStatus: (taskId, status, conn) => one('SELECT COUNT(*) n FROM applications WHERE task_id=? AND status=?', [taskId, status], conn),
};
