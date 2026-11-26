/**
 * validators/taskValidators.js - rules for task requests (employer create/edit, and the browse/list filters).
 *
 * LAYER: VALIDATOR (zod). Used by: routes/taskRoutes.js, employerRoutes.js, adminRoutes.js
 */
import { z } from 'zod';
import { text, isoDate, listQuery } from './common.js';
import { CATEGORIES, TASK_STATUSES } from '../utils/constants.js';

/** Body of POST /employer/tasks and PUT /employer/tasks/:id */
export const taskBody = z.object({
  title: text(3, 150),
  category: z.enum(CATEGORIES),
  description: text(20, 5000, { multiline: true }),
  durationDays: z.coerce.number().int().min(1).max(365),   // z.coerce turns the string "7" into the number 7
  pay: z.coerce.number().min(0).max(10_000_000),
  positions: z.coerce.number().int().min(1).max(100).default(1),
  deadline: isoDate,
  status: z.enum(TASK_STATUSES).default('draft'),
}).strict();

/** Query string of every task list: ?page=2&search=logo&category=Design&sort=pay_high */
export const taskListQuery = listQuery(['newest', 'deadline', 'pay_high', 'pay_low', 'title'], {
  category: z.enum(CATEGORIES).optional(), minPay: z.coerce.number().min(0).optional(),
  maxPay: z.coerce.number().min(0).optional(), status: z.enum(TASK_STATUSES).optional(),
});
