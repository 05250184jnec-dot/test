/**
 * models/submissionModel.js - SQL for the `submissions` table (the work a student hands in).
 *
 * LAYER: MODEL.
 * One application can have several submissions: if the employer asks for changes, the student submits again.
 * Used by: studentApplicationController (add), employerApplicationController (review), applicationController (list)
 */
import { q, run, one } from '../config/db.js';

export const submissionModel = {
  add: async (applicationId, s, conn) => (await run('INSERT INTO submissions (application_id, note, link) VALUES (?,?,?)', [applicationId, s.note, s.link], conn)).insertId,
  latest: (applicationId, conn) => one('SELECT * FROM submissions WHERE application_id=? ORDER BY id DESC LIMIT 1 FOR UPDATE', [applicationId], conn),
  review: (id, status, note, conn) => run('UPDATE submissions SET status=?, review_note=?, reviewed_at=UTC_TIMESTAMP() WHERE id=?', [status, note ?? null, id], conn),
  forApplication: (applicationId) => q('SELECT id, note, link, status, review_note AS reviewNote, created_at AS createdAt, reviewed_at AS reviewedAt FROM submissions WHERE application_id=? ORDER BY id DESC', [applicationId]),
};
