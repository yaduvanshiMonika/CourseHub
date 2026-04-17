const db = require('../config/db');

// ✅ CREATE CONTACT
exports.createContact = async (req, res) => {
  const { name, email, message } = req.body;

  await db.query(
    "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
    [name, email, message]
  );

  res.json({ message: "Message sent ✅" });
};

// ✅ GET ALL
exports.getAllContacts = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM contacts ORDER BY id DESC");
  res.json(rows);
};

// ✅ REPLY
exports.replyContact = async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;

  await db.query(
    "UPDATE contacts SET reply=?, status='replied' WHERE id=?",
    [reply, id]
  );

  res.json({ message: "Reply sent ✅" });
};