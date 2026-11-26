/**
 * middleware/rateLimiter.js - all rate limiters (express-rate-limit v7).
 * Every limiter answers HTTP 429 { code:'RATE_LIMITED', message, retryAfter } + Retry-After header.
 * Store: in-memory by default; set USE_REDIS=true to share counters across many server instances.
 */
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

let redisClient = null;
if (config.useRedis) {
  // WHY: optional deps loaded only when enabled, so local dev needs no Redis.
  const { default: Redis } = await import('ioredis');
  redisClient = new Redis(config.REDIS_URL);
}
async function makeStore(prefix) {
  if (!redisClient) return undefined;
  const { default: RedisStore } = await import('rate-limit-redis');
  return new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (...args) => redisClient.call(...args) });
}

const handler = (req, res) => {
  const resetMs = req.rateLimit?.resetTime ? req.rateLimit.resetTime.getTime() - Date.now() : 60000;
  const retryAfter = Math.max(1, Math.ceil(resetMs / 1000));
  res.set('Retry-After', String(retryAfter));
  res.status(429).json({ success: false, code: 'RATE_LIMITED', message: `Too many requests. Try again in ${retryAfter} seconds.`, retryAfter });
};
const base = { standardHeaders: 'draft-7', legacyHeaders: false, handler };
const emailKey = (req) => String(req.body?.email || '').toLowerCase().slice(0, 190);
const ip = (req) => req.ip;

/** 100 req / 15 min / IP on all /api: blunts scraping and generic abuse. */
export const globalLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 100, store: await makeStore('global') });

/** 5 FAILED logins / 15 min per IP+email: stops password guessing. 403 (blocked-but-correct creds) is not counted as a guess. */
export const loginLimiter = rateLimit({
  ...base, windowMs: 15 * 60_000, limit: 5, store: await makeStore('login'),
  keyGenerator: (req) => `${ip(req)}|${emailKey(req)}`,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode < 400 || res.statusCode === 403,
});

/** 5 sign-ups / hour / IP: stops mass account creation. */
export const registerLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 5, store: await makeStore('register') });

/** 5 code attempts / 10 min per e-mail: the 6-digit code has only 1,000,000 values, so guesses must be capped.
 *  (The controller ALSO deletes the code after 5 wrong tries.) Keyed by email, not IP, so botnets can't dodge it. */
export const verifyLimiter = rateLimit({ ...base, windowMs: 10 * 60_000, limit: 5, store: await makeStore('verify'), keyGenerator: (req) => emailKey(req) || ip(req) });

/** E-mail-sending endpoints: 3/hour per e-mail AND 10/hour per IP (stops mail-bombing a victim). */
export const mailLimiter = [
  rateLimit({ ...base, windowMs: 60 * 60_000, limit: 3, store: await makeStore('mail-email'), keyGenerator: (req) => emailKey(req) || ip(req) }),
  rateLimit({ ...base, windowMs: 60 * 60_000, limit: 10, store: await makeStore('mail-ip') }),
];

/** Writes (POST/PUT/DELETE on tasks, applications...): 30 / 15 min per USER. Place AFTER requireAuth. */
export const writeLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 30, store: await makeStore('write'), keyGenerator: (req) => `u${req.user?.id ?? req.ip}` });
