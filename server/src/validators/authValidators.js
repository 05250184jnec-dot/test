/**
 * validators/authValidators.js - the rules each AUTH request body must follow.
 *
 * LAYER: VALIDATOR (zod). Runs BEFORE the controller (see middleware/validate.js).
 * If the body breaks a rule the browser gets a 400 with a message per field and the controller never runs.
 * `.strict()` rejects unknown fields, so nobody can sneak in {"role":"admin"} (mass-assignment protection).
 * Used by: routes/authRoutes.js
 */
import { z } from 'zod';
import { text, optText, email, password } from './common.js';

export const registerBody = z.object({
  role: z.enum(['student', 'employer']),           // 'admin' is not allowed here: admins can never self-register
  name: text(2, 100), email, password,
  college: optText(150), organization: optText(150),
}).strict().superRefine((v, ctx) => {              // superRefine = a rule that looks at several fields together
  if (v.role === 'student' && !v.college) ctx.addIssue({ code: 'custom', path: ['college'], message: 'College/university is required' });
  if (v.role === 'employer' && !v.organization) ctx.addIssue({ code: 'custom', path: ['organization'], message: 'Organization is required' });
});

export const verifyEmailBody = z.object({ email, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') }).strict();
export const emailOnlyBody = z.object({ email }).strict();                       // resend-code, forgot-password
export const loginBody = z.object({ email, password: z.string().min(1).max(72) }).strict(); // login: don't apply the strength policy, just limit the size
export const resetPasswordBody = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid token'), password }).strict();
export const profileBody = z.object({ name: text(2, 100), phone: optText(30), bio: optText(1000, { multiline: true }), college: optText(150), organization: optText(150) }).strict();
export const changePasswordBody = z.object({ currentPassword: z.string().min(1).max(72), newPassword: password }).strict();
