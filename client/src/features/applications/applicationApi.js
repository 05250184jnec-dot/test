
import { api } from '../../shared/api/apiClient.js';

/* ---- student ---- */
/** GET /api/student/applications -> studentApplicationController.studentApplications */
export const studentApplications = (params) => api('/student/applications', { params });
/** GET /api/student/applications/:id -> applicationController.applicationDetail */
export const studentApplicationDetail = (id) => api(`/student/applications/${id}`);
/** POST /api/student/tasks/:id/apply -> studentApplicationController.apply */
export const applyToTask = (taskId, body) => api(`/student/tasks/${taskId}/apply`, { method: 'POST', body });
/** POST /api/student/applications/:id/submit -> studentApplicationController.submitWork */
export const submitWork = (id, body) => api(`/student/applications/${id}/submit`, { method: 'POST', body });
/** POST /api/student/applications/:id/feedback -> studentApplicationController.studentFeedback */
export const rateEmployer = (id, body) => api(`/student/applications/${id}/feedback`, { method: 'POST', body });

/* ---- employer ---- */
/** GET /api/employer/applications -> employerApplicationController.employerApplications */
export const employerApplications = (params) => api('/employer/applications', { params });
/** GET /api/employer/applications/:id -> applicationController.applicationDetail */
export const employerApplicationDetail = (id) => api(`/employer/applications/${id}`);
/** POST /api/employer/applications/:id/decision -> employerApplicationController.decide ('accepted' | 'rejected') */
export const decideApplication = (id, decision) => api(`/employer/applications/${id}/decision`, { method: 'POST', body: { decision } });
/** GET /api/employer/review -> employerApplicationController.reviewQueue */
export const reviewQueue = (params) => api('/employer/review', { params });
/** POST /api/employer/applications/:id/review -> employerApplicationController.review */
export const reviewApplication = (id, body) => api(`/employer/applications/${id}/review`, { method: 'POST', body });
