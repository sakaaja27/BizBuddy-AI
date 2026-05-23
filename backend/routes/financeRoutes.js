const express = require('express');
const router = express.Router();
const {
  getSummary,
  getCashflow,
  getTransactions,
  getProductBreakdown,
  addExpense,
  exportExcel
} = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getSummary);
router.get('/cashflow', protect, getCashflow);
router.get('/transactions', protect, getTransactions);
router.get('/product-breakdown', protect, getProductBreakdown);
router.post('/expenses', protect, addExpense);
router.get('/export/excel', protect, exportExcel);

module.exports = router;
