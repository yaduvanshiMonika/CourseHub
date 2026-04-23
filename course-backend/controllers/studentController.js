const db = require('../config/db');

const getStudentIdFromRequest = (req) => {
  return req.user?.id || req.user?.userId || null;
};

const calculateProgress = (completedLectures, totalLectures) => {
  if (!totalLectures || totalLectures <= 0) return 0;
  const percent = Math.round((completedLectures / totalLectures) * 100);
  return percent > 100 ? 100 : percent;
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
        COUNT(cc.id) AS total_lessons,
        COALESCE(cp.completed_items, 0) AS completed_lessons,
        COALESCE(cp.progress_percentage, 0) AS progress_percent
      FROM enrollments e
      INNER JOIN courses c ON c.id = e.course_id
      LEFT JOIN course_contents cc ON cc.course_id = c.id
      LEFT JOIN course_progress cp
        ON cp.user_id = e.user_id AND cp.course_id = e.course_id
      WHERE e.user_id = ?
        AND e.status = 'active'
      GROUP BY
        e.id, e.status, e.enrolled_at,
        c.id, c.title, c.category, c.instructor, c.thumbnail_url, c.price, c.description,
        cp.completed_items, cp.progress_percentage
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

    const lessons = groupLessons(lessonsRaw);

    const [progressRows] = await db.query(
      `
      SELECT id, user_id, course_id, completed_items, progress_percentage
      FROM course_progress
      WHERE user_id = ? AND course_id = ?
      LIMIT 1
      `,
      [studentId, courseId]
    );

    const progressData = progressRows.length > 0
      ? progressRows[0]
      : { completed_items: 0, progress_percentage: 0 };

    return res.status(200).json({
      success: true,
      message: 'Learning page fetched successfully.',
      data: {
        course: courseRows[0],
        lessons,
        total_lessons: lessons.length,
        completed_lessons: Number(progressData.completed_items || 0),
        progress_percent: Number(progressData.progress_percentage || 0)
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
      SELECT id, course_id, title
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

    const [totalRows] = await db.query(
      `
      SELECT COUNT(*) AS totalLessons
      FROM course_contents
      WHERE course_id = ?
      `,
      [lesson.course_id]
    );

    const totalLessons = Number(totalRows[0]?.totalLessons || 0);

    const [progressRows] = await db.query(
      `
      SELECT id, completed_items, progress_percentage
      FROM course_progress
      WHERE user_id = ? AND course_id = ?
      LIMIT 1
      `,
      [studentId, lesson.course_id]
    );

    let completedLectures = 0;

    if (progressRows.length === 0) {
      completedLectures = totalLessons > 0 ? 1 : 0;
      const progressPercent = calculateProgress(completedLectures, totalLessons);

      await db.query(
        `
        INSERT INTO course_progress (user_id, course_id, completed_items, progress_percentage)
        VALUES (?, ?, ?, ?)
        `,
        [studentId, lesson.course_id, completedLectures, progressPercent]
      );

      await db.query(
        `
        UPDATE enrollments
        SET status = ?
        WHERE user_id = ? AND course_id = ?
        `,
        [progressPercent >= 100 ? 'completed' : 'in_progress', studentId, lesson.course_id]
      );

      return res.status(200).json({
        success: true,
        message: 'Lecture marked as complete.',
        data: {
          course_id: lesson.course_id,
          content_id: Number(contentId),
          completed_lessons: completedLectures,
          total_lessons: totalLessons,
          progress_percent: progressPercent,
          enrollment_status: progressPercent >= 100 ? 'completed' : 'in_progress'
        }
      });
    }

    completedLectures = Number(progressRows[0].completed_items || 0);

    if (completedLectures < totalLessons) {
      completedLectures += 1;
    }

    const progressPercent = calculateProgress(completedLectures, totalLessons);

    await db.query(
      `
      UPDATE course_progress
      SET completed_items = ?, progress_percentage = ?
      WHERE id = ?
      `,
      [completedLectures, progressPercent, progressRows[0].id]
    );

    const enrollmentStatus = progressPercent >= 100 ? 'completed' : 'in_progress';

    await db.query(
      `
      UPDATE enrollments
      SET status = ?
      WHERE user_id = ? AND course_id = ?
      `,
      [enrollmentStatus, studentId, lesson.course_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Lecture marked as complete.',
      data: {
        course_id: lesson.course_id,
        content_id: Number(contentId),
        completed_lessons: completedLectures,
        total_lessons: totalLessons,
        progress_percent: progressPercent,
        enrollment_status: enrollmentStatus
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

    const [totalRows] = await db.query(
      `
      SELECT COUNT(*) AS totalLessons
      FROM course_contents
      WHERE course_id = ?
      `,
      [courseId]
    );

    const [progressRows] = await db.query(
      `
      SELECT completed_items, progress_percentage
      FROM course_progress
      WHERE user_id = ? AND course_id = ?
      LIMIT 1
      `,
      [studentId, courseId]
    );

    const totalLessons = Number(totalRows[0]?.totalLessons || 0);
    const completedLessons = progressRows.length > 0
      ? Number(progressRows[0].completed_items || 0)
      : 0;

    const progressPercent = progressRows.length > 0
      ? Number(progressRows[0].progress_percentage || 0)
      : 0;

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
        AND status = 'active'
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
   downloadLessonPdf
};

