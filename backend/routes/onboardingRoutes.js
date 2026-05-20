const express = require('express');
const router = express.Router();
const { saveBusiness, saveFirstProduct, getStatus } = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/business', protect, saveBusiness);
router.post('/first-product', protect, saveFirstProduct);
router.get('/status', protect, getStatus);

module.exports = router;
