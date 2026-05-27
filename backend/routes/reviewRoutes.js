const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  connectGoogleMaps,
  scrapeAndAnalyze,
  getAnalytics,
  getReviewList,
  getScrapeStatus,
  generateReply
} = require('../controllers/reviewScraperController');
// Legacy controller if still needed for other features:
const { addReview, getReviewStats, analyzeReview } = require('../controllers/reviewController');

// New Routes
router.post('/connect-gmaps', protect, connectGoogleMaps);
router.post('/scrape', protect, scrapeAndAnalyze);
router.get('/analytics', protect, getAnalytics);
router.get('/list', protect, getReviewList);
router.get('/status', protect, getScrapeStatus);
router.post('/generate-reply', protect, generateReply);

// Legacy routes just in case they are still needed for manual reviews
router.post('/', protect, addReview);
router.get('/stats', protect, getReviewStats);
router.post('/analyze', protect, analyzeReview);

module.exports = router;
