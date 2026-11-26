/**
 * middleware/auth.js - authentication + role + status checks.
 * Security notes:
 *  - JWT algorithm is pinned to HS256 (prevents "alg:none" tricks).
 *  - The user is RE-LOADED from the DB on every request so a suspended/rejected user
 *    is cut off immediately, even with a still-valid token.
 *  - The user id ALWAYS comes from the verified token, never from params/body.
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { one } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: config.JWT_EXPIRES_IN });

export async function loadUserFromToken(token) {
  let payload;
  try { payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw new HttpError(401, 'INVALID_TOKEN', 'Session expired. Please sign in again.'); }
  const user = await one('SELECT id, role, name, email, status, suspended FROM users WHERE id = ?', [payload.sub]);
  if (!user) throw new HttpError(401, 'INVALID_TOKEN', 'Session expired. Please sign in again.');
  if (user.suspended) throw new HttpError(403, 'SUSPENDED', 'Your account has been suspended.');
  if (user.status !== 'approved') throw new HttpError(403, 'NOT_APPROVED', 'Your account is not active.');
  return user;
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new HttpError(401, 'NO_TOKEN', 'Please sign in.');
  req.user = await loadUserFromToken(h.slice(7));
  next();
});

/** requireRole('employer') etc. Must run AFTER requireAuth. */
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'FORBIDDEN', 'You do not have access to this area.'));
