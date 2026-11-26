/**
 * services/verificationCode.js - creates and e-mails the 6-digit verification code.
 *
 * LAYER: SERVICE (a helper used by more than one controller, so it lives outside them).
 * Used by: registerController (after sign-up) and verifyEmailController (resend).
 */
import { emailCodeModel } from '../models/emailCodeModel.js';
import { hmac, sixDigitCode } from '../utils/crypto.js';
import { RESEND_COOLDOWN_SEC } from '../utils/constants.js';
import { queueMail } from './mailer.js';

/** The SAME message is returned whether or not the e-mail exists, so attackers can't discover who has an account. */
export const CODE_SENT_MESSAGE = 'If the details are valid, a 6-digit verification code has been sent to your e-mail.';

/** Make a new code, store only its HASH, and queue the e-mail. */
export async function sendVerificationCode(user) {
  const code = sixDigitCode();
  await emailCodeModel.upsert(user.id, hmac(code));
  queueMail(user.email, 'verifyCode', { name: user.name, code });
}

/** Send a code only if none was sent in the last RESEND_COOLDOWN_SEC seconds (stops mail-bombing). */
export async function sendCodeIfCooldownPassed(user) {
  const last = await emailCodeModel.age(user.id);
  if (!last || last.age >= RESEND_COOLDOWN_SEC) await sendVerificationCode(user);
}
