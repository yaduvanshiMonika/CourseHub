const db = require('../config/db');

const getStudentIdFromRequest = (req) => {
  return req.user?.id || req.user?.userId || null;
};

const calculateProgress = (completedLectures, totalLectures) => {
  if (!totalLectures || totalLectures <= 0) return 0;
  const percent = Math.round((completedLectures / totalLectures) * 100);
  return percent > 100 ? 100 : percent;
};

/** Total video content rows (each counts toward 100% progress). */
const countCourseVideos = async (courseId) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS n FROM course_contents WHERE course_id = ? AND type = 'video'`,
    [courseId]
  );
  return Number(rows[0]?.n || 0);
};

/** How many distinct video contents the student marked complete. */
const countCompletedVideos = async (userId, courseId) => {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS n
    FROM student_lesson_completions slc
    INNER JOIN course_contents cc ON cc.id = slc.content_id AND cc.type = 'video'
    WHERE slc.user_id = ? AND slc.course_id = ?
    `,
    [userId, courseId]
  );
  return Number(rows[0]?.n || 0);
};

/** Keeps course_progress in sync with student_lesson_completions (cache for reports). */
const syncCourseProgressFromCompletions = async (userId, courseId) => {
  const total = await countCourseVideos(courseId);
  const completed = await countCompletedVideos(userId, courseId);
  const progressPercent = calculateProgress(completed, total);

  const [existing] = await db.query(
    `SELECT id FROM course_progress WHERE user_id = ? AND course_id = ? LIMIT 1`,
    [userId, courseId]
  );

  if (existing.length === 0) {
    await db.query(
      `
      INSERT INTO course_progress (user_id, course_id, completed_items, progress_percentage)
      VALUES (?, ?, ?, ?)
      `,
      [userId, courseId, completed, progressPercent]
    );
  } else {
    await db.query(
      `
      UPDATE course_progress
      SET completed_items = ?, progress_percentage = ?
      WHERE id = ?
      `,
      [completed, progressPercent, existing[0].id]
    );
  }

  return { total, completed, progressPercent };
};

const groupLessons = (lessonsRaw) => {
  const lessonsMap = {};

  lessonsRaw.forEach((item) => {
    if (!lessonsMap[item.position]) {
      lessonsMap[item.position] = {
        id: item.id,
        course_id: item.course_id,
        title: item.title,
        position: item.position,
        duration: Number(item.duration || 0),
        video_url: null,
        pdf_name: null,
        pdf_url: null,
        video_id: null,
        pdf_id: null
      };
    }

    if (item.type === 'video') {
      lessonsMap[item.position].video_url = item.url;
      lessonsMap[item.position].video_id = item.id;
      lessonsMap[item.position].id = item.id;
      lessonsMap[item.position].duration = Number(item.duration || 0);
    }
   
   if (item.type === 'pdf') {
  lessonsMap[item.position].pdf_name = item.pdf_name;
  lessonsMap[item.position].pdf_url = `/api/student/content/pdf/${item.id}`;
  lessonsMap[item.position].pdf_id = item.id;

  if (!lessonsMap[item.position].video_id) {
    lessonsMap[item.position].id = item.id;
  }
}
    
  });

  return Object.values(lessonsMap);
};

const getAllCourses = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.id,
        c.title,
        c.category,
        c.instructor,
        c.thumbnail_url AS image,
        c.teacher_id,
        c.price,
        c.status,
        c.video_link,
        c.pdf_link,
        c.description,
        c.created_at,
        COUNT(cc.id) AS total_lessons
      FROM courses c
      LEFT JOIN course_contents cc ON cc.course_id = c.id
      WHERE c.title IS NOT NULL
        AND TRIM(c.title) <> ''
        AND (c.status = 'active' OR c.status = 'published')
      GROUP BY
        c.id, c.title, c.category, c.instructor, c.thumbnail_url, c.teacher_id,
        c.price, c.status, c.video_link, c.pdf_link, c.description, c.created_at
      ORDER BY c.created_at DESC
      `
    );

    return res.status(200).json({
      success: true,
      message: 'Courses fetched successfully.',
      data: rows
    });
  } catch (error) {
    console.error('getAllCourses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses.',
      error: error.message
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const studentId = getStudentIdFromRequest(req);

    const [courseRows] = await db.query(
      `
      SELECT 
        c.id,
        c.title,
        c.category,
        c.instructor,
        c.thumbnail_url AS image,
        c.teacher_id,
        c.price,
        c.status,
        c.video_link,
        c.pdf_link,
        c.description,
        c.created_at
      FROM courses c
      WHERE c.id = ?
      LIMIT 1
      `,
      [courseId]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    const [lessonsRaw] = await db.query(
      `
      SELECT
        id,
        course_id,
        title,
        type,
        url,
        duration,
        position,
        pdf_name
      FROM course_contents
      WHERE course_id = ?
      ORDER BY position ASC, id ASC
      `,
      [courseId]
    );

    const lessons = groupLessons(lessonsRaw);

    let enrollment = null;
    let progress = null;

    if (studentId) {
      const [enrollmentRows] = await db.query(
        `
        SELECT id, user_id, course_id, status, enrolled_at
        FROM enrollments
        WHERE user_id = ? AND course_id = ?
        LIMIT 1
        `,
        [studentId, courseId]
      );

      if (enrollmentRows.length > 0) {
        enrollment = enrollmentRows[0];

        const [progressRows] = await db.query(
          `
          SELECT id, user_id, course_id, completed_items, progress_percentage
          FROM course_progress
          WHERE user_id = ? AND course_id = ?
          LIMIT 1
          `,
          [studentId, courseId]
        );

        progress = progressRows.length > 0 ? progressRows[0] : null;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Course details fetched successfully.',
      data: {
        ...courseRows[0],
        lessons,
        isEnrolled: !!enrollment,
        enrollment,
        progress
      }
    });
  } catch (error) {
    console.error('getCourseDetails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course details.',
      error: error.message
    });
  }
};

const enrollCourse = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [courseRows] = await db.query(
      `SELECT id, title, status FROM courses WHERE id = ? LIMIT 1`,
      [courseId]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    const [existingEnrollment] = await db.query(
      `
      SELECT id, user_id, course_id, status, enrolled_at
      FROM enrollments
      WHERE user_id = ? AND course_id = ?
      LIMIT 1
      `,
      [studentId, courseId]
    );

    if (existingEnrollment.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'You are already enrolled in this course.',
        data: existingEnrollment[0]
      });
    }

    const [enrollResult] = await db.query(
      `
      INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
      VALUES (?, ?, 'enrolled', NOW())
      `,
      [studentId, courseId]
    );

    const [existingProgress] = await db.query(
      `
      SELECT id
      FROM course_progress
      WHERE user_id = ? AND course_id = ?
      LIMIT 1
      `,
      [studentId, courseId]
    );

    if (existingProgress.length === 0) {
      await db.query(
        `
        INSERT INTO course_progress (user_id, course_id, completed_items, progress_percentage)
        VALUES (?, ?, 0, 0)
        `,
        [studentId, courseId]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Course enrolled successfully.',
      data: {
        enrollmentId: enrollResult.insertId,
        user_id: studentId,
        course_id: Number(courseId),
        status: 'enrolled'
      }
    });
  } catch (error) {
    console.error('enrollCourse error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enroll course.',
      error: error.message
    });
  }
};



const getStudentCourses = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        e.id AS enrollment_id,
        e.status AS enrollment_status,
        e.enrolled_at,
        c.id AS course_id,
        c.title,
        c.category,
        c.instructor,
        c.thumbnail_url AS image,
        c.price,
        c.description,
        (
          SELECT COUNT(*)
          FROM course_contents ccv
          WHERE ccv.course_id = c.id AND ccv.type = 'video'
        ) AS total_lessons,
        (
          SELECT COUNT(*)
          FROM student_lesson_completions slc
          INNER JOIN course_contents cc2
            ON cc2.id = slc.content_id AND cc2.type = 'video'
          WHERE slc.user_id = e.user_id AND slc.course_id = c.id
        ) AS completed_lessons,
        COALESCE(
          LEAST(100, ROUND(
            100 * (
              SELECT COUNT(*)
              FROM student_lesson_completions slc
              INNER JOIN course_contents cc2
                ON cc2.id = slc.content_id AND cc2.type = 'video'
              WHERE slc.user_id = e.user_id AND slc.course_id = c.id
            ) / NULLIF(
              (SELECT COUNT(*) FROM course_contents ccv WHERE ccv.course_id = c.id AND ccv.type = 'video'),
              0
            )
          )),
          0
        ) AS progress_percent
      FROM enrollments e
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ?
        AND e.status IN ('active', 'completed', 'in_progress', 'enrolled')
      ORDER BY e.enrolled_at DESC
      `,
      [studentId]
    );

    const formatted = rows.map((course) => {
      let actionLabel = 'Start';

      if (Number(course.progress_percent) > 0 && Number(course.progress_percent) < 100) {
        actionLabel = 'Resume';
      } else if (Number(course.progress_percent) >= 100) {
        actionLabel = 'Completed';
      }

      return {
        ...course,
        total_lessons: Number(course.total_lessons || 0),
        completed_lessons: Number(course.completed_lessons || 0),
        progress_percent: Number(course.progress_percent || 0),
        actionLabel
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Student courses fetched successfully.',
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('getStudentCourses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student courses.',
      error: error.message
    });
  }
};

const getLearningPage = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { id: courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [enrollmentRows] = await db.query(
      `
      SELECT id, user_id, course_id, status, enrolled_at
      FROM enrollments
      WHERE user_id = ? AND course_id = ?
        AND status IN ('active', 'completed', 'in_progress', 'enrolled')
      LIMIT 1
      `,
      [studentId, courseId]
    );

    if (enrollmentRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Please enroll in this course first.'
      });
    }

    const [courseRows] = await db.query(
      `
      SELECT
        id,
        title,
        category,
        instructor,
        thumbnail_url AS image,
        teacher_id,
        price,
        status,
        video_link,
        pdf_link,
        description,
        created_at
      FROM courses
      WHERE id = ?
      LIMIT 1
      `,
      [courseId]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    const [lessonsRaw] = await db.query(
      `
      SELECT
        id,
        course_id,
        title,
        type,
        url,
        duration,
        position,
        pdf_name
      FROM course_contents
      WHERE course_id = ?
      ORDER BY position ASC, id ASC
      `,
      [courseId]
    );

    let lessons = groupLessons(lessonsRaw);

    const totalVideos = await countCourseVideos(courseId);
    const completedVideos = await countCompletedVideos(studentId, courseId);
    const progressPercent = calculateProgress(completedVideos, totalVideos);

    await syncCourseProgressFromCompletions(studentId, courseId);

    const [doneRows] = await db.query(
      `
      SELECT content_id
      FROM student_lesson_completions
      WHERE user_id = ? AND course_id = ?
      `,
      [studentId, courseId]
    );
    const doneSet = new Set((doneRows || []).map((r) => Number(r.content_id)));
    lessons = lessons.map((lesson) => ({
      ...lesson,
      video_completed: lesson.video_id ? doneSet.has(Number(lesson.video_id)) : false
    }));

    return res.status(200).json({
      success: true,
      message: 'Learning page fetched successfully.',
      data: {
        course: courseRows[0],
        lessons,
        total_lessons: totalVideos,
        completed_lessons: completedVideos,
        progress_percent: progressPercent
      }
    });
  } catch (error) {
    console.error('getLearningPage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning page.',
      error: error.message
    });
  }
};

const markLessonComplete = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { contentId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [lessonRows] = await db.query(
      `
      SELECT id, course_id, title, type
      FROM course_contents
      WHERE id = ?
      LIMIT 1
      `,
      [contentId]
    );

    if (lessonRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found.'
      });
    }

    const lesson = lessonRows[0];

    const [enrollmentRows] = await db.query(
      `
      SELECT id, status
      FROM enrollments
      WHERE user_id = ? AND course_id = ?
        AND status IN ('active', 'completed', 'in_progress', 'enrolled')
      LIMIT 1
      `,
      [studentId, lesson.course_id]
    );

    if (enrollmentRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Please enroll in this course first.'
      });
    }

    if (lesson.type !== 'video') {
      return res.status(200).json({
        success: true,
        message: 'Course progress is tracked for videos only.',
        data: {
          course_id: lesson.course_id,
          content_id: Number(contentId),
          skipped: true
        }
      });
    }

    await db.query(
      `
      INSERT IGNORE INTO student_lesson_completions (user_id, course_id, content_id)
      VALUES (?, ?, ?)
      `,
      [studentId, lesson.course_id, Number(contentId)]
    );

    const { total, completed, progressPercent } = await syncCourseProgressFromCompletions(
      studentId,
      lesson.course_id
    );

    return res.status(200).json({
      success: true,
      message: 'Video marked as complete.',
      data: {
        course_id: lesson.course_id,
        content_id: Number(contentId),
        completed_lessons: completed,
        total_lessons: total,
        progress_percent: progressPercent
      }
    });
  } catch (error) {
    console.error('markLessonComplete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update progress.',
      error: error.message
    });
  }
};

const getCourseProgress = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { id: courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const totalLessons = await countCourseVideos(courseId);
    const completedLessons = await countCompletedVideos(studentId, courseId);
    const progressPercent = calculateProgress(completedLessons, totalLessons);

    return res.status(200).json({
      success: true,
      message: 'Course progress fetched successfully.',
      data: {
        course_id: Number(courseId),
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percent: progressPercent
      }
    });
  } catch (error) {
    console.error('getCourseProgress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course progress.',
      error: error.message
    });
  }
};


const getStudentProfile = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [userRows] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        phone,
        bio,
        photo,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [studentId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const [enrolledCountRows] = await db.query(
      `
      SELECT COUNT(*) AS enrolledCourses
      FROM enrollments
      WHERE user_id = ?
        AND status IN ('active', 'completed', 'in_progress', 'enrolled')
      `,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Student profile fetched successfully.',
      data: {
        ...userRows[0],
        enrolledCourses: Number(enrolledCountRows[0]?.enrolledCourses || 0)
      }
    });
  } catch (error) {
    console.error('getStudentProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile.',
      error: error.message
    });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { name, phone, bio } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    await db.query(
      `
      UPDATE users
      SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        bio = COALESCE(?, bio)
      WHERE id = ?
      `,
      [name || null, phone || null, bio || null, studentId]
    );

    const [updatedRows] = await db.query(
      `
      SELECT id, name, email, role, phone, bio, photo, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('updateStudentProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
};

const updateStudentPhoto = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { photo } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    if (!photo || String(photo).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Photo is required.'
      });
    }

    await db.query(
      `
      UPDATE users
      SET photo = ?
      WHERE id = ?
      `,
      [photo, studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Photo updated successfully.',
      data: { photo }
    });
  } catch (error) {
    console.error('updateStudentPhoto error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update photo.',
      error: error.message
    });
  }
};

const getStudentCertificates = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        c.id AS course_id,
        c.title,
        c.category,
        c.instructor,
        e.enrolled_at,
        cp.progress_percentage,
        CONCAT('CERT-', ?, '-', c.id) AS certificate_no
      FROM enrollments e
      INNER JOIN courses c ON c.id = e.course_id
      LEFT JOIN course_progress cp
        ON cp.user_id = e.user_id AND cp.course_id = e.course_id
      WHERE e.user_id = ?
        AND (
          e.status = 'completed'
          OR COALESCE(cp.progress_percentage, 0) >= 100
        )
      ORDER BY c.title ASC
      `,
      [studentId, studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Certificates fetched successfully.',
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getStudentCertificates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates.',
      error: error.message
    });
  }
};

const downloadCertificate = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        u.name AS student_name,
        u.email,
        c.id AS course_id,
        c.title AS course_title,
        c.instructor,
        COALESCE(cp.progress_percentage, 0) AS progress_percent
      FROM enrollments e
      INNER JOIN users u ON u.id = e.user_id
      INNER JOIN courses c ON c.id = e.course_id
      LEFT JOIN course_progress cp
        ON cp.user_id = e.user_id AND cp.course_id = e.course_id
      WHERE e.user_id = ?
        AND e.course_id = ?
      LIMIT 1
      `,
      [studentId, courseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course record not found.'
      });
    }

    if (Number(rows[0].progress_percent) < 100) {
      return res.status(400).json({
        success: false,
        message: 'Certificate not available. Complete the course first.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Certificate data ready.',
      data: {
        certificate_no: `CERT-${studentId}-${courseId}`,
        issued_to: rows[0].student_name,
        email: rows[0].email,
        course_id: rows[0].course_id,
        course_title: rows[0].course_title,
        instructor: rows[0].instructor,
        issued_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('downloadCertificate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to prepare certificate.',
      error: error.message
    });
  }
};


const downloadLessonPdf = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    const { contentId } = req.params;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized student.'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        cc.id,
        cc.course_id,
        cc.pdf_name,
        cc.pdf_data
      FROM course_contents cc
      INNER JOIN enrollments e
        ON e.course_id = cc.course_id
      WHERE cc.id = ?
        AND cc.type = 'pdf'
        AND e.user_id = ?
        AND e.status IN ('active', 'completed', 'in_progress', 'enrolled')
      LIMIT 1
      `,
      [contentId, studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found or access denied.'
      });
    }

    const pdf = rows[0];

    if (!pdf.pdf_data) {
      return res.status(404).json({
        success: false,
        message: 'PDF file data not found.'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${pdf.pdf_name || 'lesson.pdf'}"`
    );

    return res.send(pdf.pdf_data);
  } catch (error) {
    console.error('downloadLessonPdf error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to open PDF.',
      error: error.message
    });
  }
};

/**
 * List Contact Us messages sent with the same email as this student account
 * (admin inbox in /api/contacts; this returns reply + status when the admin has replied).
 */
const getMyContactMessages = async (req, res) => {
  try {
    const studentId = getStudentIdFromRequest(req);
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized student.' });
    }

    const [userRows] = await db.query(
      `SELECT email FROM users WHERE id = ? AND role = 'student' LIMIT 1`,
      [studentId]
    );
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const userEmail = String(userRows[0].email || '').trim();
    if (!userEmail) {
      return res.status(200).json({ success: true, data: [] });
    }

    const norm = userEmail.toLowerCase();

    let rows;
    try {
      // user_id: rows created while logged in as this student. Email: legacy + guests.
      [rows] = await db.query(
        `SELECT * FROM contacts
         WHERE user_id = ? OR LOWER(TRIM(COALESCE(email, ''))) = ?
         ORDER BY id DESC`,
        [studentId, norm]
      );
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR' || (e.message && String(e.message).includes('user_id'))) {
        [rows] = await db.query(
          `SELECT * FROM contacts
           WHERE LOWER(TRIM(COALESCE(email, ''))) = ?
           ORDER BY id DESC`,
          [norm]
        );
      } else {
        throw e;
      }
    }

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('getMyContactMessages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load messages.',
      error: error.message
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseDetails,
  enrollCourse,
  getStudentCourses,
  getLearningPage,
  markLessonComplete,
  getCourseProgress,
  getStudentProfile,
  updateStudentProfile,
  updateStudentPhoto,
  getStudentCertificates,
  downloadCertificate,
  downloadLessonPdf,
  getMyContactMessages
};

