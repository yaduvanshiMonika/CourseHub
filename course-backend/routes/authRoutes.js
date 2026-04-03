const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// These must be valid functions (not undefined) or the server crashes
router.post('/register', register);
router.post('/login', login);

module.exports = router;