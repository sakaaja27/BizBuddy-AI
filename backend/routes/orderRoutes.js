const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  parseAIOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { planLimitMiddleware } = require('../middleware/planLimitMiddleware');

router.route('/')
  .get(protect, getOrders)
  .post(protect, planLimitMiddleware('orders'), createOrder);

router.post('/ai-parse', protect, parseAIOrder);

router.route('/:id/status')
  .patch(protect, updateOrderStatus);

router.route('/:id')
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

module.exports = router;
