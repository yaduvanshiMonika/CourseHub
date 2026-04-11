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
    const { title, category, instructor, status } = req.body; // ✅ ADD STATUS
    
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
    INSERT INTO courses (title, category, instructor, image, status)
    VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await db.query(sql, [title, category, instructor, filePath, status || 'draft']); // ✅ USE STATUS
        res.json({ message: "Course saved successfully! ✅" });
        console.log("BODY:", req.body);

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
status
        res.json(results);
    } catch (err) {
        console.error("Fetch content error:", err);
        res.status(500).json({ message: "Error fetching course contents" });
    }
});
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
    const { title, category, instructor, status } = req.body; // ✅ FIX

    try {
        await db.query(
            "UPDATE courses SET title=?, category=?, instructor=?, status=? WHERE id=?",
            [title, category, instructor, status || 'draft', req.params.id]
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

module.exports = router;