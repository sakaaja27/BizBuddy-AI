const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  parseAIOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.post('/ai-parse', protect, parseAIOrder);

router.route('/:id/status')
  .patch(protect, updateOrderStatus);

router.route('/:id')
  .delete(protect, deleteOrder);

module.exports = router;
