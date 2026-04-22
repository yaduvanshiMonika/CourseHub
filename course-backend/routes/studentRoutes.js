const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/content/pdf/:contentId', authMiddleware(['student']), studentController.downloadLessonPdf);

// Public / optional
router.get('/courses', studentController.getAllCourses);
router.get('/courses/:id', studentController.getCourseDetails);

// Protected student routes
router.post('/enroll/:courseId', authMiddleware(['student']), studentController.enrollCourse);
router.get('/student-courses', authMiddleware(['student']), studentController.getStudentCourses);

router.get('/course/:id/learn', authMiddleware(['student']), studentController.getLearningPage);
router.post('/lesson/:contentId/complete', authMiddleware(['student']), studentController.markLessonComplete);
router.get('/course/:id/progress', authMiddleware(['student']), studentController.getCourseProgress);

router.get('/profile', authMiddleware(['student']), studentController.getStudentProfile);
router.put('/profile', authMiddleware(['student']), studentController.updateStudentProfile);
router.put('/profile/photo', authMiddleware(['student']), studentController.updateStudentPhoto);

router.get('/certificates', authMiddleware(['student']), studentController.getStudentCertificates);
router.get('/certificate/:courseId/download', authMiddleware(['student']), studentController.downloadCertificate);

module.exports = router;