-- =============================================================================
-- InternHive: complete MySQL schema for TiDB Cloud (MySQL-compatible)
--
-- Run in the TiDB Cloud SQL Editor (Connect dialog > SQL Editor), or with a
-- MySQL client connected via the TiDB host/port/user from the Connect dialog.
--
-- Design notes:
--  * utf8mb4 everywhere so names/emojis/any script are stored safely.
--  * Foreign keys with explicit ON DELETE rules keep the data consistent:
--      CASCADE   -> child rows are meaningless without the parent (codes, notifications)
--      SET NULL  -> keep history even if the parent is removed (audit_log, certificates)
--      RESTRICT  -> forbid deleting a parent that still owns important data
--  * UNIQUE constraints are the real concurrency guard: two students applying at
--    the same instant can never create two rows for the same (task, student).
--  * ENUMs match the status lists in the application code (see utils/constants.js).
--  * Passwords, email codes and reset tokens are stored only as hashes.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS internhive
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE internhive;

-- -----------------------------------------------------------------------------
-- users: one row per account (student | employer | admin)
-- status flow: pending_verification -> pending_approval -> approved | rejected
-- Only `approved` AND suspended = 0 may log in.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role              ENUM('student','employer','admin') NOT NULL,
  name              VARCHAR(100)  NOT NULL,
  email             VARCHAR(190)  NOT NULL,
  password_hash     VARCHAR(100)  NOT NULL,             -- bcrypt hash (cost 12), never plain text
  organization      VARCHAR(150)  NULL,                 -- employers
  college           VARCHAR(150)  NULL,                 -- students
  phone             VARCHAR(30)   NULL,
  bio               VARCHAR(1000) NULL,
  status            ENUM('pending_verification','pending_approval','approved','rejected')
                    NOT NULL DEFAULT 'pending_verification',
  rejection_reason  VARCHAR(500)  NULL,
  suspended         TINYINT(1)    NOT NULL DEFAULT 0,
  suspended_reason  VARCHAR(500)  NULL,
  email_verified_at DATETIME      NULL,
  last_login_at     DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status),
  KEY idx_users_created (created_at),
  KEY idx_users_suspended (suspended)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- email_codes: 6-digit verification code (stored HASHED). One live code per user.
-- `attempts` stops brute force: after 5 wrong guesses the row is deleted.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_codes (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  code_hash    CHAR(64)  NOT NULL,                       -- HMAC-SHA256 hex
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at   DATETIME  NOT NULL,                       -- created + 10 minutes
  last_sent_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 60 s resend cooldown
  created_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email_codes_user (user_id),
  KEY idx_email_codes_expires (expires_at),
  CONSTRAINT fk_email_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- password_resets: single-use reset token (stored HASHED), 30 minute expiry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)  NOT NULL,
  expires_at  DATETIME  NOT NULL,
  used_at     DATETIME  NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_resets_token (token_hash),
  KEY idx_password_resets_user (user_id),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tasks: short-term tasks / internships posted by employers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employer_id   BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(150)  NOT NULL,
  category      VARCHAR(60)   NOT NULL,                 -- validated against an allow-list in code
  description   TEXT          NOT NULL,
  duration_days SMALLINT UNSIGNED NOT NULL,
  pay           DECIMAL(10,2) NOT NULL DEFAULT 0.00,    -- Nu (Ngultrum)
  positions     SMALLINT UNSIGNED NOT NULL DEFAULT 1,   -- how many students can be accepted
  deadline      DATE          NOT NULL,
  status        ENUM('draft','active','pending_review','completed') NOT NULL DEFAULT 'draft',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_status_created (status, created_at),
  KEY idx_tasks_employer (employer_id, status),
  KEY idx_tasks_category (category),
  KEY idx_tasks_deadline (deadline),
  -- RESTRICT: an employer with tasks can't be hard-deleted by accident
  CONSTRAINT fk_tasks_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_tasks_pay CHECK (pay >= 0),
  CONSTRAINT chk_tasks_positions CHECK (positions >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- applications: a student applying to a task.
-- Timeline: applied -> accepted -> submitted -> completed   (or rejected)
-- UNIQUE(task_id, student_id) blocks duplicate applications even under a race.
-- Matched by student_id (NOT by name; names are not unique).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id        BIGINT UNSIGNED NOT NULL,
  student_id     BIGINT UNSIGNED NOT NULL,
  cover_letter   TEXT NOT NULL,
  available_from DATE NOT NULL,
  status         ENUM('applied','accepted','rejected','submitted','completed') NOT NULL DEFAULT 'applied',
  applied_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at     DATETIME NULL,                         -- accepted OR rejected time
  accepted_at    DATETIME NULL,
  submitted_at   DATETIME NULL,
  completed_at   DATETIME NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_application_task_student (task_id, student_id),
  KEY idx_applications_student (student_id, status),
  KEY idx_applications_task_status (task_id, status),
  KEY idx_applications_applied (applied_at),
  CONSTRAINT fk_applications_task    FOREIGN KEY (task_id)    REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- submissions: work handed in by the student (several rows if revisions are requested)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  note           TEXT NOT NULL,
  link           VARCHAR(500) NULL,                      -- optional link / file URL (http/https only, validated)
  status         ENUM('submitted','approved','revision_requested') NOT NULL DEFAULT 'submitted',
  review_note    VARCHAR(1000) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at    DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_submissions_application (application_id, created_at),
  CONSTRAINT fk_submissions_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- feedback: ratings in both directions, one per direction per application
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  from_user_id   BIGINT UNSIGNED NOT NULL,
  to_user_id     BIGINT UNSIGNED NOT NULL,
  direction      ENUM('employer_to_student','student_to_employer') NOT NULL,
  rating         TINYINT UNSIGNED NOT NULL,
  comment        VARCHAR(1500) NOT NULL DEFAULT '',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_feedback_app_direction (application_id, direction),
  KEY idx_feedback_to (to_user_id),
  KEY idx_feedback_from (from_user_id),
  CONSTRAINT fk_feedback_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_from FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_to   FOREIGN KEY (to_user_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- certificates: created in the SAME transaction that marks work completed.
-- Names/titles are copied (snapshot) so a certificate stays valid and verifiable
-- even if the task is later deleted or the user renames themselves.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cert_code      VARCHAR(24) NOT NULL,                   -- public ID, e.g. IH-3FA9C0D17B2E
  application_id BIGINT UNSIGNED NOT NULL,
  student_id     BIGINT UNSIGNED NULL,
  employer_id    BIGINT UNSIGNED NULL,
  task_id        BIGINT UNSIGNED NULL,
  student_name   VARCHAR(100) NOT NULL,
  task_title     VARCHAR(150) NOT NULL,
  organization   VARCHAR(150) NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  rating         TINYINT UNSIGNED NOT NULL,
  issued_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_certificates_code (cert_code),
  UNIQUE KEY uq_certificates_application (application_id),
  KEY idx_certificates_student (student_id),
  KEY idx_certificates_employer (employer_id),
  CONSTRAINT fk_cert_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_cert_student  FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cert_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cert_task     FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- audit_log: who did what, when (admin actions + key security events)
-- actor_name is copied so the log still reads well if the user is deleted.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id    BIGINT UNSIGNED NULL,
  actor_name  VARCHAR(100) NOT NULL,
  action      VARCHAR(60)  NOT NULL,                     -- e.g. user.approve, task.delete
  target_type VARCHAR(30)  NULL,
  target_id   BIGINT UNSIGNED NULL,
  details     VARCHAR(1000) NULL,
  ip          VARCHAR(64)  NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_action (action),
  KEY idx_audit_actor (actor_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- mail_queue: outgoing e-mails. The API never waits for SMTP; a worker sends
-- queued rows, retrying up to 3 times with exponential backoff.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mail_queue (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  to_email        VARCHAR(190) NOT NULL,
  subject         VARCHAR(200) NOT NULL,
  html_body       MEDIUMTEXT NOT NULL,
  text_body       MEDIUMTEXT NOT NULL,
  status          ENUM('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
  attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_error      VARCHAR(500) NULL,
  next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at         DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_mail_status_next (status, next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notifications: in-app bell (also pushed live through Socket.IO)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       VARCHAR(40)  NOT NULL,
  title      VARCHAR(150) NOT NULL,
  body       VARCHAR(400) NOT NULL DEFAULT '',
  link       VARCHAR(200) NULL,                          -- in-app route, e.g. /student/applications
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, is_read, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;