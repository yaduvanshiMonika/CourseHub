// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');
// const authorize = require('../middleware/authMiddleware');

// // TEACHER ONLY: Upload video/pdf link
// router.post('/upload-content', authorize(['teacher']), (req, res) => {
//     const { course_id, title, type, url } = req.body;
//     const sql = "INSERT INTO course_contents (course_id, title, type, url) VALUES (?, ?, ?, ?)";

//     db.query(sql, [course_id, title, type, url], (err, result) => {
//         if (err) return res.status(500).json(err);
//         res.json({ message: "Lecture uploaded successfully! ✅" });
//     });
// });

// // THIS LINE IS CRITICAL - DO NOT REMOVE
// module.exports = router;

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  addCourse,
  // addCourseWithPdf,
  getMyCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addCourseContents,
  getCourseContents,
  updateCourseContent,
  deleteCourseContent,
  reorderCourseContents,
  getCourseEnrollments,
  getContentPdf   // 👈 add this line
} = require("../controllers/teacherController");

router.use(authMiddleware(["teacher"]));

// Courses
router.post("/courses", addCourse);
router.get("/courses", getMyCourses);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// router.post(
//   "/courses/:courseId/contents",
//   upload.single("file"),
//   addCourseContents
// );

// router.get("/courses/:courseId/contents", getCourseContents);
// router.put("/courses/:courseId/contents/reorder", reorderCourseContents);

// // Single content item
// router.put("/contents/:contentId", updateCourseContent);
// router.delete("/contents/:contentId", deleteCourseContent);

router.post(
  "/courses/:courseId/contents",
  upload.single("pdf"),
  addCourseContents
);

router.get("/courses/:courseId/contents", getCourseContents);
router.put("/courses/:courseId/contents/reorder", reorderCourseContents);

// Single content item
router.put(
  "/contents/:contentId",
  upload.single("pdf"),
  updateCourseContent
);
router.delete("/contents/:contentId", deleteCourseContent);
router.get("/content/pdf/:contentId", getContentPdf);  // 👈 add this line

// Enrollments
router.get("/courses/:courseId/enrollments", getCourseEnrollments);

module.exports = router;