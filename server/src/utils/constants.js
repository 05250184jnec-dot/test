/** utils/constants.js - shared allow-lists (single source of truth for validators + SQL). */
export const ROLES = ['student', 'employer', 'admin'];
export const USER_STATUSES = ['pending_verification', 'pending_approval', 'approved', 'rejected'];
export const TASK_STATUSES = ['draft', 'active', 'pending_review', 'completed'];
export const APP_STATUSES = ['applied', 'accepted', 'rejected', 'submitted', 'completed'];
export const CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Data', 'Research', 'Support', 'Other'];
export const CODE_TTL_MIN = 10;
export const CODE_MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SEC = 60;
export const RESET_TTL_MIN = 30;
export const BCRYPT_COST = 12; // bcrypt work factor: higher = slower to brute-force (and slower to log in)
