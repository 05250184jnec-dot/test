/**
 * apiClient.js - the ONE place in the whole client that calls fetch() on our server.
 * FRONTEND: shared helper. Every features/<name>/<name>Api.js file calls api() from here.
 * TALKS TO (backend): any /api/... route (Express app in server/src/app.js).
 * HOW IT WORKS: api() attaches the JWT from localStorage, sends JSON, and unwraps the
 * { success, data, message } reply the server always sends. On 401 it fires an "ih:logout"
 * event (auto sign-out); on 429 it fires "ih:ratelimit" (the banner shows a countdown).
 * SECURITY: React escapes all output and we never use dangerouslySetInnerHTML anywhere.
 */
const TOKEN_KEY = 'ih_token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } };

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Something went wrong');
    this.status = status; this.code = body?.code; this.errors = body?.errors; this.retryAfter = body?.retryAfter; this.extra = body;
  }
}

/** Turns { page: 2, search: 'x' } into "?page=2&search=x" (skips empty values). */
export const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export async function api(path, { method = 'GET', body, params } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`/api${path}${qs(params)}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, { code: 'NETWORK', message: 'Cannot reach the server. Check your connection.' });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new CustomEvent('ih:logout'));
    if (res.status === 429) window.dispatchEvent(new CustomEvent('ih:ratelimit', { detail: { retryAfter: json.retryAfter || Number(res.headers.get('Retry-After')) || 60, message: json.message } }));
    throw new ApiError(res.status, json);
  }
  return json.data ?? json;
}

/** Download a protected file (certificate PDF) with the auth header, then save it. */
export async function downloadFile(path, filename) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
