const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authorize = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'), 
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- GET COURSES ---
router.get('/courses', authorize(['admin']), async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM courses ORDER BY id DESC");
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Error fetching courses" });
    }
});

// --- ADD COURSE (Maps to 'image' column) ---
router.post('/courses/add', authorize(['admin']), upload.single('file'), async (req, res) => {
    const { title, category, instructor } = req.body;
    
    // Maps file path to 'image' column based on your DESCRIBE screenshot
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    const sql = "INSERT INTO courses (title, category, instructor, image) VALUES (?, ?, ?, ?)";
    
    try {
        await db.query(sql, [title, category, instructor, filePath]);
        res.json({ message: "Course saved successfully! ✅" });
    } catch (err) {
        console.error("SQL Error:", err.message);
        res.status(500).json({ message: "Database Error", error: err.message });
    }
});
// ==============================
// 🎬 GET COURSE CONTENT BY COURSE ID
// ==============================
router.get('/course-content/:courseId', authorize(['admin']), async (req, res) => {
    const { courseId } = req.params;

    try {
        const [results] = await db.query(
            "SELECT * FROM course_contents WHERE course_id = ? ORDER BY position ASC",
            [courseId]
        );

        res.json(results);
    } catch (err) {
        console.error("Fetch content error:", err);
        res.status(500).json({ message: "Error fetching course contents" });
    }
});
// ==============================
// 🗑️ DELETE COURSE CONTENT
// ==============================
router.delete('/course-content/:id', authorize(['admin']), async (req, res) => {
    try {
        console.log("Deleting ID:", req.params.id);

        const [result] = await db.query(
            "DELETE FROM course_contents WHERE id = ?",
            [req.params.id]
        );

        console.log("DB RESULT:", result);

        res.json({ message: "Deleted ✅" });

    } catch (err) {
        console.error("DELETE ERROR:", err); // 🔥 THIS WILL SHOW REAL ERROR
        res.status(500).json({ message: err.message });
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
    const { title, category, instructor } = req.body;

    try {
        await db.query(
            "UPDATE courses SET title=?, category=?, instructor=? WHERE id=?",
            [title, category, instructor, req.params.id]
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
router.delete('/:table/:id', authorize(['admin']), async (req, res) => {
    const { table, id } = req.params;

    try {
        await db.query(`DELETE FROM ${table} WHERE id=?`, [id]);
        res.json({ message: "Deleted successfully ✅" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed ❌" });
    }
});
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
// ==============================
// ==============================
// 🗑️ DELETE TEACHER
// ==============================

// ==============================
// 🗑️ DELETE TEACHER
// ==============================
router.delete('/teachers/:id', authorize(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        console.log("DELETE TEACHER HIT:", id); // 🔥 debug

        const [result] = await db.query(
            "DELETE FROM users WHERE id=? AND role='teacher'",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Teacher not found ❌" });
        }

        res.json({ message: "Teacher deleted successfully ✅" });

    } catch (err) {
        console.error("DELETE ERROR:", err);
        res.status(500).json({ message: "Delete failed ❌" });
    }
});
module.exports = router;