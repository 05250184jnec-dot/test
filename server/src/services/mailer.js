/**
 * services/mailer.js - Nodemailer + DB-backed queue.
 *  - queueMail() NEVER throws and never waits for SMTP: a mail failure can't fail an API request.
 *  - A worker sends pending rows, retrying up to 3 times with exponential backoff (30s, 60s, 120s).
 *  - Gmail: turn on 2-Step Verification, create an "App Password", put it in SMTP_PASS (port 465, secure).
 *  - If SMTP_HOST is empty (dev), the mail is printed to the console and marked sent.
 */
import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { q, run, one } from '../config/db.js';
import { cleanHeader } from '../utils/escapeHtml.js';
import { templates } from './mailTemplates.js';

let transporter = null;
const smtpOn = () => Boolean(config.SMTP_HOST);
function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
      pool: true, maxConnections: 3,
    });
  }
  return transporter;
}
/** Called once at startup: logs whether SMTP works, never crashes the server. */
export async function verifyMailer() {
  if (!smtpOn()) return console.warn('[mail] SMTP_HOST empty: e-mails will be printed to the console (dev mode).');
  try { await getTransport().verify(); console.log('[mail] SMTP ready'); }
  catch (e) { console.error('[mail] SMTP verify failed:', e.message); }
}

/** Queue a template mail. Safe to call without await. */
export async function queueMail(to, template, data) {
  try {
    const m = templates[template](data);
    await run('INSERT INTO mail_queue (to_email, subject, html_body, text_body) VALUES (?,?,?,?)', [to, cleanHeader(m.subject), m.html, m.text]);
    setImmediate(processQueue);
  } catch (e) { console.error('[mail] queue failed:', e.message); }
}

let busy = false;
export async function processQueue() {
  if (busy) return; busy = true;
  try {
    const rows = await q("SELECT * FROM mail_queue WHERE status='pending' AND next_attempt_at <= UTC_TIMESTAMP() ORDER BY id LIMIT 10");
    for (const m of rows) {
      const claim = await run("UPDATE mail_queue SET status='sending' WHERE id=? AND status='pending'", [m.id]); // claim: no double send
      if (!claim.affectedRows) continue;
      try {
        if (smtpOn()) {
          await getTransport().sendMail({ from: config.MAIL_FROM, to: m.to_email, subject: cleanHeader(m.subject), html: m.html_body, text: m.text_body });
        } else console.log(`\n[DEV MAIL] to=${m.to_email}\n${m.subject}\n${m.text_body}\n`);
        await run("UPDATE mail_queue SET status='sent', sent_at=UTC_TIMESTAMP(), attempts=attempts+1 WHERE id=?", [m.id]);
      } catch (err) {
        const attempts = m.attempts + 1;
        const failed = attempts >= 3;
        await run('UPDATE mail_queue SET status=?, attempts=?, last_error=?, next_attempt_at=DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND) WHERE id=?',
          [failed ? 'failed' : 'pending', attempts, String(err.message).slice(0, 500), 30 * 2 ** (attempts - 1), m.id]);
      }
    }
  } catch (e) { console.error('[mail] worker:', e.message); } finally { busy = false; }
}
export async function startMailWorker() {
  await run("UPDATE mail_queue SET status='pending' WHERE status='sending'"); // recover from a crash
  setInterval(processQueue, 10_000).unref();
}
export const mailHealth = () => one("SELECT CAST(COALESCE(SUM(status='pending'),0) AS SIGNED) pending, CAST(COALESCE(SUM(status='sent'),0) AS SIGNED) sent, CAST(COALESCE(SUM(status='failed'),0) AS SIGNED) failed, CAST(COALESCE(MAX(CASE WHEN status='pending' THEN TIMESTAMPDIFF(SECOND, created_at, UTC_TIMESTAMP()) END),0) AS SIGNED) oldestPendingSec FROM mail_queue");
