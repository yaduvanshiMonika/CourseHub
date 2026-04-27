const db = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * If the client sends Authorization: Bearer <student token>, we bind the message to the
 * account in `users` (correct email + optional user_id) so the student "Messages" page
 * can find it even if the form had a different email typed.
 */
exports.createContact = async (req, res) => {
  try {
    let { name, email, phone, subject, message } = req.body;
    let userId = null;

    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ') && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        if (decoded && decoded.role === 'student' && decoded.id) {
          const [urows] = await db.query(
            'SELECT id, email, name FROM users WHERE id = ? AND role = ? LIMIT 1',
            [decoded.id, 'student']
          );
          if (urows.length) {
            userId = urows[0].id;
            email = urows[0].email;
            if (!name || !String(name).trim()) {
              name = urows[0].name;
            }
          }
        }
      } catch (e) {
        /* guest / invalid token — use body email */
      }
    }

    if (!name || !email || !String(message).trim()) {
      return res.status(400).json({ message: 'Name, email and message are required.' });
    }

    const subj = (subject && String(subject).trim()) || 'No Subject';
    const phoneVal = phone ? String(phone).trim() : null;

    if (userId != null) {
      try {
        await db.query(
          'INSERT INTO contacts (name, email, phone, subject, message, user_id) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, phoneVal, subj, message, userId]
        );
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR' || (e.message && e.message.includes('user_id'))) {
          await db.query(
            'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phoneVal, subj, message]
          );
        } else {
          throw e;
        }
      }
    } else {
      await db.query(
        'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
        [name, email, phoneVal, subj, message]
      );
    }

    res.json({ message: "Message sent ✅" });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ message: "Error saving contact" });
  }
};

// ✅ GET ALL CONTACTS (ADMIN)
exports.getAllContacts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM contacts ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ✅ REPLY
exports.replyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    await db.query(
      "UPDATE contacts SET reply=?, status='replied' WHERE id=?",
      [reply, id]
    );

    res.json({ message: "Reply sent ✅" });

  } catch (err) {
    res.status(500).json(err);
  }
};
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'replied'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    await db.query(`UPDATE contacts SET status = ? WHERE id = ?`, [status, id]);
    res.json({ message: 'Status updated ✅' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(`DELETE FROM contacts WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ message: 'Contact deleted ✅' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
};

exports.getContactStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT COUNT(*) AS total, SUM(status='pending') AS pending, SUM(status='replied') AS replied
      FROM contacts
    `);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};
