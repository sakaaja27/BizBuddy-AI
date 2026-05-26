const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String },
  businessType: { type: String, required: true },
  city: { type: String },
  description: { type: String },
  address: { type: String },
  yearsRunning: { type: String },
  productCount: { type: String },
  platforms: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
