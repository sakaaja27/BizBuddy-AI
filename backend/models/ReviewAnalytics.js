const mongoose = require('mongoose');

const reviewAnalyticsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    unique: true
  },
  googleMapsUrl: {
    type: String
  },
  googlePlaceName: {
    type: String
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  analyzedCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  sentimentBreakdown: {
    positive: {
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    neutral: {
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    negative: {
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },
  topPositives: [{ type: String }],
  topNegatives: [{ type: String }],
  trendingTopics: [{ type: String }],
  recommendations: [{ type: String }],
  overallSummary: {
    type: String
  },
  lastScrapedAt: {
    type: Date
  },
  lastAnalyzedAt: {
    type: Date
  },
  scrapeStatus: {
    type: String,
    enum: ['idle', 'scraping', 'analyzing', 'done', 'error'],
    default: 'idle'
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ReviewAnalytics', reviewAnalyticsSchema);
