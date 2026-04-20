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