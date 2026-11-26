/**
 * routes/authRoutes.js - everything under /api/auth  (register, verify e-mail, login, passwords, profile).
 * Mounted in routes/index.js:  router.use('/auth', authRoutes)
 * Middleware order: rate limiter -> (requireAuth) -> validate(zod) -> controller.
 *
 *  URL                         controller file               frontend page
 *  POST /auth/register         registerController.js         SignUp.jsx
 *  POST /auth/verify-email     verifyEmailController.js      VerifyEmail.jsx
 *  POST /auth/resend-code      verifyEmailController.js      VerifyEmail.jsx
 *  POST /auth/login            loginController.js            SignIn.jsx
 *  POST /auth/forgot-password  passwordController.js         ForgotPassword.jsx
 *  POST /auth/reset-password   passwordController.js         ResetPassword.jsx
 *  GET  /auth/me, POST /logout loginController.js            AuthContext.jsx
 *  PUT  /auth/profile          profileController.js          Profile.jsx
 *  POST /auth/change-password passwordController.js         Profile.jsx
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, verifyLimiter, mailLimiter, writeLimiter } from '../middleware/rateLimiter.js';
import * as V from '../validators/authValidators.js';
import { register } from '../controllers/registerController.js';
import { verifyEmail, resendCode } from '../controllers/verifyEmailController.js';
import { login, logout, me } from '../controllers/loginController.js';
import { forgotPassword, resetPassword, changePassword } from '../controllers/passwordController.js';
import { updateProfile } from '../controllers/profileController.js';

const r = Router();

/* public (no token needed) */
r.post('/register', registerLimiter, validate({ body: V.registerBody }), register);
r.post('/verify-email', verifyLimiter, validate({ body: V.verifyEmailBody }), verifyEmail);
r.post('/resend-code', ...mailLimiter, validate({ body: V.emailOnlyBody }), resendCode);
r.post('/login', loginLimiter, validate({ body: V.loginBody }), login);
r.post('/forgot-password', ...mailLimiter, validate({ body: V.emailOnlyBody }), forgotPassword);
r.post('/reset-password', validate({ body: V.resetPasswordBody }), resetPassword);

/* signed in (requireAuth checks the JWT) */
r.post('/logout', requireAuth, logout);
r.get('/me', requireAuth, me);
r.put('/profile', requireAuth, writeLimiter, validate({ body: V.profileBody }), updateProfile);
r.post('/change-password', requireAuth, writeLimiter, validate({ body: V.changePasswordBody }), changePassword);

export default r;
