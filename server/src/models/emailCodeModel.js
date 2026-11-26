/**
 * models/emailCodeModel.js - SQL for the `email_codes` table (the 6-digit e-mail verification codes).
 *
 * LAYER: MODEL.
 * Only the HASH of the code is stored (never the code itself), plus an attempts counter and an expiry.
 * Used by: services/verificationCode.js (send) and controllers/verifyEmailController.js (check).
 */
import { run, one } from '../config/db.js';

export const emailCodeModel = {
  // One code per user: a new code replaces the old one (ON DUPLICATE KEY UPDATE) and resets attempts to 0.
  upsert: (userId, hash, conn) => run(
    `INSERT INTO email_codes (user_id, code_hash, attempts, expires_at, last_sent_at) VALUES (?,?,0, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE code_hash=VALUES(code_hash), attempts=0, expires_at=VALUES(expires_at), last_sent_at=VALUES(last_sent_at)`, [userId, hash], conn),
  // FOR UPDATE locks the row so two parallel guesses can't both read the same attempts count.
  lockByUser: (userId, conn) => one('SELECT *, (expires_at < UTC_TIMESTAMP()) AS expired, TIMESTAMPDIFF(SECOND, last_sent_at, UTC_TIMESTAMP()) AS age FROM email_codes WHERE user_id=? FOR UPDATE', [userId], conn),
  age: (userId) => one('SELECT TIMESTAMPDIFF(SECOND, last_sent_at, UTC_TIMESTAMP()) AS age FROM email_codes WHERE user_id=?', [userId]), // seconds since last send (resend cooldown)
  bump: (userId, conn) => run('UPDATE email_codes SET attempts=attempts+1 WHERE user_id=?', [userId], conn),
  remove: (userId, conn) => run('DELETE FROM email_codes WHERE user_id=?', [userId], conn),
};
