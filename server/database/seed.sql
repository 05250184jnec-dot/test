-- seed.sql: demo data. 1 admin, 2 employers, 3 students, 5 tasks, sample applications.
-- PASSWORDS: every demo user shares one bcrypt hash. Easiest: `npm run seed` (replaces {{PW_HASH}} with a hash of "Demo@1234").
-- Manual: run `npm run hash -- "YourPassword1"` and replace every {{PW_HASH}} below with the output.
INSERT INTO users (id, role, name, email, password_hash, organization, college, status, email_verified_at) VALUES
 (1,'admin','InternHive Admin','admin@internhive.local','{{PW_HASH}}',NULL,NULL,'approved',UTC_TIMESTAMP()),
 (2,'employer','Tashi Dorji','employer1@demo.com','{{PW_HASH}}','Druk Digital Studio',NULL,'approved',UTC_TIMESTAMP()),
 (3,'employer','Pema Wangmo','employer2@demo.com','{{PW_HASH}}','Thimphu Green Foundation',NULL,'approved',UTC_TIMESTAMP()),
 (4,'student','Karma Choden','student1@demo.com','{{PW_HASH}}',NULL,'Sherubtse College','approved',UTC_TIMESTAMP()),
 (5,'student','Sonam Tenzin','student2@demo.com','{{PW_HASH}}',NULL,'College of Science and Technology','approved',UTC_TIMESTAMP()),
 (6,'student','Dechen Lhamo','student3@demo.com','{{PW_HASH}}',NULL,'Royal Thimphu College','pending_approval',UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO tasks (id, employer_id, title, category, description, duration_days, pay, positions, deadline, status) VALUES
 (1,2,'Design a landing page logo pack','Design','Create a simple logo pack (SVG + PNG) and colour palette for our new landing page.',7,1500,1,DATE_ADD(UTC_DATE(), INTERVAL 30 DAY),'active'),
 (2,2,'Build a React contact form','Development','Build an accessible contact form in React with validation and a success state.',5,2500,2,DATE_ADD(UTC_DATE(), INTERVAL 20 DAY),'active'),
 (3,3,'Write 5 blog posts on waste recycling','Writing','Write five 500-word blog posts about household recycling in Bhutan.',14,3000,1,DATE_ADD(UTC_DATE(), INTERVAL 45 DAY),'active'),
 (4,3,'Survey data entry and cleaning','Data','Clean and tabulate 200 survey responses in a spreadsheet.',3,1000,1,DATE_ADD(UTC_DATE(), INTERVAL 10 DAY),'active'),
 (5,2,'Social media content calendar','Marketing','Plan a 4-week content calendar for our social media pages.',10,2000,1,DATE_ADD(UTC_DATE(), INTERVAL 60 DAY),'draft')
ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO applications (id, task_id, student_id, cover_letter, available_from, status, decided_at, accepted_at) VALUES
 (1,1,4,'I enjoy design and have made posters for my college club. I can start right away.',UTC_DATE(),'accepted',UTC_TIMESTAMP(),UTC_TIMESTAMP()),
 (2,2,4,'I completed a React course and can deliver this quickly.',UTC_DATE(),'applied',NULL,NULL),
 (3,2,5,'Computer science student with two React projects on GitHub.',UTC_DATE(),'applied',NULL,NULL),
 (4,3,5,'I write regularly for the college magazine and care about the environment.',UTC_DATE(),'applied',NULL,NULL)
ON DUPLICATE KEY UPDATE cover_letter=VALUES(cover_letter);
INSERT INTO notifications (user_id, type, title, body, link) VALUES
 (4,'application','Application accepted!','"Design a landing page logo pack"','/student/applications'),
 (2,'application','New application','Karma Choden applied for "Build a React contact form"','/employer/applications');
