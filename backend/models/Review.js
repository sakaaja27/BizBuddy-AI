const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customerName: { type: String, required: true },
  platform: { 
    type: String, 
    enum: ['tokopedia', 'shopee', 'google', 'gofood', 'manual'],
    default: 'manual'
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  sentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative'], 
    required: true 
  },
  sentimentScore: { type: Number, default: 0 },
  aiAnalyzed: { type: Boolean, default: false },
  suggestedReply: { type: String },
  replyUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
