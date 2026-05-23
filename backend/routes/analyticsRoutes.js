const express = require('express');
const router = express.Router();
const {
  getSummary,
  getRevenueChart,
  getTopProducts,
  getPeakHours,
  getProfitMargin,
  getCustomers
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getSummary);
router.get('/revenue-chart', protect, getRevenueChart);
router.get('/top-products', protect, getTopProducts);
router.get('/peak-hours', protect, getPeakHours);
router.get('/profit-margin', protect, getProfitMargin);
router.get('/customers', protect, getCustomers);

module.exports = router;
