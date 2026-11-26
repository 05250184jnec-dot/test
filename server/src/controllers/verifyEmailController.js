/**
 * controllers/verifyEmailController.js - VERIFY E-MAIL with the 6-digit code, and RESEND the code.
 *
 * LAYER: CONTROLLER.
 * ROUTES:  POST /api/auth/verify-email   and   POST /api/auth/resend-code     (routes/authRoutes.js)
 * FRONTEND: client/src/features/auth/pages/VerifyEmail.jsx  ->  authApi.verifyEmail() / authApi.resendCode()
 *
 * Account status flow:  pending_verification --(this file)--> pending_approval --(admin)--> approved | rejected
 *
 * SECURITY IDEAS (look for them in the code below)
 *   - Only the HASH of the code is stored; we compare hashes with safeEqual (constant-time).
 *   - Max 5 wrong tries, then the code is deleted and a new one must be requested.
 *   - A DB TRANSACTION + FOR UPDATE row lock: two parallel guesses can't both read "attempts = 4".
 */
import { userModel } from '../models/userModel.js';
import { emailCodeModel } from '../models/emailCodeModel.js';
import { withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { hmac, safeEqual } from '../utils/crypto.js';
import { CODE_MAX_ATTEMPTS, RESEND_COOLDOWN_SEC } from '../utils/constants.js';
import { notify } from '../services/notify.js';
import { sendCodeIfCooldownPassed, CODE_SENT_MESSAGE } from '../services/verificationCode.js';
import { emitToRole } from '../socket/index.js';

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.valid.body;
  const BAD = new HttpError(400, 'INVALID_CODE', 'Invalid or expired code.');   // one vague message for every failure

  const user = await userModel.findByEmail(email);
  if (!user || user.status !== 'pending_verification') throw BAD;

  // withTransaction: everything inside succeeds together or is rolled back together.
  const result = await withTransaction(async (conn) => {
    const row = await emailCodeModel.lockByUser(user.id, conn);
    if (!row || row.expired) return 'bad';
    if (row.attempts >= CODE_MAX_ATTEMPTS) { await emailCodeModel.remove(user.id, conn); return 'locked'; }
    if (!safeEqual(hmac(code), row.code_hash)) {
      await emailCodeModel.bump(user.id, conn);                                  // count the wrong try
      if (row.attempts + 1 >= CODE_MAX_ATTEMPTS) { await emailCodeModel.remove(user.id, conn); return 'locked'; }
      return 'bad';
    }
    await emailCodeModel.remove(user.id, conn);        // a code works only once
    await userModel.markVerified(user.id, conn);       // status -> pending_approval
    return 'ok';
  });

  if (result === 'locked') throw new HttpError(400, 'CODE_INVALIDATED', 'Too many wrong attempts. Request a new code.');
  if (result !== 'ok') throw BAD;

  // Tell every admin: a new registration is waiting (bell notification + live refresh of their queue).
  for (const a of await userModel.adminIds()) notify(a.id, { type: 'registration', title: 'New registration to review', body: `${user.name} (${user.role})`, link: '/admin/registrations' });
  emitToRole('admin', 'registrations:changed');

  return ok(res, { status: 'pending_approval' }, 'E-mail verified. An admin will review your registration.');
});

export const resendCode = asyncHandler(async (req, res) => {
  const user = await userModel.findByEmail(req.valid.body.email);
  if (user && user.status === 'pending_verification') await sendCodeIfCooldownPassed(user);
  return ok(res, { cooldown: RESEND_COOLDOWN_SEC }, CODE_SENT_MESSAGE);          // same answer whether or not the account exists
});
