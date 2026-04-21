const express = require('express');
const router  = express.Router();
const contact = require('../controllers/contactController');

router.post('/',           contact.createContact);
router.get('/stats',       contact.getContactStats);
router.get('/',            contact.getAllContacts);
router.patch('/:id',       contact.updateStatus);
router.post('/:id/reply',  contact.replyContact);
router.delete('/:id',      contact.deleteContact);

module.exports = router;