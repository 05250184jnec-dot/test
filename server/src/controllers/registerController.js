/**
 * controllers/registerController.js - REGISTER (create an account).
 *
 * LAYER: CONTROLLER. A controller is the "brain" of one endpoint: it takes the validated request,
 * calls models/services, and sends the JSON answer. It contains the business rules.
 *
 * ROUTE:  POST /api/auth/register          (see routes/authRoutes.js)
 * FRONTEND: client/src/features/auth/pages/SignUp.jsx  ->  authApi.register()
 *
 * STEP BY STEP
 *   1. Validator already checked the body (role, name, e-mail, password rules)  -> req.valid.body
 *   2. Look for an existing account with that e-mail.
 *   3. New e-mail?   hash the password with bcrypt, INSERT the user, e-mail a 6-digit code.
 *      Same e-mail, still unverified?  re-send a code (respecting the 60 s cooldown).
 *      Same e-mail, already active?    e-mail the owner "someone tried to register".
 *   4. ALWAYS answer with the same generic message (anti-enumeration: an attacker can't tell
 *      whether an e-mail is registered).
 */
import bcrypt from 'bcryptjs';
import { userModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { BCRYPT_COST, RESEND_COOLDOWN_SEC } from '../utils/constants.js';
import { queueMail } from '../services/mailer.js';
import { sendVerificationCode, sendCodeIfCooldownPassed, CODE_SENT_MESSAGE } from '../services/verificationCode.js';

export const register = asyncHandler(async (req, res) => {
  const b = req.valid.body;                                  // clean, validated data (never use raw req.body)
  const existing = await userModel.findByEmail(b.email);

  if (!existing) {
    const passwordHash = await bcrypt.hash(b.password, BCRYPT_COST);   // the plain password is never stored
    const id = await userModel.create({
      ...b, passwordHash,
      organization: b.role === 'employer' ? b.organization : null,     // only keep the field that matches the role
      college: b.role === 'student' ? b.college : null,
    });
    await sendVerificationCode({ id, email: b.email, name: b.name });
  } else if (existing.status === 'pending_verification') {
    await sendCodeIfCooldownPassed(existing);
  } else {
    queueMail(existing.email, 'accountExists', { name: existing.name });
  }

  return ok(res, { email: b.email, cooldown: RESEND_COOLDOWN_SEC }, CODE_SENT_MESSAGE, 201);
});
