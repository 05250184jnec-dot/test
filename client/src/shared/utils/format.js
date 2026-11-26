/**
 * format.js - small helpers that turn raw values into text for the screen.
 * FRONTEND: shared utility.
 * TALKS TO (backend): none.
 * HOW IT WORKS: dates from the API are ISO strings; these format them (en-GB), format money as "Nu 1,500",
 * count days left to a deadline, and read per-field error messages out of an ApiError.
 */
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const nu = (n) => `Nu ${Number(n || 0).toLocaleString('en-IN')}`;
export const daysLeft = (d) => Math.ceil((new Date(`${String(d).slice(0, 10)}T23:59:59`) - new Date()) / 86400000);
/** Maps server field errors { field: message } onto a form. */
export const fieldErrors = (err) => err?.errors || {};
