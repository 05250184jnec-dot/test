/** utils/crypto.js - hashing/token helpers (Node crypto only). */
import crypto from 'node:crypto';
import { config } from '../config/env.js';

/** HMAC-SHA256 with a server-side pepper: a leaked DB alone can't brute-force 6-digit codes offline. */
export const hmac = (value) => crypto.createHmac('sha256', config.JWT_SECRET).update(String(value)).digest('hex');
/** Plain SHA-256 for high-entropy random tokens (reset links). */
export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
/** Constant-time compare of two hex strings (prevents timing attacks). */
export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
/** Uniformly random 6-digit code using the CSPRNG (not Math.random). */
export const sixDigitCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
export const randomToken = () => crypto.randomBytes(32).toString('hex');
export const certCode = () => `IH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
