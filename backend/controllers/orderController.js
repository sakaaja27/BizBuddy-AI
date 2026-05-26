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
    const { 
      customerName, orderType, tableNumber, address, items, notes,
      deliveryAddress, shippingAddress, courierService, trackingNumber,
      platformOrderId, platform, appointmentDate, appointmentTime,
      technicianName, customDetails, dueDate, downPayment, paymentMethod,
      size, color, customerPhone
    } = req.body;

    const business = await Business.findOne({ userId });
    if (!business) {
      return res.status(400).json({ message: 'Profil bisnis tidak ditemukan' });
    }

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const subtotal = item.qty * item.price;
      totalAmount += subtotal;
      return { ...item, subtotal };
    });

    const orderData = {
      userId,
      businessId: business._id,
      customerName,
      orderType,
      tableNumber,
      address,
      items: processedItems,
      totalAmount,
      status: 'pending',
      notes,
      deliveryAddress, shippingAddress, courierService, trackingNumber,
      platformOrderId, platform, appointmentTime,
      technicianName, customDetails, downPayment, paymentMethod,
      size, color, customerPhone
    };

    if (appointmentDate) orderData.appointmentDate = appointmentDate;
    if (dueDate) orderData.dueDate = dueDate;

    const order = await Order.create(orderData);

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Gagal membuat pesanan', error: error.message });
  }
};

const StockMovement = require('../models/StockMovement');

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'done', 'cancelled'];
    const userId = req.user.id;
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const order = await Order.findOne({ _id: req.params.id, userId });
    
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    const previousStatus = order.status;
    let stockAlerts = [];

    // Pending -> Processing : Deduct Stock
    if (previousStatus === 'pending' && status === 'processing') {
      // 1. Validate all stock first
      if (!req.body.force) {
        for (const item of order.items) {
          if (!item.productId) continue;
          const product = await Product.findById(item.productId);
          if (product && product.stock < item.qty) {
            return res.status(400).json({
              error: "INSUFFICIENT_STOCK",
              product: product.name,
              available: product.stock,
              requested: item.qty
            });
          }
        }
      }

      // 2. Deduct stock & create movements
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock -= item.qty;
          await product.save();

          await StockMovement.create({
            businessId: order.businessId,
            productId: product._id,
            productName: product.name,
            type: 'out',
            quantity: item.qty,
            notes: `Pesanan ${order.orderNumber}`,
            orderId: order._id
          });

          if (product.stock <= product.minStock) {
            stockAlerts.push(product.name);
          }
        }
      }
    }

    // Processing -> Pending : Return Stock (Correction)
    if (previousStatus === 'processing' && status === 'pending') {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.qty;
          await product.save();

          await StockMovement.create({
            businessId: order.businessId,
            productId: product._id,
            productName: product.name,
            type: 'in', // Returning stock
            quantity: item.qty,
            notes: `Pengembalian stok dari pesanan dikoreksi (Order: ${order.customerName})`
          });
        }
      }
    }

    // Processing/Done -> Cancelled : Reverse Stock
    if ((previousStatus === 'processing' || previousStatus === 'done') && status === 'cancelled') {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.qty;
          await product.save();

          await StockMovement.create({
            businessId: order.businessId,
            productId: product._id,
            productName: product.name,
            type: 'adjustment',
            quantity: item.qty,
            notes: `Pembatalan Pesanan ${order.orderNumber}`,
            orderId: order._id
          });
        }
      }
    }

    order.status = status;
    await order.save();

    res.json({ order, stockAlerts });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Gagal mengupdate status' });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
  try {
    const { 
      customerName, orderType, tableNumber, address, items, notes,
      deliveryAddress, shippingAddress, courierService, trackingNumber,
      platformOrderId, platform, appointmentDate, appointmentTime,
      technicianName, customDetails, dueDate, downPayment, paymentMethod,
      size, color, customerPhone
    } = req.body;
    
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const subtotal = item.qty * item.price;
      totalAmount += subtotal;
      return { ...item, subtotal };
    });

    const updateData = { 
      customerName, orderType, tableNumber, address, items: processedItems, totalAmount, notes,
      deliveryAddress, shippingAddress, courierService, trackingNumber,
      platformOrderId, platform, appointmentTime,
      technicianName, customDetails, downPayment, paymentMethod,
      size, color, customerPhone
    };

    if (appointmentDate) updateData.appointmentDate = appointmentDate;
    if (dueDate) updateData.dueDate = dueDate;

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Gagal mengupdate pesanan' });
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

    // Get all ACTIVE products to give context to AI
    const products = await Product.find({ userId, isActive: true, stock: { $gt: 0 } });
    
    const business = await Business.findOne({ userId });
    const businessType = business ? business.businessType : 'other';
    const businessName = business ? business.businessName : 'UMKM';

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'Groq API Key belum dikonfigurasi' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Format menu context
    const menuContext = products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.sellPrice,
      stock: p.stock,
      unit: p.unit
    }));

    // Dynamic output format based on business type
    let extraFieldsPrompt = '';
    if (businessType === 'fnb') {
      extraFieldsPrompt = `"orderType": "dine_in|takeaway|delivery|gofood|grabfood", "tableNumber": "string", "deliveryAddress": "string"`;
    } else if (businessType === 'fashion') {
      extraFieldsPrompt = `"orderType": "offline|whatsapp|shopee|tokopedia|instagram", "shippingAddress": "string", "courierService": "string", "size": "string", "color": "string"`;
    } else if (businessType === 'jasa') {
      extraFieldsPrompt = `"orderType": "walk_in|appointment|home_service|whatsapp", "appointmentDate": "YYYY-MM-DD", "appointmentTime": "HH:MM", "serviceAddress": "string"`;
    } else if (businessType === 'retail') {
      extraFieldsPrompt = `"orderType": "cashier|delivery_local|whatsapp", "paymentMethod": "string", "deliveryAddress": "string"`;
    } else if (businessType === 'home_industry') {
      extraFieldsPrompt = `"orderType": "pre_order|ready_stock|custom_order|shipping", "dueDate": "YYYY-MM-DD", "customDetails": "string", "downPayment": "number"`;
    } else {
      extraFieldsPrompt = `"orderType": "direct|whatsapp|online"`;
    }

    const prompt = `
Kamu adalah asisten AI kasir/pesanan untuk bisnis ${businessName} (Tipe Bisnis: ${businessType}).
Tugas Anda adalah mem-parse teks pesanan alami dari pengguna dan mencocokkannya dengan produk/layanan yang tersedia.

Data Produk/Layanan (JSON Array):
${JSON.stringify(menuContext)}

Teks pesanan: "${text}"

ATURAN PARSING KETAT:
1. PENTING: JIKA item yang diminta pengguna TIDAK TERDAFTAR SECARA PERSIS, Anda WAJIB memasukkannya ke dalam array "notFound". Jangan paksa memasukkan ke "items".
2. Ekstrak data pelanggan, jenis pesanan, alamat/tanggal (jika relevan).

KEMBALIKAN HANYA VALID JSON dengan struktur kaku ini:
{
  "customerName": "string",
  "customerPhone": "string (opsional)",
  ${extraFieldsPrompt},
  "items": [
    {
      "productId": "string (id produk)",
      "productName": "string (nama asli)",
      "qty": number,
      "price": number,
      "subtotal": number
    }
  ],
  "notFound": ["string"],
  "insufficientStock": [
    { "name": "string", "requested": number, "available": number }
  ],
  "totalAmount": number,
  "notes": "string",
  "confidence": number
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.1, 
      response_format: { type: 'json_object' } 
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
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  parseAIOrder
};
