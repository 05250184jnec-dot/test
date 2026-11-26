/**
 * controllers/passwordController.js - FORGOT password, RESET password (via e-mailed link) and CHANGE password (signed in).
 *
 * LAYER: CONTROLLER.
 * ROUTES:  POST /api/auth/forgot-password   POST /api/auth/reset-password   POST /api/auth/change-password
 * FRONTEND: features/auth/pages/ForgotPassword.jsx, ResetPassword.jsx   and   features/profile/pages/Profile.jsx
 *
 * THE FORGOT -> RESET FLOW
 *   1. forgotPassword: make a long random token, store only its SHA-256 hash (valid 30 min), e-mail the link
 *      <client>/reset-password?token=...   Always answers "if that e-mail has an account..." (no leak).
 *   2. resetPassword: hash the token from the link, find the matching unused row, set the new password,
 *      delete the row (single use). All inside one transaction.
 */
import bcrypt from 'bcryptjs';
import { userModel } from '../models/userModel.js';
import { passwordResetModel } from '../models/passwordResetModel.js';
import { withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { sha256, randomToken } from '../utils/crypto.js';
import { BCRYPT_COST } from '../utils/constants.js';
import { queueMail } from '../services/mailer.js';

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await userModel.findByEmail(req.valid.body.email);
  if (user && user.status === 'approved' && !user.suspended) {
    const token = randomToken();
    await passwordResetModel.create(user.id, sha256(token));          // only the HASH is stored
    queueMail(user.email, 'passwordReset', { name: user.name, token }); // the real token goes only into the e-mail
  }
  return ok(res, null, 'If that e-mail has an account, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.valid.body;
  const hash = await bcrypt.hash(password, BCRYPT_COST);
  await withTransaction(async (conn) => {
    const row = await passwordResetModel.lockValid(sha256(token), conn);
    if (!row) throw new HttpError(400, 'INVALID_TOKEN', 'This reset link is invalid or expired.');
    await userModel.updatePassword(row.user_id, hash, conn);
    await passwordResetModel.removeForUser(row.user_id, conn);        // single use
  });
  return ok(res, null, 'Password updated. You can sign in now.');
});

/** Signed-in user changes their own password: must prove they know the current one. */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.valid.body;
  const u = await userModel.findAuthById(req.user.id);               // id comes from the verified token
  if (!(await bcrypt.compare(currentPassword, u.password_hash))) throw new HttpError(400, 'WRONG_PASSWORD', 'Current password is incorrect.');
  await userModel.updatePassword(u.id, await bcrypt.hash(newPassword, BCRYPT_COST));
  return ok(res, null, 'Password changed');
});
