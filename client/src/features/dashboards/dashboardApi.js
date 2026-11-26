
import { api } from '../../shared/api/apiClient.js';

export const studentDashboard = () => api('/student/dashboard');
export const employerDashboard = () => api('/employer/dashboard');
export const adminDashboard = () => api('/admin/dashboard');
