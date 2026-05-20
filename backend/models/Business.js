const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  businessType: { 
    type: String, 
    enum: ['fnb', 'fashion', 'jasa', 'retail', 'home_industry', 'other'],
    required: true
  },
  city: { type: String, required: true },
  yearsRunning: { type: String, required: true },
  productCount: { type: String, required: true },
  platforms: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
