/**
 * services/mailTemplates.js - HTML + plain-text e-mail templates.
 * SECURITY: every dynamic value goes through e() (escapeHtml). Links are built from server config +
 * encodeURIComponent, never from raw user text.
 */
import { escapeHtml as e } from '../utils/escapeHtml.js';
import { config } from '../config/env.js';

const url = (path) => `${config.CLIENT_URL.replace(/\/$/, '')}${path}`;
const shell = (title, bodyHtml, cta) => `<!doctype html><html><body style="margin:0;background:#f4f4fb;font-family:Arial,sans-serif;color:#1f2040">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#5F5AF6;padding:18px 28px;color:#fff;font-size:22px;font-weight:700">Intern<span style="color:#F5B014">Hive</span></td></tr>
<tr><td style="padding:28px"><h2 style="margin:0 0 12px;color:#5F5AF6">${e(title)}</h2>${bodyHtml}
${cta ? `<p style="margin:24px 0 0"><a href="${e(cta.href)}" style="background:#5F5AF6;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;display:inline-block">${e(cta.label)}</a></p>` : ''}
</td></tr><tr><td style="padding:14px 28px;font-size:12px;color:#8a8aa8">Bridging the gap between education and employment.</td></tr>
</table></td></tr></table></body></html>`;
const p = (s) => `<p style="line-height:1.55;margin:0 0 10px">${s}</p>`;
const build = (subject, title, html, text, cta) => ({ subject, html: shell(title, html, cta), text: `${title}\n\n${text}${cta ? `\n\n${cta.label}: ${cta.href}` : ''}\n\n- InternHive` });

export const templates = {
  verifyCode: ({ name, code }) => build('Your InternHive verification code', 'Verify your e-mail',
    p(`Hi ${e(name)}, use this code to verify your e-mail. It expires in 10 minutes.`) + `<p style="font-size:34px;letter-spacing:8px;font-weight:700;color:#5F5AF6;margin:14px 0">${e(code)}</p>` + p('If you did not sign up, ignore this e-mail.'),
    `Hi ${name}, your verification code is ${code}. It expires in 10 minutes.`),
  accountExists: ({ name }) => build('You already have an InternHive account', 'Account already exists',
    p(`Hi ${e(name)}, someone tried to register with this e-mail. You already have an account, so just sign in or reset your password.`),
    `Hi ${name}, you already have an account. Sign in or reset your password.`, { label: 'Sign in', href: url('/signin') }),
  approved: ({ name }) => build('Your InternHive account is approved', 'Welcome aboard!',
    p(`Hi ${e(name)}, an admin approved your registration. You can sign in now.`), `Hi ${name}, your registration was approved.`, { label: 'Sign in', href: url('/signin') }),
  rejected: ({ name, reason }) => build('Update on your InternHive registration', 'Registration not approved',
    p(`Hi ${e(name)}, unfortunately your registration was not approved.`) + p(`<b>Reason:</b> ${e(reason || 'Not specified')}`), `Hi ${name}, your registration was not approved. Reason: ${reason || 'Not specified'}`),
  passwordReset: ({ name, token }) => build('Reset your InternHive password', 'Password reset',
    p(`Hi ${e(name)}, click the button to choose a new password. The link works once and expires in 30 minutes.`) + p('If you did not ask for this, ignore this e-mail.'),
    `Hi ${name}, reset your password (valid 30 minutes).`, { label: 'Reset password', href: url(`/reset-password?token=${encodeURIComponent(token)}`) }),
  applicationReceived: ({ employer, student, task }) => build(`New application: ${task}`, 'New application received',
    p(`Hi ${e(employer)}, <b>${e(student)}</b> applied for <b>${e(task)}</b>.`), `Hi ${employer}, ${student} applied for ${task}.`, { label: 'Review applicants', href: url('/employer/applications') }),
  applicationDecision: ({ student, task, accepted, organization }) => build(accepted ? `Accepted: ${task}` : `Application update: ${task}`, accepted ? 'You were accepted!' : 'Application update',
    p(`Hi ${e(student)}, ${accepted ? `${e(organization)} accepted your application for <b>${e(task)}</b>. You can now do the work and submit it.` : `${e(organization)} did not select your application for <b>${e(task)}</b>. Keep applying!`}`),
    `Hi ${student}, your application for ${task} was ${accepted ? 'accepted' : 'not selected'}.`, { label: 'Open my applications', href: url('/student/applications') }),
  workSubmitted: ({ employer, student, task }) => build(`Work submitted: ${task}`, 'Work ready for review',
    p(`Hi ${e(employer)}, <b>${e(student)}</b> submitted work for <b>${e(task)}</b>.`), `Hi ${employer}, ${student} submitted work for ${task}.`, { label: 'Review work', href: url('/employer/review') }),
  revisionRequested: ({ student, task, note }) => build(`Changes requested: ${task}`, 'Changes requested',
    p(`Hi ${e(student)}, the employer asked for changes on <b>${e(task)}</b>:`) + p(`<i>${e(note)}</i>`), `Hi ${student}, changes requested on ${task}: ${note}`, { label: 'Resubmit work', href: url('/student/applications') }),
  certificateReady: ({ student, task, certCode }) => build(`Certificate ready: ${task}`, 'Your certificate is ready',
    p(`Congratulations ${e(student)}! You completed <b>${e(task)}</b>. Certificate ID: <b>${e(certCode)}</b>.`), `Congratulations ${student}! Certificate ID ${certCode}.`, { label: 'Download certificate', href: url('/student/certificates') }),
};
