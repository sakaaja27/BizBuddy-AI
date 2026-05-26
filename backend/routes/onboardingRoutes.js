const express = require('express');
const router = express.Router();
const { step1, step2, step3, getStatus } = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/step1', protect, step1);
router.post('/step2', protect, step2);
router.post('/step3', protect, step3);
router.get('/status', protect, getStatus);

module.exports = router;
