/**
 * models/certificateModel.js - SQL for the `certificates` table (issued when an employer approves finished work).
 *
 * LAYER: MODEL.
 * The student name / task title / organization are COPIED into the certificate row on purpose,
 * so the certificate stays correct even if the task is edited or deleted later.
 * Used by: employerApplicationController (create), certificateController (list, download, public verify)
 */
import { q, run, one } from '../config/db.js';

export const certificateModel = {
  create: (c, conn) => run(
    'INSERT INTO certificates (cert_code, application_id, student_id, employer_id, task_id, student_name, task_title, organization, start_date, end_date, rating) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [c.code, c.applicationId, c.studentId, c.employerId, c.taskId, c.studentName, c.taskTitle, c.organization, c.startDate, c.endDate, c.rating], conn),
  forStudent: (studentId) => q('SELECT id, cert_code AS certCode, task_title AS taskTitle, organization, start_date AS startDate, end_date AS endDate, rating, issued_at AS issuedAt FROM certificates WHERE student_id=? ORDER BY issued_at DESC', [studentId]),
  byId: (id) => one('SELECT * FROM certificates WHERE id=?', [id]),
  // Public lookup: returns only fields that are fine for anybody to see (no ids, no e-mails).
  byCode: (code) => one('SELECT cert_code, student_name, task_title, organization, start_date, end_date, rating, issued_at FROM certificates WHERE cert_code=?', [code]),
};
