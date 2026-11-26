/**
 * utils/escapeHtml.js - XSS / e-mail injection helpers.
 * escapeHtml: every user-supplied value placed in e-mail HTML goes through this
 *   (a name like  <img src=x onerror=...>  becomes harmless text).
 * cleanHeader: strips CR/LF and control chars so nobody can inject extra mail headers
 *   ("Subject: hi\r\nBcc: victim@x.com").
 */
export const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"'`]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
export const cleanHeader = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, 200);
