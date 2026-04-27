const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * Public-safe outline: titles, position, duration, flags — no video URLs or PDF data.
 */
function buildCurriculumOutline(rows) {
    const byPos = new Map();
    for (const row of rows || []) {
        const pos = Number(row.position) || 0;
        if (!byPos.has(pos)) {
            byPos.set(pos, {
                position: pos,
                title: '',
                duration_seconds: 0,
                has_video: false,
                has_pdf: false
            });
        }
        const g = byPos.get(pos);
        if (row.type === 'video') {
            g.has_video = true;
            if (row.title && String(row.title).trim()) g.title = String(row.title).trim();
            g.duration_seconds = Math.max(g.duration_seconds, Number(row.duration || 0));
        } else if (row.type === 'pdf') {
            g.has_pdf = true;
            if (!g.title && row.title && String(row.title).trim()) g.title = String(row.title).trim();
        }
    }
    return Array.from(byPos.values())
        .sort((a, b) => a.position - b.position)
        .map((x) => ({
            ...x,
            title: x.title || `Lesson ${x.position}`
        }));
}

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

// ✅ GET SINGLE COURSE (Public) + curriculum outline (no media URLs — unlock after payment)
router.get('/courses/:id', async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM courses WHERE id=? AND status='published'",
            [req.params.id]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: "Course not found ❌" });
        }

        const course = results[0];
        const [contentRows] = await db.query(
            `SELECT position, title, type, duration
             FROM course_contents
             WHERE course_id = ?
             ORDER BY position ASC, id ASC`,
            [course.id]
        );
        const curriculum_outline = buildCurriculumOutline(contentRows);

        res.json({ ...course, curriculum_outline });
    } catch (err) {
        console.error("Single course error:", err);
        res.status(500).json({ message: "Error fetching course" });
    }
});

module.exports = router;