/**
 * controllers/profileController.js - UPDATE MY PROFILE (name, phone, bio, college or organization).
 *
 * LAYER: CONTROLLER.
 * ROUTE:  PUT /api/auth/profile       (routes/authRoutes.js)
 * FRONTEND: client/src/features/profile/pages/Profile.jsx -> profileApi.updateProfile()
 *
 * The user id comes from the JWT (req.user.id), NEVER from the request body, so you can only edit yourself.
 */
import { userModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const updateProfile = asyncHandler(async (req, res) => {
  await userModel.updateProfile(req.user.id, req.valid.body, req.user.role);
  return ok(res, await userModel.findPublicById(req.user.id), 'Profile saved');
});
