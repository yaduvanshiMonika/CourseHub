-- Run once: links Contact Us rows to a student user so the student panel can match reliably.
-- Example:  mysql -u... -p yourdb < course-backend/sql/migrations/20260427_contacts_user_id.sql

ALTER TABLE contacts
  ADD COLUMN user_id INT UNSIGNED NULL DEFAULT NULL AFTER message;

CREATE INDEX idx_contacts_user_id ON contacts (user_id);

-- Optional backfill: attach existing messages where email matches a student account
-- UPDATE contacts c
-- INNER JOIN users u
--   ON LOWER(TRIM(c.email)) = LOWER(TRIM(u.email)) AND u.role = 'student'
-- SET c.user_id = u.id
-- WHERE c.user_id IS NULL;
