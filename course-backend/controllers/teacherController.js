const db = require("../config/db");
const {
  getYouTubeThumbnail,
  isBase64Image
} = require("../utils/thumbnailHelper");

const getOwnedCourse = async (courseId, teacherId) => {
  const [rows] = await db.query(
    "SELECT * FROM courses WHERE id = ? AND teacher_id = ? LIMIT 1",
    [courseId, teacherId]
  );
  return rows.length ? rows[0] : null;
};

const resolveThumbnail = ({ thumbnailUrl, thumbnailFile, videoLink }) => {
  let finalThumbnailUrl = null;
  let finalThumbnailFile = null;

  if (thumbnailFile && isBase64Image(thumbnailFile)) {
    finalThumbnailFile = thumbnailFile;
    return { finalThumbnailUrl, finalThumbnailFile };
  }

  if (thumbnailUrl && thumbnailUrl.trim()) {
    finalThumbnailUrl = thumbnailUrl.trim();
    return { finalThumbnailUrl, finalThumbnailFile };
  }

  if (videoLink && videoLink.trim()) {
    const ytThumb = getYouTubeThumbnail(videoLink.trim());
    if (ytThumb) {
      finalThumbnailUrl = ytThumb;
      return { finalThumbnailUrl, finalThumbnailFile };
    }
  }

  return { finalThumbnailUrl, finalThumbnailFile };
};

const addCourse = async (req, res) => {
  try {
    const {
      title,
      category,
      instructor,
      price,
      status,
      level,
      video_link,
      pdf_link,
      description,
      thumbnailUrl,
      thumbnailFile
    } = req.body;

    // const teacherId = req.user.id;

    const teacherId = req.user.id || req.user.userId;

    console.log("ADD COURSE req.body =", req.body);
    console.log("ADD COURSE req.user =", req.user);
    console.log("ADD COURSE teacherId =", teacherId);
    console.log("ADD COURSE title =", title);
    console.log("ADD COURSE category =", category);
    console.log("ADD COURSE status =", status);

    if (!title || !title.trim() || !category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required."
      });
    }

    const finalInstructor =
      instructor && instructor.trim() ? instructor.trim() : req.user.name;

    const allowedStatus = ["draft", "published", "archived"];
    const finalStatus = allowedStatus.includes(status) ? status : "draft";

    const allowedLevels = ["beginner", "intermediate", "advanced"];
    const finalLevel = allowedLevels.includes(level) ? level : "beginner";

    const finalPrice = price ? Number(price) : 0;

    const { finalThumbnailUrl, finalThumbnailFile } = resolveThumbnail({
      thumbnailUrl,
      thumbnailFile,
      videoLink: video_link
    });

    const [result] = await db.query(
      `INSERT INTO courses
      (
        title,
        category,
        instructor,
        thumbnail_url,
        thumbnail_file,
        teacher_id,
        price,
        status,
        level,
        description,
        video_link,
        pdf_link
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        title.trim(),
        category.trim(),
        finalInstructor,
        finalThumbnailUrl,
        finalThumbnailFile,
        teacherId,
        finalPrice,
        finalStatus,
        finalLevel,
        description || null,
        video_link || null,
        pdf_link || null
      ]
    );

    //add video automatic 1st ontent
    // if (video_link && video_link.trim()) {
    //   await db.query(
    //     `INSERT INTO course_contents
    //      (course_id, title, type, url, duration, position)
    //      VALUES (?, ?, ?, ?, ?, ?)`,
    //     [result.insertId, title.trim(), "video", video_link.trim(), 0, 1]
    //   );
    // }



    //add today
     //add video automatic 1st ontent
if (video_link && video_link.trim()) {

  const duration = await getVideoDuration(video_link.trim()); // ✅ added

  await db.query(
    `INSERT INTO course_contents
     (course_id, title, type, url, duration, position)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [result.insertId, title.trim(), "video", video_link.trim(), duration, 1]
  );
}



    return res.status(201).json({
      success: true,
      message: "Course added successfully.",
      courseId: result.insertId,
      thumbnail_url: finalThumbnailUrl,
      thumbnail_file: finalThumbnailFile
    });
  } catch (error) {
    console.error("Add Course Error Full:", error);

    console.error("Add Course Error Full:", error);
    console.error("Message:", error.message);
    console.error("SQL Message:", error.sqlMessage);
    console.error("Code:", error.code);

    return res.status(500).json({
      success: false,
      message: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null
    });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user.userId;

    const [rows] = await db.query(
      `SELECT
        c.id,
        c.title,
        c.category,
        c.instructor,
        c.thumbnail_url,
        c.thumbnail_file,
        c.teacher_id,
        c.created_at,
        c.price,
        c.status,
        c.level,
        c.description,
        c.video_link,
        c.pdf_link,
        COUNT(DISTINCT e.id) AS total_enrollments,
        COUNT(DISTINCT cc.position) AS lectureCount
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_contents cc ON cc.course_id = c.id
      WHERE c.teacher_id = ?
      GROUP BY
        c.id, c.title, c.category, c.instructor, c.thumbnail_url, c.thumbnail_file,
        c.teacher_id, c.created_at, c.price, c.status, c.level, c.description,
        c.video_link, c.pdf_link
      ORDER BY c.created_at DESC`,
      [teacherId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error("Get My Courses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching courses."
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    // const teacherId = req.user.id;
    const teacherId = req.user.id || req.user.userId;
    const { id } = req.params;

    const course = await getOwnedCourse(id, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    const [contents] = await db.query(
      `SELECT id, course_id, title, type, url, duration, position, pdf_name
       FROM course_contents
       WHERE course_id = ?
       ORDER BY position ASC, id ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...course,
        contents
      }
    });
  } catch (error) {
    console.error("Get Course By Id Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course details."
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    // const teacherId = req.user.id;
    const teacherId = req.user.id || req.user.userId;
    const { id } = req.params;

    const course = await getOwnedCourse(id, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized."
      });
    }

    const {
      title,
      category,
      instructor,
      price,
      status,
      level,
      video_link,
      pdf_link,
      description,
      thumbnailUrl,
      thumbnailFile
    } = req.body;

    const finalTitle = title !== undefined ? title.trim() : course.title;
    const finalCategory = category !== undefined ? category.trim() : course.category;
    const finalInstructor = instructor !== undefined ? instructor.trim() : course.instructor;
    const finalPrice = price !== undefined ? Number(price) : course.price;
    const finalStatus = status !== undefined ? status : course.status;
    const finalVideoLink = video_link !== undefined ? video_link : course.video_link;
    const finalPdfLink = pdf_link !== undefined ? pdf_link : course.pdf_link;
    const finalDescription = description !== undefined ? description : course.description;

    const allowedLevels = ["beginner", "intermediate", "advanced"];
    const finalLevel =
      level !== undefined && allowedLevels.includes(level) ? level : course.level;

    if (!finalTitle || !finalCategory) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required."
      });
    }

    let finalThumbnailUrl = course.thumbnail_url;
    let finalThumbnailFile = course.thumbnail_file;

    if (thumbnailFile && isBase64Image(thumbnailFile)) {
      finalThumbnailFile = thumbnailFile;
      finalThumbnailUrl = null;
    } else if (thumbnailUrl !== undefined && thumbnailUrl.trim()) {
      finalThumbnailUrl = thumbnailUrl.trim();
      finalThumbnailFile = null;
    } else if (!finalThumbnailUrl && !finalThumbnailFile) {
      const autoThumb = resolveThumbnail({
        thumbnailUrl: null,
        thumbnailFile: null,
        videoLink: finalVideoLink
      });

      finalThumbnailUrl = autoThumb.finalThumbnailUrl;
      finalThumbnailFile = autoThumb.finalThumbnailFile;
    }

    await db.query(
      `UPDATE courses
       SET title = ?, category = ?, instructor = ?, thumbnail_url = ?, thumbnail_file = ?,
           price = ?, status = ?, level = ?, description = ?, video_link = ?, pdf_link = ?
       WHERE id = ? AND teacher_id = ?`,
      [
        finalTitle,
        finalCategory,
        finalInstructor,
        finalThumbnailUrl,
        finalThumbnailFile,
        finalPrice,
        finalStatus,
        finalLevel,
        finalDescription,
        finalVideoLink,
        finalPdfLink,
        id,
        teacherId
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      thumbnail_url: finalThumbnailUrl,
      thumbnail_file: finalThumbnailFile
    });
  } catch (error) {
    console.error("Update Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating course."
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    // const teacherId = req.user.id;
    const teacherId = req.user.id || req.user.userId;
    const { id } = req.params;

    const course = await getOwnedCourse(id, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized."
      });
    }

    await db.query("DELETE FROM course_contents WHERE course_id = ?", [id]);
    await db.query("DELETE FROM courses WHERE id = ? AND teacher_id = ?", [id, teacherId]);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully."
    });
  } catch (error) {
    console.error("Delete Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting course."
    });
  }
};

const addCourseContents = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user.userId;

    
    const { courseId } = req.params;

    const course = await getOwnedCourse(courseId, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized."
      });
    }

  //   const title = req.body.title?.trim();
  //   const duration = Number(req.body.duration) || 0;
  //   const position = Number(req.body.position) || 1;
  //  const videoUrl = req.body.url ? req.body.url.trim() : null;


  //add today
    const title = req.body.title?.trim();
let duration = 0; // ❌ manual remove
const position = Number(req.body.position) || 1;

const videoUrl = req.body.url ? req.body.url.trim() : null;

// ✅ added
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

    // video insert
    if (videoUrl) {
      await db.query(
        `INSERT INTO course_contents (course_id, title, type, url, duration, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [courseId, title.trim(), "video", videoUrl, duration, position]
      );
    }


    // pdf insert
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
        await db.query(
          "UPDATE courses SET thumbnail_url = ? WHERE id = ? AND teacher_id = ?",
          [autoThumb, courseId, teacherId]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Course contents added successfully."
    });
  } catch (error) {
    console.error("Add Course Contents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding course contents."
    });
  }
};

const getCourseContents = async (req, res) => {
  try {
   
    const teacherId = req.user.id || req.user.userId;

    const { courseId } = req.params;

    const course = await getOwnedCourse(courseId, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized."
      });
    }

    const [rows] = await db.query(
      `SELECT id, course_id, title, type, url, duration, position, pdf_name
       FROM course_contents
       WHERE course_id = ?
       ORDER BY position ASC, id ASC`,
      [courseId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error("Get Course Contents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course contents."
    });
  }
};

const updateCourseContent = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user.userId;
    const { contentId } = req.params;
    const { title, url, duration, position } = req.body;

    const [rows] = await db.query(
      `SELECT cc.*, c.teacher_id
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

    if (content.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access."
      });
    }

    const finalTitle = title ? title.trim() : content.title;
    // const finalDuration = duration ? Number(duration) : content.duration;
    const finalPosition = position ? Number(position) : content.position;
    // const finalVideoUrl = url && url.trim() ? url.trim() : content.url;
    const finalVideoUrl = url && url.trim() ? url.trim() : content.url;

let finalDuration = content.duration;
if (content.type === "video" && finalVideoUrl) {
  finalDuration = await getVideoDuration(finalVideoUrl);
}

    const newPdfName = req.file ? req.file.originalname : null;
    const newPdfData = req.file ? req.file.buffer : null;

    // position duplicate check (lecture issue fix)
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

    //  current row update
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

    //  FIX: video pe PDF handle karo (auto 1st content case)
    if (content.type === "video") {
      const [existingPdf] = await db.query(
        `SELECT id
         FROM course_contents
         WHERE course_id = ? AND type = 'pdf' AND position = ?`,
        [content.course_id, content.position] // old position
      );

      if (existingPdf.length > 0) {
        //  PDF already hai → move/update
        await db.query(
          `UPDATE course_contents
           SET position = ?
           WHERE id = ?`,
          [finalPosition, existingPdf[0].id]
        );
      } else if (newPdfData) {
        // 🔥 FIX: auto first video pe pdf add ho jaye
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
    console.error("Update Course Content Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const deleteCourseContent = async (req, res) => {
  try {
    // const teacherId = req.user.id;
    const teacherId = req.user.id || req.user.userId;

    const { contentId } = req.params;

    const [rows] = await db.query(
      `SELECT cc.id, cc.course_id, c.teacher_id
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

    if (rows[0].teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access."
      });
    }

    await db.query("DELETE FROM course_contents WHERE id = ?", [contentId]);

    return res.status(200).json({
      success: true,
      message: "Course content deleted successfully."
    });
  } catch (error) {
    console.error("Delete Course Content Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting course content."
    });
  }
};

const reorderCourseContents = async (req, res) => {
  try {
    // const teacherId = req.user.id;
    const teacherId = req.user.id || req.user.userId;

    const { courseId } = req.params;
    const { items } = req.body;

    const course = await getOwnedCourse(courseId, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items array is required."
      });
    }

    for (const item of items) {
      await db.query(
        `UPDATE course_contents
         SET position = ?
         WHERE id = ? AND course_id = ?`,
        [Number(item.position), item.id, courseId]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Course contents reordered successfully."
    });
  } catch (error) {
    console.error("Reorder Course Contents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while reordering course contents."
    });
  }
};

const getCourseEnrollments = async (req, res) => {
  try {
    // const teacherId = req.user.id;
    const teacherId = req.user.id || req.user.userId;

    const { courseId } = req.params;

    const course = await getOwnedCourse(courseId, teacherId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized."
      });
    }

    const [rows] = await db.query(
      `SELECT
        e.id AS enrollment_id,
        e.course_id,
        e.user_id,
        e.created_at AS enrolled_at,
        u.name AS student_name,
        u.email AS student_email
      FROM enrollments e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.course_id = ?
      ORDER BY e.id DESC`,
      [courseId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error("Get Course Enrollments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching enrollments."
    });
  }
};

const getContentPdf = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user.userId;
    const { contentId } = req.params;

    const [rows] = await db.query(
      `SELECT cc.pdf_name, cc.pdf_data, c.teacher_id
       FROM course_contents cc
       INNER JOIN courses c ON c.id = cc.course_id
       WHERE cc.id = ? AND cc.type = 'pdf'
       LIMIT 1`,
      [contentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (rows[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (!rows[0].pdf_data) {
      return res.status(404).json({ message: 'PDF data not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${rows[0].pdf_name || 'file.pdf'}"`
    );

    return res.send(rows[0].pdf_data);
  } catch (error) {
    console.error('Get Content PDF Error:', error);
    return res.status(500).json({ message: 'Server error while opening PDF' });
  }
};

//add new function today
const getVideoDuration = async (videoUrl) => {
  try {
    const axios = require("axios");

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.log("YOUTUBE_API_KEY missing");
      return 0;
    }

    let videoId = "";

    try {
      const parsedUrl = new URL(videoUrl);
      const host = parsedUrl.hostname.replace("www.", "");

      if (host === "youtu.be") {
        videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
      } else if (host === "youtube.com" || host === "m.youtube.com") {
        if (parsedUrl.pathname === "/watch") {
          videoId = parsedUrl.searchParams.get("v") || "";
        } else if (parsedUrl.pathname.startsWith("/embed/")) {
          videoId = parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || "";
        } else if (parsedUrl.pathname.startsWith("/shorts/")) {
          videoId = parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || "";
        }
      }
    } catch (err) {
      console.log("Invalid URL format:", videoUrl);
      return 0;
    }

    if (!videoId) {
      console.log("Could not extract videoId from:", videoUrl);
      return 0;
    }

    console.log("Extracted videoId =", videoId);

    const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        id: videoId,
        part: "contentDetails",
        key: apiKey
      }
    });

    if (!res.data.items || res.data.items.length === 0) {
      console.log("No video found for ID:", videoId);
      return 0;
    }

    const iso = res.data.items[0].contentDetails.duration;
    console.log("ISO duration =", iso);

    const hours = parseInt(iso.match(/(\d+)H/)?.[1] || "0", 10);
    const minutes = parseInt(iso.match(/(\d+)M/)?.[1] || "0", 10);
    const seconds = parseInt(iso.match(/(\d+)S/)?.[1] || "0", 10);

    return (hours * 3600) + (minutes * 60) + seconds;
  } catch (error) {
    console.error("getVideoDuration error =", error.response?.data || error.message);
    return 0;
  }
};

module.exports = {
  addCourse,
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
  getContentPdf   // add this line
};
