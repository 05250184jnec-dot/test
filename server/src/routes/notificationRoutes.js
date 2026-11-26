/** routes/notificationRoutes.js - /api/notifications (the bell). Any signed-in user, own notifications only. */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { idParams } from '../validators/common.js';
import { notificationsQuery } from '../validators/miscValidators.js';
import { listNotifications, readOne, readAll } from '../controllers/notificationController.js';

const r = Router();
r.use(requireAuth);
r.get('/', validate({ query: notificationsQuery }), listNotifications);
r.post('/read-all', readAll);                       // defined BEFORE '/:id/read' on purpose
r.post('/:id/read', validate({ params: idParams }), readOne);
export default r;
