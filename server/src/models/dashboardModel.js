/**
 * models/dashboardModel.js - SQL aggregates (COUNT / GROUP BY / JOIN) per role.
 * Every student/employer query is filtered by the authenticated user's id (from the JWT).
 */
import { q, one } from '../config/db.js';
import { fillDays } from '../utils/query.js';

const n = (v) => Number(v || 0);

export const dashboardModel = {
  async student(id) {
    const stats = await one(`SELECT COUNT(*) applications,
      CAST(COALESCE(SUM(accepted_at IS NOT NULL),0) AS SIGNED) accepted,
      CAST(COALESCE(SUM(status='submitted'),0) AS SIGNED) submitted,
      CAST(COALESCE(SUM(status='completed'),0) AS SIGNED) completed,
      CAST(COALESCE(SUM(status='applied'),0) AS SIGNED) pending
      FROM applications WHERE student_id=?`, [id]);
    const certs = await one('SELECT COUNT(*) n FROM certificates WHERE student_id=?', [id]);
    const rating = await one("SELECT ROUND(AVG(rating),2) avg FROM feedback WHERE to_user_id=? AND direction='employer_to_student'", [id]);
    // Recommended: active tasks in categories the student applied to before (most-applied first), not yet applied. Fallback: newest.
    const recommended = await q(
      `SELECT t.id, t.title, t.category, t.pay, t.deadline, COALESCE(u.organization,u.name) AS organization,
        (SELECT COUNT(*) FROM applications a2 JOIN tasks t2 ON t2.id=a2.task_id WHERE a2.student_id=? AND t2.category=t.category) AS affinity
       FROM tasks t JOIN users u ON u.id=t.employer_id
       WHERE t.status='active' AND t.deadline >= UTC_DATE() AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.task_id=t.id AND a.student_id=?)
       ORDER BY affinity DESC, t.created_at DESC LIMIT 5`, [id, id]);
    const timeline = await q(
      `SELECT a.id, a.status, a.applied_at AS appliedAt, a.accepted_at AS acceptedAt, a.submitted_at AS submittedAt, a.completed_at AS completedAt, t.title AS taskTitle, COALESCE(u.organization,u.name) AS organization
       FROM applications a JOIN tasks t ON t.id=a.task_id JOIN users u ON u.id=t.employer_id WHERE a.student_id=? ORDER BY a.updated_at DESC LIMIT 6`, [id]);
    const deadlines = await q(
      `SELECT a.id, t.title AS taskTitle, t.deadline FROM applications a JOIN tasks t ON t.id=a.task_id
       WHERE a.student_id=? AND a.status='accepted' AND t.deadline >= UTC_DATE() ORDER BY t.deadline ASC LIMIT 5`, [id]);
    const certificates = await q('SELECT id, cert_code AS certCode, task_title AS taskTitle, organization, issued_at AS issuedAt, rating FROM certificates WHERE student_id=? ORDER BY issued_at DESC LIMIT 4', [id]);
    return { stats: { ...stats, certificates: certs.n, avgRating: rating?.avg ?? null }, recommended, timeline, deadlines, certificates };
  },

  async employer(id) {
    const t = await one(`SELECT CAST(COALESCE(SUM(status='active'),0) AS SIGNED) active, CAST(COALESCE(SUM(status='draft'),0) AS SIGNED) drafts, CAST(COALESCE(SUM(status='completed'),0) AS SIGNED) completed, COUNT(*) total FROM tasks WHERE employer_id=?`, [id]);
    const a = await one(`SELECT CAST(COALESCE(SUM(a.status='applied'),0) AS SIGNED) pendingApplications, CAST(COALESCE(SUM(a.status='submitted'),0) AS SIGNED) toReview, CAST(COALESCE(SUM(a.status='completed'),0) AS SIGNED) completedWork
      FROM applications a JOIN tasks t ON t.id=a.task_id WHERE t.employer_id=?`, [id]);
    const given = await one("SELECT ROUND(AVG(rating),2) avg FROM feedback WHERE from_user_id=? AND direction='employer_to_student'", [id]);
    const received = await one("SELECT ROUND(AVG(rating),2) avg FROM feedback WHERE to_user_id=? AND direction='student_to_employer'", [id]);
    const perTask = await q(`SELECT t.id, t.title, COUNT(a.id) applications FROM tasks t LEFT JOIN applications a ON a.task_id=t.id WHERE t.employer_id=? GROUP BY t.id, t.title ORDER BY applications DESC, t.id DESC LIMIT 8`, [id]);
    const applicants = await q(`SELECT a.id, a.status, a.applied_at AS appliedAt, s.name AS studentName, s.college AS studentCollege, t.title AS taskTitle FROM applications a JOIN tasks t ON t.id=a.task_id JOIN users s ON s.id=a.student_id WHERE t.employer_id=? AND a.status='applied' ORDER BY a.applied_at DESC LIMIT 6`, [id]);
    const reviewQueue = await q(`SELECT a.id, a.submitted_at AS submittedAt, s.name AS studentName, t.title AS taskTitle FROM applications a JOIN tasks t ON t.id=a.task_id JOIN users s ON s.id=a.student_id WHERE t.employer_id=? AND a.status='submitted' ORDER BY a.submitted_at ASC LIMIT 6`, [id]);
    return { stats: { ...t, ...a, avgGiven: given?.avg ?? null, avgReceived: received?.avg ?? null }, perTask, applicants, reviewQueue };
  },

  async admin() {
    const users = await q("SELECT role, COUNT(*) n FROM users GROUP BY role");
    const byRole = Object.fromEntries(users.map((u) => [u.role, u.n]));
    const pending = await one("SELECT COUNT(*) n FROM users WHERE status='pending_approval'");
    const tasks = await q('SELECT status, COUNT(*) n FROM tasks GROUP BY status');
    const apps = await q("SELECT DATE(applied_at) AS day, COUNT(*) applications FROM applications WHERE applied_at >= DATE_SUB(UTC_DATE(), INTERVAL 13 DAY) GROUP BY DATE(applied_at)");
    const signups = await q("SELECT DATE(created_at) AS day, CAST(SUM(role='student') AS SIGNED) students, CAST(SUM(role='employer') AS SIGNED) employers FROM users WHERE role<>'admin' AND created_at >= DATE_SUB(UTC_DATE(), INTERVAL 29 DAY) GROUP BY DATE(created_at)");
    const queue = await q("SELECT id, name, email, role, organization, college, created_at AS createdAt FROM users WHERE status='pending_approval' ORDER BY created_at ASC LIMIT 8");
    const audit = await q('SELECT id, actor_name AS actorName, action, details, created_at AS createdAt FROM audit_log ORDER BY id DESC LIMIT 8');
    return {
      stats: { students: byRole.student || 0, employers: byRole.employer || 0, admins: byRole.admin || 0, pendingApprovals: pending.n },
      tasksByStatus: ['draft', 'active', 'pending_review', 'completed'].map((s) => ({ status: s, count: n(tasks.find((t) => t.status === s)?.n) })),
      applicationsPerDay: fillDays(apps, 14, ['applications']),
      signupsOverTime: fillDays(signups, 30, ['students', 'employers']),
      queue, audit,
    };
  },
};
