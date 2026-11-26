/** utils/httpError.js - typed error carrying an HTTP status + machine code. */
export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}
export const notFound = (what = 'Resource') => new HttpError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (code, msg) => new HttpError(409, code, msg);
export const forbidden = (msg = 'You do not have permission to do that') => new HttpError(403, 'FORBIDDEN', msg);
