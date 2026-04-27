const db = require("../config/db");
const { getYouTubeThumbnail } = require("../utils/thumbnailHelper");
const { getVideoDuration } = require("./teacherController");

const getCourseByIdAdmin = async (courseId) => {
  const [rows] = await db.query("SELECT * FROM courses WHERE id = ? LIMIT 1", [
    courseId
  ]);
  return rows.length ? rows[0] : null;
};

const listCourseContents = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await getCourseByIdAdmin(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    const [results] = await db.query(
      `SELECT id, course_id, title, type, url, duration, position, pdf_name
       FROM course_contents
       WHERE course_id = ?
       ORDER BY position ASC, id ASC`,
      [courseId]
    );
    res.json(results);
  } catch (err) {
    console.error("Admin list course contents:", err);
    res.status(500).json({ message: "Error fetching course contents" });
  }
};

const addCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await getCourseByIdAdmin(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    const title = req.body.title?.trim();
    let duration = 0;
    const position = Number(req.body.position) || 1;
    const videoUrl = req.body.url ? req.body.url.trim() : null;

    if (videoUrl) {
      duration = await getVideoDuration(videoUrl);
    }

    const pdfName = req.file ? req.file.originalname : null;
    const pdfData = req.file ? req.file.buffer : null;

    if (!title || (!videoUrl && !pdfData)) {
      return res.status(400).json({
        success: false,
        message: "Title and at least one of video URL or PDF file is required."
      });
    }

    if (videoUrl) {
      await db.query(
        `INSERT INTO course_contents (course_id, title, type, url, duration, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [courseId, title.trim(), "video", videoUrl, duration, position]
      );
    }

    if (pdfData) {
      await db.query(
        `INSERT INTO course_contents
         (course_id, title, type, url, duration, position, pdf_name, pdf_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [courseId, title.trim(), "pdf", null, duration, position, pdfName, pdfData]
      );
    }

    if (videoUrl && !course.thumbnail_url && !course.thumbnail_file) {
      const autoThumb = getYouTubeThumbnail(videoUrl);
      if (autoThumb) {
        await db.query("UPDATE courses SET thumbnail_url = ? WHERE id = ?", [
          autoThumb,
          courseId
        ]);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Course contents added successfully."
    });
  } catch (error) {
    console.error("Admin Add Course Contents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding course contents."
    });
  }
};

const updateCourseContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, url, position } = req.body;

    const [rows] = await db.query(
      `SELECT cc.*, c.id AS course_id_join
       FROM course_contents cc
       INNER JOIN courses c ON c.id = cc.course_id
       WHERE cc.id = ? LIMIT 1`,
      [contentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Content not found."
      });
    }

    const content = rows[0];

    const finalTitle = title ? title.trim() : content.title;
    const finalPosition = position ? Number(position) : content.position;
    const finalVideoUrl = url && url.trim() ? url.trim() : content.url;

    let finalDuration = content.duration;
    if (content.type === "video" && finalVideoUrl) {
      finalDuration = await getVideoDuration(finalVideoUrl);
    }

    const newPdfName = req.file ? req.file.originalname : null;
    const newPdfData = req.file ? req.file.buffer : null;

    if (finalPosition !== content.position) {
      const [existing] = await db.query(
        `SELECT id FROM course_contents
         WHERE course_id = ? AND position = ? AND id != ?`,
        [content.course_id, finalPosition, contentId]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This position is already used"
        });
      }
    }

    if (content.type === "video") {
      await db.query(
        `UPDATE course_contents
         SET title = ?, url = ?, duration = ?, position = ?
         WHERE id = ?`,
        [finalTitle, finalVideoUrl, finalDuration, finalPosition, contentId]
      );
    } else if (content.type === "pdf") {
      const finalPdfTitle = newPdfName || content.title;

      await db.query(
        `UPDATE course_contents
         SET title = ?, url = ?, duration = ?, position = ?, pdf_name = ?, pdf_data = ?
         WHERE id = ?`,
        [
          finalPdfTitle,
          null,
          finalDuration,
          finalPosition,
          newPdfName || content.pdf_name || content.title,
          newPdfData || content.pdf_data,
          contentId
        ]
      );
    }

    if (content.type === "video") {
      const [existingPdf] = await db.query(
        `SELECT id
         FROM course_contents
         WHERE course_id = ? AND type = 'pdf' AND position = ?`,
        [content.course_id, content.position]
      );

      if (existingPdf.length > 0) {
        await db.query(
          `UPDATE course_contents
           SET position = ?
           WHERE id = ?`,
          [finalPosition, existingPdf[0].id]
        );
      } else if (newPdfData) {
        await db.query(
          `INSERT INTO course_contents
           (course_id, title, type, url, duration, position, pdf_name, pdf_data)
           VALUES (?, ?, 'pdf', ?, ?, ?, ?, ?)`,
          [
            content.course_id,
            finalTitle,
            null,
            finalDuration,
            finalPosition,
            newPdfName,
            newPdfData
          ]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Content updated successfully"
    });
  } catch (error) {
    console.error("Admin Update Course Content Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const deleteCourseContent = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT cc.id FROM course_contents cc WHERE cc.id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Content not found."
      });
    }

    await db.query("DELETE FROM course_contents WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Course content deleted successfully."
    });
  } catch (error) {
    console.error("Admin Delete Course Content Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting course content."
    });
  }
};

const getContentPdf = async (req, res) => {
  try {
    const { contentId } = req.params;

    const [rows] = await db.query(
      `SELECT cc.pdf_name, cc.pdf_data
       FROM course_contents cc
       WHERE cc.id = ? AND cc.type = 'pdf'
       LIMIT 1`,
      [contentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!rows[0].pdf_data) {
      return res.status(404).json({ message: "PDF data not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${rows[0].pdf_name || "file.pdf"}"`
    );

    return res.send(rows[0].pdf_data);
  } catch (error) {
    console.error("Admin Get Content PDF Error:", error);
    return res.status(500).json({ message: "Server error while opening PDF" });
  }
};

module.exports = {
  listCourseContents,
  addCourseContents,
  updateCourseContent,
  deleteCourseContent,
  getContentPdf
};
