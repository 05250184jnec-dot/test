/** utils/response.js - ONE JSON shape: { success, data?, code?, message? } */
export const ok = (res, data = null, message, status = 200) =>
  res.status(status).json({ success: true, ...(data !== null && { data }), ...(message && { message }) });
export const page = (res, items, total, p) =>
  ok(res, { items, total, page: p.page, pageSize: p.pageSize, totalPages: Math.max(1, Math.ceil(total / p.pageSize)) });
