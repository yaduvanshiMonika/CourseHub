const express = require('express');
const router = express.Router();
const controller = require('../controllers/enrollmentController');
const auth = require('../middleware/authMiddleware');

// ✅ RIGHT: Calling the function to return the actual middleware
router.post('/', auth(), controller.enrollCourse); 
router.get('/status/:courseId', auth(), controller.checkAccess);


module.exports = router;