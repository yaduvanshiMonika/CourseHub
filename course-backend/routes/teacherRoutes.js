const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authorize = require('../middleware/authMiddleware');

// TEACHER ONLY: Upload video/pdf link
router.post('/upload-content', authorize(['teacher']), (req, res) => {
    const { course_id, title, type, url } = req.body;
    const sql = "INSERT INTO course_contents (course_id, title, type, url) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [course_id, title, type, url], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Lecture uploaded successfully! ✅" });
    });
});

// THIS LINE IS CRITICAL - DO NOT REMOVE
module.exports = router;