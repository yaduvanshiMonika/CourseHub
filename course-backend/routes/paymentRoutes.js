const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

// 1. Create the Razorpay Order
router.post('/create-order', auth(), controller.createOrder);

// 2. Verify the payment after the popup closes
router.post('/verify', auth(), controller.verifyPayment);

// 3. Download the PDF receipt
router.get('/receipt/:id', controller.generateReceipt);
router.get('/', async (req, res) => {
    try {
        const db = require('../config/db');

        const [data] = await db.query(`
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
        `);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching payments" });
    }
});

module.exports = router;