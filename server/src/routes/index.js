/**
 * routes/index.js - the ROUTE MAP. app.js mounts this at /api, so every URL below starts with /api.
 * Think of it as the table of contents of the backend: pick a prefix, open that routes file.
 */
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import taskRoutes from './taskRoutes.js';
import studentRoutes from './studentRoutes.js';
import employerRoutes from './employerRoutes.js';
import adminRoutes from './adminRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import certificateRoutes from './certificateRoutes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/student', studentRoutes);
router.use('/employer', employerRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/certificates', certificateRoutes);
export default router;
