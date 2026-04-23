// routes/webinarRoutes.js
const express = require('express');
const router = express.Router();
const webinarController = require('../controllers/webinarController');

// Public
router.post('/', webinarController.createWebinar);

// Admin
router.get('/',           webinarController.getAllWebinars);
router.get('/stats',      webinarController.getWebinarStats);
router.patch('/:id',      webinarController.updateWebinarStatus);
router.delete('/:id',     webinarController.deleteWebinar);

module.exports = router;