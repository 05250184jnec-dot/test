/**
 * validators/common.js - zod building blocks. Every request body is parsed with
 * .strict() so UNKNOWN FIELDS ARE REJECTED (mass-assignment protection), and every
 * field has type/length/format limits BEFORE it reaches a controller.
 */
import { z } from 'zod';

const CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g; // control chars except \t \n \r
export const text = (min, max, { multiline = false } = {}) =>
  z.string().transform((s) => (multiline ? s : s.replace(/[\r\n\t]+/g, ' ')).replace(CTRL, '').trim())
    .pipe(z.string().min(min, `At least ${min} characters`).max(max, `At most ${max} characters`));
export const optText = (max, opts) => z.union([text(0, max, opts), z.null()]).optional().transform((v) => (v === '' ? null : v ?? null));
export const email = z.string().trim().toLowerCase().max(190).email('Enter a valid e-mail');
// bcrypt only uses the first 72 bytes, so cap there. Policy: 8+, upper, lower, digit.
export const password = z.string().min(8, 'Min 8 characters').max(72, 'Max 72 characters')
  .regex(/[a-z]/, 'Needs a lowercase letter').regex(/[A-Z]/, 'Needs an uppercase letter').regex(/\d/, 'Needs a number');
export const id = z.coerce.number().int().positive();
export const idParams = z.object({ id }).strict();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');
export const listQuery = (sorts, extra = {}) => z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(sorts).optional(),
  ...extra,
}).strict();
