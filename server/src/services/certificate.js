/**
 * services/certificate.js - draws the experience certificate PDF with pdfkit (A4 landscape).
 * Includes the InternHive logo, student, task, organization, dates, rating, unique ID and verify URL.
 */
import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';

const logo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'logo.png');
const BLUE = '#5F5AF6', GOLD = '#F5B014', INK = '#1f2040', MUTED = '#6b6b8a';
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function streamCertificate(res, c) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: `InternHive Certificate ${c.cert_code}` } });
  doc.pipe(res);
  const W = doc.page.width, H = doc.page.height;
  doc.rect(0, 0, W, H).fill('#ffffff');
  doc.lineWidth(10).strokeColor(BLUE).rect(20, 20, W - 40, H - 40).stroke();
  doc.lineWidth(2).strokeColor(GOLD).rect(36, 36, W - 72, H - 72).stroke();
  doc.image(logo, W / 2 - 55, 52, { fit: [110, 100], align: 'center' });
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(30).text('CERTIFICATE OF EXPERIENCE', 0, 160, { align: 'center' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(13).text('This is to certify that', 0, 205, { align: 'center' });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(34).text(c.student_name, 60, 228, { align: 'center', width: W - 120 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(13).text('successfully completed the task', 0, 280, { align: 'center' });
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(22).text(`"${c.task_title}"`, 60, 302, { align: 'center', width: W - 120 });
  doc.fillColor(INK).font('Helvetica').fontSize(14).text(`for ${c.organization}`, 0, 340, { align: 'center' });
  doc.fillColor(MUTED).fontSize(12).text(`${fmt(c.start_date)}  -  ${fmt(c.end_date)}   |   Employer rating: ${'★'.repeat(0)}${c.rating} / 5`, 0, 368, { align: 'center' });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(`Certificate ID: ${c.cert_code}`, 0, H - 105, { align: 'center' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(10)
    .text(`Verify at: ${config.CLIENT_URL.replace(/\/$/, '')}/verify/${c.cert_code}`, 0, H - 88, { align: 'center' })
    .text(`Issued ${fmt(c.issued_at)}  •  InternHive - Bridging the gap between education and employment`, 0, H - 70, { align: 'center' });
  doc.end();
}
