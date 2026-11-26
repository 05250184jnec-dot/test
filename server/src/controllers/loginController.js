/**
 * controllers/loginController.js - LOGIN, LOGOUT and "who am I" (me).
 *
 * LAYER: CONTROLLER.
 * ROUTES:  POST /api/auth/login   POST /api/auth/logout   GET /api/auth/me      (routes/authRoutes.js)
 * FRONTEND: client/src/features/auth/pages/SignIn.jsx -> AuthContext.login() -> authApi.login()
 *           client/src/shared/context/AuthContext.jsx calls authApi.me() on every page load to restore the session.
 *
 * LOGIN STEP BY STEP
 *   1. Find the user by e-mail.
 *   2. Compare the typed password with the stored bcrypt hash.
 *      (If the e-mail doesn't exist we still compare against a dummy hash, so the response takes the
 *       same time and an attacker can't tell "unknown e-mail" from "wrong password".)
 *   3. Wrong e-mail OR wrong password -> the SAME message: "Invalid e-mail or password."
 *   4. Correct password but account not usable yet -> NOW it is safe to explain why
 *      (not verified / waiting for approval / rejected / suspended).
 *   5. All good -> sign a JWT (a signed token that says "this is user #7, role student") and return it.
 *      The browser stores it and sends it back in the `Authorization: Bearer ...` header on every request.
 */
import bcrypt from 'bcryptjs';
import { userModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { BCRYPT_COST } from '../utils/constants.js';
import { signToken } from '../middleware/auth.js';

// Compared against when the e-mail is unknown, so timing doesn't reveal whether the account exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', BCRYPT_COST);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;

  const user = await userModel.findByEmail(email);
  const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordOk) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid e-mail or password.');

  // Credentials are correct, so explaining the block reason leaks nothing.
  if (user.status === 'pending_verification') throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your e-mail first.', { email: user.email });
  if (user.status === 'pending_approval') throw new HttpError(403, 'PENDING_APPROVAL', 'Your registration is waiting for admin approval.');
  if (user.status === 'rejected') throw new HttpError(403, 'REJECTED', `Your registration was rejected.${user.rejection_reason ? ` Reason: ${user.rejection_reason}` : ''}`);
  if (user.suspended) throw new HttpError(403, 'SUSPENDED', 'Your account has been suspended. Contact support.');

  await userModel.touchLogin(user.id);
  return ok(res, { token: signToken(user), user: await userModel.findPublicById(user.id) });
});

/** JWTs are stateless: there is nothing to delete on the server. The browser just forgets the token. */
export const logout = (req, res) => ok(res, null, 'Signed out');

/** requireAuth (middleware/auth.js) already loaded req.user from the token; here we return the full public profile. */
export const me = asyncHandler(async (req, res) => ok(res, await userModel.findPublicById(req.user.id)));
