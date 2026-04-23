-- webinar_requests: confirmed session details (run once on course_db)
-- Preferred date stays on the original request; these fields hold the agreed slot + join info.

ALTER TABLE webinar_requests
  ADD COLUMN scheduled_start DATETIME NULL DEFAULT NULL AFTER preferred_date,
  ADD COLUMN scheduled_end   DATETIME NULL DEFAULT NULL AFTER scheduled_start,
  ADD COLUMN meeting_link    VARCHAR(512) NULL DEFAULT NULL AFTER scheduled_end,
  ADD COLUMN meeting_notes   TEXT NULL AFTER meeting_link;

-- Rollback (if needed):
-- ALTER TABLE webinar_requests
--   DROP COLUMN meeting_notes,
--   DROP COLUMN meeting_link,
--   DROP COLUMN scheduled_end,
--   DROP COLUMN scheduled_start;
