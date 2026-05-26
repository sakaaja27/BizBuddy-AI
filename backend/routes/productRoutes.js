const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getStockMovements
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { planLimitMiddleware } = require('../middleware/planLimitMiddleware');

router.route('/')
  .get(protect, getProducts)
  .post(protect, planLimitMiddleware('products'), createProduct);

router.get('/movements', protect, getStockMovements);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

router.patch('/:id/restock', protect, restockProduct);

module.exports = router;
