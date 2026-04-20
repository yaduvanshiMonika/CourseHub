const express = require('express');
const router = express.Router();
const controller = require('../controllers/contactController');

// user sends message
router.post('/', controller.createContact);

// admin gets all messages
router.get('/', controller.getAllContacts);

// admin reply
router.put('/reply/:id', controller.replyContact);

module.exports = router;