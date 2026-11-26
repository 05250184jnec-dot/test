/**
 * models/passwordResetModel.js - SQL for the `password_resets` table ("forgot password" links).
 *
 * LAYER: MODEL.
 * The e-mailed token is random; only its SHA-256 hash is stored, so a leaked database can't be used to reset accounts.
 * Used by: controllers/passwordController.js
 */
import { run, one } from '../config/db.js';

export const passwordResetModel = {
  create: async (userId, hash) => {
    await run('DELETE FROM password_resets WHERE user_id=?', [userId]); // only the newest link works
    return run('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?,?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))', [userId, hash]);
  },
  lockValid: (hash, conn) => one('SELECT * FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP() FOR UPDATE', [hash], conn),
  removeForUser: (userId, conn) => run('DELETE FROM password_resets WHERE user_id=?', [userId], conn), // single use
};
