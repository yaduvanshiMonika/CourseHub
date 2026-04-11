const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ GET ONLY PUBLISHED COURSES (Public)
router.get('/courses/public', async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM courses WHERE status='published' ORDER BY id DESC"
        );
        res.json(results);
    } catch (err) {
        console.error("Public courses error:", err);
        res.status(500).json({ message: "Error fetching public courses" });
    }
});

// ✅ GET SINGLE COURSE (Public)
router.get('/courses/:id', async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM courses WHERE id=? AND status='published'",
            [req.params.id]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: "Course not found ❌" });
        }

        res.json(results[0]);
    } catch (err) {
        console.error("Single course error:", err);
        res.status(500).json({ message: "Error fetching course" });
    }
});

module.exports = router;