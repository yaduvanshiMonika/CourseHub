-- Tracks which course_content (video) rows a student marked complete — progress = completed / total videos.
CREATE TABLE IF NOT EXISTS student_lesson_completions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  content_id INT NOT NULL,
  completed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_content (user_id, content_id),
  KEY idx_user_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
