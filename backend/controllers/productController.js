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

// @desc    Get AI Restock Advice
// @route   GET /api/products/restock-advice
// @access  Private
const getRestockAdvice = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get low stock active products
    const lowStockProducts = await Product.find({
      userId,
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    if (lowStockProducts.length === 0) {
      return res.json([]);
    }

    // Get recent OUT movements to calculate velocity
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const productIds = lowStockProducts.map(p => p._id);
    const recentMovements = await StockMovement.find({
      productId: { $in: productIds },
      type: 'out',
      createdAt: { $gte: startDate }
    });

    const contextData = lowStockProducts.map(p => {
      const outs = recentMovements.filter(m => m.productId.toString() === p._id.toString());
      const totalOut = outs.reduce((sum, m) => sum + m.quantity, 0);
      const velocityPerDay = totalOut / 7;
      
      return {
        name: p.name,
        currentStock: p.stock,
        minStock: p.minStock,
        salesPerDay: velocityPerDay.toFixed(1)
      };
    });

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'Groq API Key belum dikonfigurasi' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const prompt = `
      Anda adalah asisten AI spesialis manajemen inventori.
      Berikut adalah data produk yang stoknya sudah kritis atau habis:
      ${JSON.stringify(contextData)}
      
      Tugas Anda: Berikan saran restock untuk setiap produk berdasarkan sisa stok dan rata-rata penjualan harian.
      Jika currentStock 0, predictedDaysLeft adalah 0.
      Jika salesPerDay 0, predictedDaysLeft anggap saja 99.
      recommendedRestock adalah jumlah yang disarankan untuk dibeli agar aman untuk 14 hari ke depan (salesPerDay * 14).
      
      Output HANYA berupa JSON Object dengan struktur:
      {
        "advice": [
          {
            "product": "Nama Produk",
            "currentStock": number,
            "predictedDaysLeft": number,
            "recommendedRestock": number,
            "reason": "Penjelasan singkat 1 kalimat"
          }
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' } 
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    try {
      const parsed = JSON.parse(responseContent);
      res.json(parsed.advice || []);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", responseContent);
      res.json([]);
    }

  } catch (error) {
    console.error('Error getting restock advice:', error);
    res.status(500).json({ message: 'Gagal mengambil saran restock' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getStockMovements,
  getRestockAdvice
};
