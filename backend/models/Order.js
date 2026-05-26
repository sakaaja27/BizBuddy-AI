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
  orderType: { type: String, default: 'direct' },
  tableNumber: { type: String },
  address: { type: String },
  deliveryAddress: { type: String },
  shippingAddress: { type: String },
  courierService: { type: String },
  trackingNumber: { type: String },
  platformOrderId: { type: String },
  platform: { type: String },
  appointmentDate: { type: Date },
  appointmentTime: { type: String },
  technicianName: { type: String },
  customDetails: { type: String },
  dueDate: { type: Date },
  downPayment: { type: Number },
  paymentMethod: { type: String },
  size: { type: String },
  color: { type: String },
  customerPhone: { type: String },
  subStatus: { type: String },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// No pre-save needed anymore since orderNumber has default generator.

module.exports = mongoose.model('Order', orderSchema);
