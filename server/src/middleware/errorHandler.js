/**
 * middleware/errorHandler.js - one place that turns errors into JSON.
 * Security: in production NEVER leak stack traces or SQL error text; log them server-side only.
 */
import { config } from '../config/env.js';

export const notFoundHandler = (req, res) => res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.status && err.code) {
    return res.status(err.status).json({ success: false, code: err.code, message: err.message, ...err.extra });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, code: 'INVALID_JSON', message: 'Malformed JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ success: false, code: 'TOO_LARGE', message: 'Request body too large' });
  if (err.errno === 1062) return res.status(409).json({ success: false, code: 'DUPLICATE', message: 'That record already exists' });
  if (err.message === 'CORS_BLOCKED') return res.status(403).json({ success: false, code: 'CORS', message: 'Origin not allowed' });
  console.error('[error]', req.method, req.originalUrl, err);
  res.status(500).json({ success: false, code: 'SERVER_ERROR', message: config.isProd ? 'Something went wrong' : String(err.message) });
}
