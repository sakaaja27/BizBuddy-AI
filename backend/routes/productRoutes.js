const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProducts);

module.exports = router;
