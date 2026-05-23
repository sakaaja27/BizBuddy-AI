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

router.route('/')
  .get(protect, getProducts)
  .post(protect, createProduct);

router.get('/movements', protect, getStockMovements);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

router.patch('/:id/restock', protect, restockProduct);

module.exports = router;
