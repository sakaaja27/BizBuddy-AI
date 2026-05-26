const express = require('express');
const router = express.Router();
const { getSubscriptionStatus, applyPromo, activatePremium } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/status', protect, getSubscriptionStatus);
router.post('/apply-promo', protect, applyPromo);
router.post('/activate-premium', protect, activatePremium);

module.exports = router;
