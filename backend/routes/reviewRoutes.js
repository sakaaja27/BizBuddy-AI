const express = require('express');
const router = express.Router();
const {
  getReviews,
  addReview,
  analyzeReview,
  getReviewStats
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getReviews)
  .post(protect, addReview);

router.get('/stats', protect, getReviewStats);
router.post('/analyze', protect, analyzeReview);

module.exports = router;
