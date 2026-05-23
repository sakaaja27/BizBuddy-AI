const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Business = require('../models/Business');
const Groq = require('groq-sdk');


// @desc    Get all products for a business
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    const userId = req.user.id;
    
    const query = { userId, isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (lowStock === 'true') {
      // Find where stock <= minStock
      query.$expr = { $lte: ['$stock', '$minStock'] };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat produk' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const business = await Business.findOne({ userId });
    
    if (!business) {
      return res.status(400).json({ message: 'Bisnis tidak ditemukan' });
    }

    const { name, category, sellPrice, buyPrice, stock, minStock, unit, imageUrl } = req.body;

    const product = await Product.create({
      userId,
      businessId: business._id,
      name,
      category,
      sellPrice,
      buyPrice,
      stock: stock || 0,
      minStock: minStock || 5,
      unit: unit || 'pcs',
      imageUrl
    });

    if (stock > 0) {
      await StockMovement.create({
        businessId: business._id,
        productId: product._id,
        productName: product.name,
        type: 'in',
        quantity: stock,
        notes: 'Stok awal saat pembuatan produk'
      });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Gagal membuat produk' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { name, category, sellPrice, buyPrice, stock, minStock, unit, imageUrl } = req.body;
    
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Check if stock changed manually for adjustment
    if (stock !== undefined && stock !== product.stock) {
      const diff = stock - product.stock;
      await StockMovement.create({
        businessId: product.businessId,
        productId: product._id,
        productName: product.name,
        type: diff > 0 ? 'in' : 'adjustment',
        quantity: Math.abs(diff),
        notes: 'Penyesuaian stok manual'
      });
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.sellPrice = sellPrice !== undefined ? sellPrice : product.sellPrice;
    product.buyPrice = buyPrice !== undefined ? buyPrice : product.buyPrice;
    if (stock !== undefined) product.stock = stock;
    if (minStock !== undefined) product.minStock = minStock;
    product.unit = unit || product.unit;
    product.imageUrl = imageUrl || product.imageUrl;

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Gagal mengupdate produk' });
  }
};

// @desc    Soft delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Gagal menghapus produk' });
  }
};

// @desc    Quick restock product
// @route   PATCH /api/products/:id/restock
// @access  Private
const restockProduct = async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Jumlah stok tidak valid' });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    product.stock += Number(quantity);
    await product.save();

    await StockMovement.create({
      businessId: product.businessId,
      productId: product._id,
      productName: product.name,
      type: 'in',
      quantity: Number(quantity),
      notes: notes || 'Quick Restock'
    });

    res.json(product);
  } catch (error) {
    console.error('Error restocking product:', error);
    res.status(500).json({ message: 'Gagal menambah stok' });
  }
};

// @desc    Get stock movements for chart
// @route   GET /api/products/movements
// @access  Private
const getStockMovements = async (req, res) => {
  try {
    const userId = req.user.id;
    const business = await Business.findOne({ userId });
    
    if (!business) {
      return res.status(400).json({ message: 'Bisnis tidak ditemukan' });
    }

    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const movements = await StockMovement.find({
      businessId: business._id,
      createdAt: { $gte: startDate }
    });

    // Group by day for the chart
    // Output format: [{ day: 'Sen', in: 10, out: 20 }, ...]
    const dailyData = {};
    const daysArr = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    // Initialize the last X days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysArr[d.getDay()];
      // Format as "Day, DD" to avoid duplicates if 7 days span same day names
      const key = `${dayName} ${d.getDate()}`;
      dailyData[key] = { name: key, in: 0, out: 0, rawDate: d };
    }

    movements.forEach(m => {
      const mDate = new Date(m.createdAt);
      const dayName = daysArr[mDate.getDay()];
      const key = `${dayName} ${mDate.getDate()}`;
      
      if (dailyData[key]) {
        if (m.type === 'in') {
          dailyData[key].in += m.quantity;
        } else if (m.type === 'out') {
          dailyData[key].out += m.quantity;
        }
      }
    });

    const chartData = Object.values(dailyData).sort((a, b) => a.rawDate - b.rawDate);
    
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Gagal memuat data pergerakan stok' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getStockMovements
};
