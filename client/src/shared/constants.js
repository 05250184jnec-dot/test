/**
 * constants.js - lists the UI needs in more than one place.
 * FRONTEND: shared. Must match server/src/utils/constants.js (the server is the source of truth and re-validates).
 * TALKS TO (backend): none.
 * HOW IT WORKS: import these instead of retyping them, so a dropdown and a filter never disagree.
 */
export const CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Data', 'Research', 'Support', 'Other'];
export const TASK_STATUSES = ['draft', 'active', 'pending_review', 'completed'];
export const APP_STATUSES = ['applied', 'accepted', 'rejected', 'submitted', 'completed'];
