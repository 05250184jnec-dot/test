/**
 * middleware/validate.js - runs zod schemas on body/query/params BEFORE the controller.
 * Parsed (trimmed, coerced, defaulted) values land in req.valid.*; controllers only ever
 * read req.valid, never raw req.body. Failure -> 400 with per-field messages.
 */
export const validate = (schemas) => (req, res, next) => {
  req.valid = {};
  const errors = {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const r = schemas[part].safeParse(req[part] ?? {});
    if (r.success) req.valid[part] = r.data;
    else for (const i of r.error.issues) errors[i.path.join('.') || part] = errors[i.path.join('.') || part] || i.message;
  }
  if (Object.keys(errors).length) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields', errors });
  next();
};
