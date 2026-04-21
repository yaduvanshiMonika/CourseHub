const db = require('../config/db');
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────
//  EMAIL TRANSPORTER  (Gmail SMTP)
//  Set these in your .env file:
//    EMAIL_USER=your@gmail.com
//    EMAIL_PASS=your_app_password   ← Gmail App Password (not your login password)
//    ADMIN_EMAIL=admin@coursehub.com
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────
//  ✅ CREATE CONTACT  (called from frontend contact form)
//     Expects: { name, email, phone, subject, message }
// ─────────────────────────────────────────
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }

    await db.query(
      `INSERT INTO contacts (name, email, phone, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [name, email, phone || null, subject || 'No Subject', message]
    );

    res.json({ message: 'Message sent ✅' });
  } catch (err) {
    console.error('createContact error:', err);
    res.status(500).json({ error: 'Failed to save message.' });
  }
};

// ─────────────────────────────────────────
//  ✅ GET ALL CONTACTS  (admin inbox)
//     Returns contacts newest-first
// ─────────────────────────────────────────
exports.getAllContacts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, subject, message, reply, status, created_at, replied_at
       FROM contacts
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllContacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
};

// ─────────────────────────────────────────
//  ✅ GET SINGLE CONTACT  (for detail view)
// ─────────────────────────────────────────
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM contacts WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getContactById error:', err);
    res.status(500).json({ error: 'Failed to fetch contact.' });
  }
};

// ─────────────────────────────────────────
//  ✅ UPDATE STATUS  (unread → read)
//     Called when admin opens a message
// ─────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;   // 'pending' | 'replied'

    const allowed = ['pending', 'replied'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    await db.query(
      `UPDATE contacts SET status = ? WHERE id = ?`,
      [status, id]
    );
    res.json({ message: 'Status updated ✅' });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

// ─────────────────────────────────────────
//  ✅ REPLY TO CONTACT
//     Saves reply to DB  +  sends email to user
// ─────────────────────────────────────────
exports.replyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    // 1. Fetch original contact so we have name + email + subject
    const [rows] = await db.query(
      `SELECT name, email, subject FROM contacts WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });

    const { name, email, subject } = rows[0];

    // 2. Save reply + mark as replied in DB
    await db.query(
      `UPDATE contacts
       SET reply = ?, status = 'replied', replied_at = NOW()
       WHERE id = ?`,
      [reply.trim(), id]
    );

    // 3. Send email to the user
    const mailOptions = {
      from: `"CourseHub Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a2e; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">CourseHub</h2>
          </div>
          <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 15px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
            <p style="color: #333; font-size: 15px;">Thanks for contacting us. Here is our response to your query:</p>
            <div style="background: #fff; border-left: 4px solid #6c63ff; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #333; font-size: 14px; line-height: 1.7; margin: 0;">${reply.trim().replace(/\n/g, '<br>')}</p>
            </div>
            <p style="color: #666; font-size: 13px;">If you have further questions, feel free to reply to this email or visit our website.</p>
            <p style="color: #333; font-size: 14px; margin-bottom: 0;">
              Best regards,<br>
              <strong>CourseHub Support Team</strong>
            </p>
          </div>
          <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 16px;">
            © ${new Date().getFullYear()} CourseHub. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Reply sent and email delivered ✅' });
  } catch (err) {
    console.error('replyContact error:', err);
    res.status(500).json({ error: 'Reply saved but email failed. Check email config.' });
  }
};

// ─────────────────────────────────────────
//  ✅ DELETE CONTACT
// ─────────────────────────────────────────
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      `DELETE FROM contacts WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    res.json({ message: 'Contact deleted ✅' });
  } catch (err) {
    console.error('deleteContact error:', err);
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
};

// ─────────────────────────────────────────
//  ✅ GET STATS  (for dashboard badge counts)
// ─────────────────────────────────────────
exports.getContactStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*)                                       AS total,
        SUM(status = 'pending')                        AS pending,
        SUM(status = 'replied')                        AS replied
      FROM contacts
    `);
    res.json(stats);
  } catch (err) {
    console.error('getContactStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};