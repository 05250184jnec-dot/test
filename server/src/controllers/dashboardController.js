/**
 * controllers/dashboardController.js - the three DASHBOARDS (one per role). Each is a handful of SQL aggregates.
 * LAYER: CONTROLLER (thin: all the SQL is in models/dashboardModel.js).
 * ROUTES:  GET /api/student/dashboard   GET /api/employer/dashboard   GET /api/admin/dashboard
 * FRONTEND: features/dashboards/pages/StudentDashboard.jsx, EmployerDashboard.jsx, AdminDashboard.jsx -> dashboardApi.js
 */
import { dashboardModel } from '../models/dashboardModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { mailHealth } from '../services/mailer.js';

export const studentDashboard = asyncHandler(async (req, res) => ok(res, await dashboardModel.student(req.user.id)));
export const employerDashboard = asyncHandler(async (req, res) => ok(res, await dashboardModel.employer(req.user.id)));
export const adminDashboard = asyncHandler(async (req, res) => ok(res, { ...(await dashboardModel.admin()), mail: await mailHealth() }));
