/**
 * config/env.js - loads and VALIDATES environment variables once at startup.
 * Security: the server refuses to boot with a weak/missing JWT secret, and no
 * secret is ever hard-coded in the repo (only .env.example is committed).
 */
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(5000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1).default('internhive'),
  DB_SSL: z.enum(['true', 'false']).default('false'), // 'true' for cloud databases such as Aiven
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.string().default('0'),
  USE_REDIS: z.enum(['true', 'false']).default('false'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(465),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('InternHive <no-reply@internhive.local>'),
  ADMIN_NAME: z.string().default('InternHive Admin'),
  ADMIN_EMAIL: z.string().default(''),
  ADMIN_PASSWORD: z.string().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:\n', parsed.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n'));
  process.exit(1);
}
const env = parsed.data;

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  // WHY: allow-list of origins (never "*") so only our own front-end can call the API with credentials.
  origins: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
  useRedis: env.USE_REDIS === 'true',
  trustProxy: /^\d+$/.test(env.TRUST_PROXY) ? (Number(env.TRUST_PROXY) === 0 ? false : Number(env.TRUST_PROXY)) : env.TRUST_PROXY,
};
