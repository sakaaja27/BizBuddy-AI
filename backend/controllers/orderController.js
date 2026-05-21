const Order = require('../models/Order');
const Product = require('../models/Product');
const Business = require('../models/Business');
const Groq = require('groq-sdk');

// @desc    Get all orders for a business
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { status, filter } = req.query; // filter can be 'today', 'week', 'all'
    const userId = req.user.id;

    const query = { userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    } else if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat pesanan' });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerName, orderType, tableNumber, address, items, notes } = req.body;

    // We need businessId
    const business = await Business.findOne({ userId });
    if (!business) {
      return res.status(400).json({ message: 'Profil bisnis tidak ditemukan' });
    }

    // Calculate totalAmount if not provided or to ensure safety
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const subtotal = item.qty * item.price;
      totalAmount += subtotal;
      return {
        ...item,
        subtotal
      };
    });

    const order = await Order.create({
      userId,
      businessId: business._id,
      customerName,
      orderType,
      tableNumber,
      address,
      items: processedItems,
      totalAmount,
      status: 'pending',
      notes
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Gagal membuat pesanan' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'done', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Gagal mengupdate status' });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    res.json({ message: 'Pesanan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Gagal menghapus pesanan' });
  }
};

// @desc    Parse natural language text into order structure using Groq
// @route   POST /api/orders/ai-parse
// @access  Private
const parseAIOrder = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: 'Teks pesanan tidak boleh kosong' });
    }

    // Get all products to give context to AI
    const products = await Product.find({ userId }).select('name price _id category');
    
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'Groq API Key belum dikonfigurasi' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Format products for prompt
    const productsList = products.map(p => `- ${p.name} (Rp ${p.price}) [ID: ${p._id}]`).join('\n');

    const prompt = `
      Anda adalah asisten cerdas untuk parsing pesanan warung/restoran.
      Tugas Anda adalah membaca teks pesanan alami dari pengguna, dan mengubahnya menjadi format JSON yang sangat kaku (strict).
      
      Daftar Produk yang Tersedia di Database:
      ${productsList || 'Belum ada produk. (Tebak saja harganya jika tidak ada, misal 10000)'}
      
      Teks Input Pesanan: "${text}"
      
      ATURAN JSON:
      1. customerName: (string) Nama pelanggan (contoh: "Budi", "Meja 4", "Kak Ani", atau "Anonim" jika tidak ada).
      2. orderType: (string) Hanya boleh: "meja", "bungkus", atau "delivery". Jika ada kata "meja" -> meja. "bawa pulang/bungkus/take away" -> bungkus. "kirim/gojek" -> delivery.
      3. tableNumber: (string) Nomor meja jika orderType "meja", kosongkan jika tidak ada.
      4. items: (array of objects) 
         - productName: (string) Nama produk yang dipesan (sesuaikan dengan nama produk terdekat di daftar).
         - productId: (string) ID produk jika cocok dengan daftar di atas. Jika tidak ada yang cocok, gunakan null.
         - qty: (number) Jumlah pesanan.
         - price: (number) Harga satuan. Jika ada di daftar, gunakan harga daftar. Jika tidak, tebak harga umum (misal 15000).
         - subtotal: (number) qty * price
      5. totalAmount: (number) Total semua subtotal
      6. notes: (string) Catatan tambahan (misal: "pedas", "jangan pakai bawang").
      
      KEMBALIKAN HANYA VALID JSON. JANGAN ADA TEKS LAIN SEBELUM/SESUDAH JSON.
      Contoh output JSON yang benar:
      {
        "customerName": "Budi",
        "orderType": "meja",
        "tableNumber": "3",
        "items": [
          { "productName": "Nasi Goreng Spesial", "productId": "664c...123", "qty": 2, "price": 25000, "subtotal": 50000 }
        ],
        "totalAmount": 50000,
        "notes": "Yang satu pedas, yang satu tidak"
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // or llama3-70b-8192 if better JSON adherence is needed
      temperature: 0.1, // low temp for JSON
      response_format: { type: 'json_object' } // Groq supports this for Llama 3!
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    let parsedOrder;

    try {
      parsedOrder = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", responseContent);
      return res.status(500).json({ message: 'AI gagal menghasilkan format data yang valid' });
    }

    res.json(parsedOrder);

  } catch (error) {
    console.error('Error parsing AI order:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses pesanan dengan AI' });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  parseAIOrder
};
