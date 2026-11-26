/**
 * validators/miscValidators.js - rules for notification lists and the public certificate-verify URL.
 *
 * LAYER: VALIDATOR (zod). Used by: routes/notificationRoutes.js, routes/certificateRoutes.js
 */
import { z } from 'zod';
import { listQuery } from './common.js';

export const notificationsQuery = listQuery(['newest'], { unread: z.enum(['0', '1']).optional() });
// Certificate codes look like IH-1A2B3C4D5E6F. Anything else is rejected before touching the database.
export const certCodeParams = z.object({ certCode: z.string().regex(/^IH-[A-F0-9]{12}$/) }).strict();
