
import { api } from '../../shared/api/apiClient.js';

/** POST /api/auth/register -> registerController.register */
export const register = (body) => api('/auth/register', { method: 'POST', body });
/** POST /api/auth/verify-email -> verifyEmailController.verifyEmail */
export const verifyEmail = (email, code) => api('/auth/verify-email', { method: 'POST', body: { email, code } });
/** POST /api/auth/resend-code -> verifyEmailController.resendCode */
export const resendCode = (email) => api('/auth/resend-code', { method: 'POST', body: { email } });
/** POST /api/auth/login -> loginController.login (returns { token, user }) */
export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } });
/** GET /api/auth/me -> loginController.me (who am I? used to restore a session on page load) */
export const me = () => api('/auth/me');
/** POST /api/auth/forgot-password -> passwordController.forgotPassword */
export const forgotPassword = (email) => api('/auth/forgot-password', { method: 'POST', body: { email } });
/** POST /api/auth/reset-password -> passwordController.resetPassword */
export const resetPassword = (token, password) => api('/auth/reset-password', { method: 'POST', body: { token, password } });
