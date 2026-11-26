/**
 * profileApi.js - HTTP calls to save the profile and change the password.
 * FRONTEND: API layer of the "profile" feature, used by pages/Profile.jsx.
 * TALKS TO (backend): /api/auth/profile and /api/auth/change-password -> routes/authRoutes.js -> profileController.js, passwordController.js
 * HOW IT WORKS: both are signed-in requests (the JWT is added by apiClient.js).
 */
import { api } from '../../shared/api/apiClient.js';

/** PUT /api/auth/profile -> profileController.updateProfile (returns the updated user) */
export const updateProfile = (body) => api('/auth/profile', { method: 'PUT', body });
/** POST /api/auth/change-password -> passwordController.changePassword */
export const changePassword = (body) => api('/auth/change-password', { method: 'POST', body });
