/**
 * validators/adminValidators.js - rules for the admin ("User Manager") requests.
 *
 * LAYER: VALIDATOR (zod). Used by: routes/adminRoutes.js
 */
import { z } from 'zod';
import { optText, listQuery } from './common.js';
import { ROLES } from '../utils/constants.js';

export const userDecisionBody = z.object({ decision: z.enum(['approve', 'reject']), reason: optText(500) }).strict()
  .refine((v) => v.decision === 'approve' || v.reason, { path: ['reason'], message: 'A reason is required when rejecting' });

export const suspendBody = z.object({ suspended: z.boolean(), reason: optText(500) }).strict();

export const registrationsQuery = listQuery(['newest', 'oldest', 'name'], {
  tab: z.enum(['pending', 'approved', 'rejected']).default('pending'), role: z.enum(['student', 'employer']).optional(),
});
export const usersQuery = listQuery(['newest', 'oldest', 'name', 'role'], {
  role: z.enum(ROLES).optional(), status: z.string().regex(/^[a-z_]+$/).max(30).optional(), suspended: z.enum(['0', '1']).optional(),
});
export const auditQuery = listQuery(['newest', 'oldest'], { action: z.string().regex(/^[a-z_.]+$/).max(60).optional() });
