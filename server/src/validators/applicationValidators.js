/**
 * validators/applicationValidators.js - rules for apply / accept / submit work / review / feedback requests.
 *
 * LAYER: VALIDATOR (zod). Used by: routes/studentRoutes.js and routes/employerRoutes.js
 */
import { z } from 'zod';
import { text, optText, id, isoDate, listQuery } from './common.js';
import { APP_STATUSES } from '../utils/constants.js';

export const applyBody = z.object({ coverLetter: text(20, 3000, { multiline: true }), availableFrom: isoDate }).strict();

export const submitWorkBody = z.object({
  note: text(10, 3000, { multiline: true }),
  // Optional link, but only http/https (blocks javascript: links)
  link: z.union([z.string().trim().max(500).url().refine((u) => /^https?:\/\//i.test(u), 'Only http/https links'), z.literal('')]).optional()
    .transform((v) => v || null),
}).strict();

export const decisionBody = z.object({ decision: z.enum(['accepted', 'rejected']) }).strict();

export const reviewBody = z.object({
  decision: z.enum(['complete', 'revision']),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: optText(1500, { multiline: true }),
  note: optText(1000, { multiline: true }),
}).strict().superRefine((v, ctx) => {
  if (v.decision === 'complete' && !v.rating) ctx.addIssue({ code: 'custom', path: ['rating'], message: 'A rating (1-5) is required' });
  if (v.decision === 'revision' && !v.note) ctx.addIssue({ code: 'custom', path: ['note'], message: 'Explain what to change' });
});

export const feedbackBody = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: optText(1500, { multiline: true }) }).strict();

export const applicationListQuery = listQuery(['newest', 'oldest', 'status'], {
  status: z.enum(APP_STATUSES).optional(), scope: z.enum(['active', 'history']).optional(), taskId: id.optional(),
});
