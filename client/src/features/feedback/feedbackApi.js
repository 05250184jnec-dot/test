/**
 * feedbackApi.js - HTTP call that loads ratings received and given.
 * FRONTEND: API layer of the "feedback" feature, used by pages/FeedbackPage.jsx.
 * TALKS TO (backend): GET /api/student/feedback or /api/employer/feedback -> routes/studentRoutes.js, employerRoutes.js
 *   -> applicationController.myFeedback -> models/feedbackModel.js
 * HOW IT WORKS: the URL starts with the user's role because each role has its own router on the server.
 */
import { api } from '../../shared/api/apiClient.js';

export const myFeedback = (role) => api(`/${role}/feedback`);
