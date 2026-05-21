const Product = require('../models/Product');

// @desc    Get all products for a business
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await Product.find({ userId });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat produk' });
  }
};

module.exports = {
  getProducts
};
