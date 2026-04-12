// const db = require('../config/db');

// // ENROLL USER
// exports.enrollCourse = (req, res) => {
//     const userId = req.user.id; // from JWT middleware
//     const { course_id } = req.body;

//     // check if already enrolled
//     const checkQuery = `SELECT * FROM enrollments WHERE user_id=? AND course_id=?`;

//     db.query(checkQuery, [userId, course_id], (err, result) => {
//         if (err) return res.status(500).json(err);

//         if (result.length > 0) {
//             return res.status(400).json({ message: "Already enrolled" });
//         }

//         // create enrollment (pending)
//         const enrollQuery = `
//             INSERT INTO enrollments (user_id, course_id, status)
//             VALUES (?, ?, 'pending')
//         `;

//         db.query(enrollQuery, [userId, course_id], (err, enrollResult) => {
//             if (err) return res.status(500).json(err);

//             const enrollmentId = enrollResult.insertId;

//             // create payment entry
//             const paymentQuery = `
//                 INSERT INTO payments (user_id, course_id, enrollment_id, amount, status)
//                 VALUES (?, ?, ?, 0, 'pending')
//             `;

//             db.query(paymentQuery, [userId, course_id, enrollmentId], (err) => {
//                 if (err) return res.status(500).json(err);

//                 res.json({
//                     message: "Enrollment created",
//                     enrollmentId
//                 });
//             });
//         });
//     });
// };

// // CHECK ACCESS
// exports.checkAccess = (req, res) => {
//     const userId = req.user.id;
//     const courseId = req.params.courseId;

//     const query = `
//         SELECT * FROM enrollments 
//         WHERE user_id=? AND course_id=? AND status='active'
//     `;

//     db.query(query, [userId, courseId], (err, result) => {
//         if (err) return res.status(500).json(err);

//         res.json({ hasAccess: result.length > 0 });
//     });
// };







const db = require('../config/db');

// ✅ ENROLL USER (Fixed with Async/Await and Safety Checks)
exports.enrollCourse = async (req, res) => {
    try {
        // 1. Safety Guard: Check if user exists
        if (!req.user || !req.user.id) {
            console.error("ERROR: No user ID found in request. Check middleware.");
            return res.status(401).json({ message: "User not authenticated correctly" });
        }

        const userId = req.user.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        // 2. Check if already enrolled (Using await to match your DB config)
       // 🔥 CHECK EXISTING ENROLLMENT + PAYMENT STATUS
const [existing] = await db.query(
  `SELECT e.id, p.status AS payment_status
   FROM enrollments e
   LEFT JOIN payments p ON e.id = p.enrollment_id
   WHERE e.user_id=? AND e.course_id=?`,
  [userId, course_id]
);

if (existing.length > 0) {
  const enrollment = existing[0];

  // ✅ CASE 1: Payment already completed → block
  if (enrollment.payment_status === 'success') {
    return res.status(400).json({ message: "Already enrolled" });
  }

  // ✅ CASE 2: Payment pending → allow resume
  return res.status(200).json({
    message: "Resume Payment",
    enrollmentId: enrollment.id
  });
}

        // 3. Create enrollment (pending)
        const [enrollResult] = await db.query(
            `INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'pending')`,
            [userId, course_id]
        );

        const enrollmentId = enrollResult.insertId;

        // 4. Create payment entry
        await db.query(
            `INSERT INTO payments (user_id, course_id, enrollment_id, amount, status) VALUES (?, ?, ?, 0, 'pending')`,
            [userId, course_id, enrollmentId]
        );

        res.status(201).json({
            message: "Enrollment created successfully ✅",
            enrollmentId
        });

    } catch (err) {
        console.error("ENROLLMENT ERROR:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

// ✅ CHECK ACCESS (Fixed with Async/Await)
exports.checkAccess = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        const [result] = await db.query(
            `SELECT * FROM enrollments WHERE user_id=? AND course_id=? AND status='active'`,
            [userId, courseId]
        );

        res.json({ hasAccess: result.length > 0 });
    } catch (err) {
        console.error("CHECK ACCESS ERROR:", err);
        res.status(500).json({ message: "Server Error" });
    }
};