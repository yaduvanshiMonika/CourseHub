const db = require('../config/db');

// ✅ CREATE CONTACT
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    await db.query(
      "INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, subject, message]
    );

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
