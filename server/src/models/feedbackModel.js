/**
 * models/feedbackModel.js - SQL for the `feedback` table (star ratings + comments in BOTH directions).
 *
 * LAYER: MODEL.
 * direction = 'employer_to_student' (written when work is approved) or 'student_to_employer' (written after completion).
 * Used by: employerApplicationController (review), studentApplicationController (rate employer), applicationController (lists)
 */
import { q, run } from '../config/db.js';

export const feedbackModel = {
  add: (applicationId, fromUserId, toUserId, direction, rating, comment, conn) => run(
    'INSERT INTO feedback (application_id, from_user_id, to_user_id, direction, rating, comment) VALUES (?,?,?,?,?,?)',
    [applicationId, fromUserId, toUserId, direction, rating, comment ?? ''], conn),
  // mode 'received' = feedback about me, 'given' = feedback I wrote
  listFor: (userId, mode) => q(
    `SELECT f.id, f.rating, f.comment, f.direction, f.created_at AS createdAt, t.title AS taskTitle, fu.name AS fromName, COALESCE(fu.organization, fu.name) AS fromOrg, tu.name AS toName
     FROM feedback f JOIN applications a ON a.id=f.application_id JOIN tasks t ON t.id=a.task_id JOIN users fu ON fu.id=f.from_user_id JOIN users tu ON tu.id=f.to_user_id
     WHERE ${mode === 'given' ? 'f.from_user_id' : 'f.to_user_id'} = ? ORDER BY f.created_at DESC LIMIT 100`, [userId]),
};
