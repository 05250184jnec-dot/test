/**
 * utils/query.js - safe pagination / sorting / LIKE helpers.
 * ORDER BY cannot be a `?` placeholder, so we map a validated KEY to a fixed SQL fragment
 * (allow-list). Raw user input never reaches the SQL text.
 */
export function paging({ page = 1, pageSize = 10 } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const p = Math.max(Number(page) || 1, 1);
  return { page: p, pageSize: size, limit: size, offset: (p - 1) * size };
}
/** Merge validated query params with {limit, offset} so models can paginate: withPaging(req.valid.query). */
export const withPaging = (v) => ({ ...v, ...paging(v) });
/** orderBy(map, key, fallbackKey) -> trusted SQL fragment from the allow-list only. */
export const orderBy = (map, key, fallbackKey) => map[key] || map[fallbackKey];
/** Escape % and _ so a search for "100%" is literal, then wrap for LIKE. Value is still bound as a parameter. */
export const like = (s) => `%${String(s).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
/** Build the days array [{day:'YYYY-MM-DD', ...zeroes}] so charts have no gaps. */
export function fillDays(rows, days, keys) {
  const map = new Map(rows.map((r) => [String(r.day), r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const r = map.get(d) || {};
    out.push(Object.fromEntries([['day', d], ...keys.map((k) => [k, Number(r[k] || 0)])]));
  }
  return out;
}
