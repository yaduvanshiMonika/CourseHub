const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authorize = require('../middleware/authMiddleware');
const multer = require('multer');
const { getYouTubeThumbnail } = require('../utils/thumbnailHelper');
const uploadPdfMemory = require('../middleware/uploadMiddleware');
const adminContent = require('../controllers/adminContentController');
// ✅ FIXED IMPORTS
// 1. Get the actual function from your middleware file
const authFile = require('../middleware/authMiddleware');
const verifyToken = authFile.verifyToken || authFile;


// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'), 
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- GET COURSES ---
router.get('/courses', async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM courses  ORDER BY id DESC"
        );
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching courses" });
    }
});

// --- ADD COURSE (Maps to 'image' column) ---
router.post('/courses/add', upload.single('file'), async (req, res) => {
    const {
      title,
      category,
      instructor,
      teacher_id,
      status,
      validity_days,
      price,
      level,
      description,
      video_link,
      pdf_link,
      thumbnailUrl
    } = req.body;
    
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
    INSERT INTO courses
      (title, category, instructor, teacher_id, image, status, validity_days, price, level, description, video_link, pdf_link, thumbnail_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        const vd = Number(validity_days) === 180 ? 180 : 90;
        const allowedLevels = ['beginner', 'intermediate', 'advanced'];
        const finalLevel = allowedLevels.includes(level) ? level : 'beginner';
        const finalPrice = price ? Number(price) : 0;
        let finalThumb = (thumbnailUrl && String(thumbnailUrl).trim()) ? String(thumbnailUrl).trim() : null;
        if (!finalThumb && video_link && String(video_link).trim()) {
          finalThumb = getYouTubeThumbnail(String(video_link).trim());
        }

        // If teacher_id is provided, prefer teacher name as instructor
        let finalTeacherId = teacher_id ? Number(teacher_id) : null;
        let finalInstructor = instructor;
        if (finalTeacherId) {
          const [trows] = await db.query("SELECT id, name FROM users WHERE id = ? AND role = 'teacher' LIMIT 1", [finalTeacherId]);
          if (trows.length) finalInstructor = trows[0].name;
          else finalTeacherId = null;
        }

        await db.query(sql, [
          title,
          category,
          finalInstructor,
          finalTeacherId,
          filePath,
          status || 'draft',
          vd,
          finalPrice,
          finalLevel,
          description || null,
          video_link || null,
          pdf_link || null,
          // Priority: explicit thumbnailUrl > YouTube derived thumbnail > uploaded file path
          finalThumb || filePath
        ]);
        res.json({ message: "Course saved successfully! ✅" });
        console.log("BODY:", req.body);

    } catch (err) {
        console.error("SQL Error:", err.message);
        res.status(500).json({ message: "Database Error", error: err.message });
    }
    
});
// ==============================
// 🎬 COURSE CONTENT (same capabilities as teacher panel)
// ==============================
router.get(
    '/course-content/:courseId',
    authorize(['admin']),
    adminContent.listCourseContents
);
router.post(
    '/courses/:courseId/contents',
    authorize(['admin']),
    uploadPdfMemory.single('pdf'),
    adminContent.addCourseContents
);
router.put(
    '/contents/:contentId',
    authorize(['admin']),
    uploadPdfMemory.single('pdf'),
    adminContent.updateCourseContent
);
router.delete(
    '/course-content/:id',
    authorize(['admin']),
    adminContent.deleteCourseContent
);
router.get(
    '/content/pdf/:contentId',
    authorize(['admin']),
    adminContent.getContentPdf
);
// ==============================
// 🗑️ DELETE COURSE CONTENT
// ==============================
// ==============================
// 🗑️ DELETE COURSE
// ==============================
router.delete('/courses/:id', authorize(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        console.log("DELETE COURSE HIT:", id);

        const [result] = await db.query(
            "DELETE FROM courses WHERE id=?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found ❌" });
        }

        res.json({ message: "Course deleted successfully ✅" });

    } catch (err) {
        console.error("DELETE COURSE ERROR:", err);
        res.status(500).json({ message: "Delete failed ❌" });
    }
});
router.get('/teachers', authorize(['admin']), async (req, res) => {
  const [results] = await db.query(
    "SELECT id, name, email, expertise FROM users WHERE role = 'teacher'"
  );
  res.json(results);
});
// ==============================
// ✏️ UPDATE COURSE
// ==============================
router.put('/courses/:id', authorize(['admin']), async (req, res) => {
    const {
      title,
      category,
      instructor,
      teacher_id,
      status,
      validity_days,
      price,
      level,
      description,
      video_link,
      pdf_link,
      thumbnailUrl
    } = req.body;

    try {
        const vd = Number(validity_days) === 180 ? 180 : 90;
        const allowedLevels = ['beginner', 'intermediate', 'advanced'];
        const finalLevel = allowedLevels.includes(level) ? level : 'beginner';
        const finalPrice = price !== undefined ? Number(price) : 0;
        let finalThumb = (thumbnailUrl && String(thumbnailUrl).trim()) ? String(thumbnailUrl).trim() : null;

        // keep existing values when optional fields omitted
        const [existingRows] = await db.query("SELECT teacher_id, instructor, thumbnail_url FROM courses WHERE id=? LIMIT 1", [req.params.id]);
        if (!existingRows.length) return res.status(404).json({ message: "Course not found ❌" });
        const existing = existingRows[0];

        // If thumbnail not explicitly provided, try derive from video link, else keep existing.
        if (!finalThumb && video_link && String(video_link).trim()) {
          finalThumb = getYouTubeThumbnail(String(video_link).trim());
        }

        let finalTeacherId = teacher_id !== undefined && teacher_id !== null && teacher_id !== ''
          ? Number(teacher_id)
          : existing.teacher_id;
        let finalInstructor = instructor || existing.instructor;
        if (finalTeacherId) {
          const [trows] = await db.query("SELECT id, name FROM users WHERE id = ? AND role = 'teacher' LIMIT 1", [finalTeacherId]);
          if (trows.length) finalInstructor = trows[0].name;
        }

        await db.query(
            `UPDATE courses
             SET title=?, category=?, instructor=?, teacher_id=?, status=?, validity_days=?,
                 price=?, level=?, description=?, video_link=?, pdf_link=?, thumbnail_url=?
             WHERE id=?`,
            [
              title,
              category,
              finalInstructor,
              finalTeacherId,
              status || 'draft',
              vd,
              finalPrice,
              finalLevel,
              description || null,
              video_link || null,
              pdf_link || null,
              finalThumb || existing.thumbnail_url,
              req.params.id
            ]
        );

        res.json({ message: "Course updated successfully ✅" });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ message: "Update failed", error: err.message });
    }
});
// ==============================
// 🗑️ DELETE (GENERIC)
// ==============================

// ==============================
// ✏️ UPDATE TEACHER
// ==============================
router.put('/teachers/:id', authorize(['admin']), async (req, res) => {
    const { name, email, expertise } = req.body;

    // ✅ validation
    if (!name || !email || !expertise) {
        return res.status(400).json({ message: "All fields required ❌" });
    }

    try {
        await db.query(
            "UPDATE users SET name=?, email=?, expertise=? WHERE id=?",
            [name, email, expertise, req.params.id]
        );

        res.json({ message: "Teacher updated successfully ✅" });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ message: "Update failed ❌", error: err.message });
    }
});
// ==============================
// 🗑️ DELETE TEACHER

router.delete('/teachers/:id', authorize(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        console.log("DELETE TEACHER HIT:", id);

        await db.query(
            "DELETE FROM users WHERE id=? AND role='teacher'",
            [id]
        );

        res.json({ message: "Teacher deleted successfully ✅" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed ❌" });
    }
});
// ==============================
// 👨‍🎓 GET STUDENTS ONLY
// ==============================
router.get('/users', authorize(['admin']), async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT u.id, u.name, u.email, c.title AS course
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id
            LEFT JOIN courses c ON p.course_id = c.id
            WHERE u.role = 'student'
        `);

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Error fetching students ❌" });
    }
});
router.delete('/users/:id', authorize(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Student deleted successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed ❌" });
  }
});
router.delete('/users/:id', authorize(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Student deleted successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed ❌" });
  }
});

// ==============================
// ➕ ADD TEACHER
// ==============================
router.post('/teachers', authorize(['admin']), async (req, res) => {
    const { name, email, expertise } = req.body;

    // 1. Basic validation
    if (!name || !email || !expertise) {
        return res.status(400).json({ message: "All fields are required ❌" });
    }

    try {
        // 2. Insert into the users table with the role 'teacher'
        // Note: You might want to add a default password or a password field here
        const sql = "INSERT INTO users (name, email, expertise, role) VALUES (?, ?, ?, 'teacher')";
        
        await db.query(sql, [name, email, expertise]);

        res.status(201).json({ message: "Teacher added successfully! ✅" });
    } catch (err) {
        console.error("ADD TEACHER ERROR:", err);
        
        // Handle duplicate email error
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Email already exists ❌" });
        }
        
        res.status(500).json({ message: "Database Error", error: err.message });
    }
});
// ==============================
// ➕ ADD STUDENT (The missing route)
// ==============================
router.post('/users', authorize(['admin']), async (req, res) => {
    const { name, email } = req.body;

    // 1. Basic validation
    if (!name || !email) {
        return res.status(400).json({ message: "Name and Email are required ❌" });
    }

    try {
        // 2. Insert into the users table
        // Note: I'm adding 'student' as the role and '123456' as a default password 
        // so the database doesn't reject it for missing fields.
        const sql = "INSERT INTO users (name, email, role, password) VALUES (?, ?, 'student', '123456')";
        
        await db.query(sql, [name, email]);

        res.status(201).json({ message: "Student added successfully! ✅" });
    } catch (err) {
        console.error("ADD STUDENT ERROR:", err);

        // Handle duplicate email error
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "This email is already in use ❌" });
        }
        
        res.status(500).json({ message: "Database Error", error: err.message });
    }
});
// ==============================
// ✏️ UPDATE STUDENT
// ==============================
router.put('/users/:id', authorize(['admin']), async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: "Name and Email required ❌" });
    }

    try {
        await db.query(
            "UPDATE users SET name=?, email=? WHERE id=? AND role='student'",
            [name, email, req.params.id]
        );

        res.json({ message: "Student updated successfully ✅" });
    } catch (err) {
        console.error("UPDATE STUDENT ERROR:", err);
        res.status(500).json({ message: "Update failed ❌" });
    }
});


// ✅ GENERIC FETCH WITH SPECIAL CASE FOR PAYMENTS

// ✅ UPDATED GENERIC FETCH
router.get('/:table', verifyToken, async (req, res) => {
    const { table } = req.params;
    try {
        let query;
        let params = [];
if (table === 'payments') {
            // Mapping u.name to 'user' so Angular can display it
            // Using COALESCE to show the ID if the name is missing from the users table
         query = `
SELECT 
    e.id,
    u.name AS user,
    c.title AS course,
    COALESCE(p.amount, 0.00) AS amount,
    COALESCE(p.status, 'Pending') AS status
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN courses c ON e.course_id = c.id
LEFT JOIN payments p 
ON e.id = p.enrollment_id 
AND e.course_id = p.course_id
ORDER BY e.id DESC
`;
        }else {
            query = `SELECT * FROM ?? WHERE deleted_at IS NULL`;
            params = [table];
        }

        const [data] = await db.query(query, params);
        res.json(data);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Error fetching data" });
    }
});
module.exports = router;