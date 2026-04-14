
const db = require('../config/db');
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const crypto = require('crypto'); // ✅ Signature verification ke liye zaroori

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ CREATE ORDER
const createOrder = async (req, res) => {
    const { enrollment_id } = req.body;
    try {
        // const [result] = await db.query(
        //     `SELECT c.price FROM courses c
        //      JOIN enrollments e ON e.course_id = c.id
        //      WHERE e.id = ?`,
        //     [enrollment_id]
        // );

        const [result] = await db.query(
    `SELECT c.price FROM courses c
     JOIN enrollments e ON e.course_id = c.id
     WHERE e.id = ? AND e.user_id = ?`,
    [enrollment_id, req.user.id] // 🔥 THIS LINE YOU ASKED ABOUT
);
        if (!result || result.length === 0) return res.status(404).json({ message: "Enrollment not found" });

        const amount = result[0].price;
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), 
            currency: "INR",
            receipt: `receipt_${enrollment_id}`
        });

        res.json({
            orderId: order.id,
            key: process.env.RAZORPAY_KEY_ID,
            amount
        });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ message: "Order creation failed" });
    }
};



// ✅ VERIFY PAYMENT (Fixed to save the Amount)
const verifyPayment = async (req, res) => {
    const { enrollment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        // 1. Signature Verify (Your existing logic is perfect)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature! ❌" });
        }

        // 2. Database Update - ADDING THE AMOUNT FIX HERE
        // We use a JOIN to pull the real price from the courses table
        // await db.query(
        //     `UPDATE payments p
        //      JOIN enrollments e ON p.enrollment_id = e.id
        //      JOIN courses c ON e.course_id = c.id
        //      SET p.status = 'success', 
        //          p.transaction_id = ?, 
        //          p.razorpay_order_id = ?, 
        //          p.razorpay_signature = ?,
        //          p.amount = c.price
        //      WHERE p.enrollment_id = ?`,
        //     [razorpay_payment_id, razorpay_order_id, razorpay_signature, enrollment_id]
        // );



        await db.query(
  `UPDATE payments p
   JOIN enrollments e ON p.enrollment_id = e.id
   JOIN courses c ON e.course_id = c.id
   SET p.status = 'success', 
       p.transaction_id = ?, 
       p.razorpay_order_id = ?, 
       p.razorpay_signature = ?,
       p.amount = c.price
   WHERE p.enrollment_id = ?
   AND p.user_id = ?
   AND p.course_id = e.course_id`,
  [
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    enrollment_id,
    req.user.id // 🔥 CRITICAL FIX
  ]
);
        // 3. Activate Enrollment
        await db.query(`UPDATE enrollments SET status='active' WHERE id=?`, [enrollment_id]);

        res.json({ message: "Payment verified and amount updated successfully ✅",enrollment_id  });
        

    } catch (err) {
        console.error("Payment Verification Error:", err);
        res.status(500).json({ message: "Verification failed internally" });
    }
};


const generateReceipt = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetching more details to make the receipt look "legit"
        const [payment] = await db.query(
            `SELECT p.*, c.title as course_name FROM payments p 
             JOIN courses c ON p.course_id = c.id 
             WHERE p.enrollment_id = ?`, [id]
        );
        
        if (!payment || payment.length === 0) return res.status(404).send("Payment record not found");
        const data = payment[0];

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=receipt_${id}.pdf`);
        doc.pipe(res);

        // --- 1. Top Header & Branding ---
        doc.fillColor('#444444').fontSize(20).text('CourseHub Online Learning', 50, 50);
        doc.fontSize(10).text('123 Education Square, Digital Way', 50, 75);
        doc.text('GSTIN: 22AAAAA0000A1Z5', 50, 90);
        
        doc.fontSize(25).fillColor('#3399cc').text('INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).fillColor('#000000').text(`Invoice No: #CH-${id}`, 400, 80, { align: 'right' });
        doc.text(`Date: ${new Date(data.payment_date).toLocaleDateString()}`, 400, 95, { align: 'right' });

        doc.moveDown(3);
        doc.moveTo(50, 130).lineTo(550, 130).stroke(); // Horizontal Line

        // --- 2. Payment Summary Table ---
        const tableTop = 170;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Item Description', 50, tableTop);
        doc.text('Transaction ID', 250, tableTop);
        doc.text('Amount (INR)', 450, tableTop, { align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke(); // Header Underline
        
        doc.font('Helvetica').fontSize(11);
        doc.text(data.course_name || 'Course Access', 50, tableTop + 30);
        doc.text(data.transaction_id, 250, tableTop + 30);
        // Correcting the superscript bug by explicitly converting to string
        doc.text(`${parseFloat(data.amount).toFixed(2)}`, 450, tableTop + 30, { align: 'right' });

        doc.moveTo(50, tableTop + 50).lineTo(550, tableTop + 50).stroke(); // Table Bottom Line

        // --- 3. Total Amount Box ---
        doc.moveDown(4);
        doc.font('Helvetica-Bold').fontSize(14).text(`Total Paid: INR ${parseFloat(data.amount).toFixed(2)}`, { align: 'right' });
        doc.fontSize(10).fillColor('green').text('Payment Status: SUCCESSFUL / PAID', { align: 'right' });

        // --- 4. Footer Disclaimer ---
        doc.moveDown(10);
        doc.fillColor('#888888').fontSize(9).text(
            'This is a computer-generated document and does not require a physical signature.',
            { align: 'center' }
        );
        doc.text('Thank you for choosing CourseHub for your professional growth!', { align: 'center' });

        doc.end();

    } catch (err) {
        console.error("Receipt PDF Error:", err);
        res.status(500).send("Error generating PDF");
    }
};
module.exports = { createOrder, verifyPayment, generateReceipt };