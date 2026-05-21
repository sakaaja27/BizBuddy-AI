const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  orderNumber: { 
    type: String, 
    required: true,
    default: () => `#ORD-${Math.floor(1000 + Math.random() * 9000)}`
  },
  customerName: { type: String, required: true },
  orderType: { type: String, enum: ['meja', 'bungkus', 'delivery'], default: 'meja' },
  tableNumber: { type: String },
  address: { type: String },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'done', 'cancelled'], default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// No pre-save needed anymore since orderNumber has default generator.

module.exports = mongoose.model('Order', orderSchema);
