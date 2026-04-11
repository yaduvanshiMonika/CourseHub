const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// These must be valid functions (not undefined) or the server crashes
router.post('/register', register);
router.post('/login', login);
exports.register = async (req, res) => {
  res.status(200).json({ message: "Register working" });
};

module.exports = router;