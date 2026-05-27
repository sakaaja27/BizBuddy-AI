const mongoose = require('mongoose');

const scrapedReviewSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  googlePlaceId: {
    type: String
  },
  googleMapsUrl: {
    type: String
  },
  reviewId: {
    type: String,
    required: true,
    unique: true
  },
  reviewerName: {
    type: String,
    required: true
  },
  reviewerAvatar: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  reviewText: {
    type: String
  },
  reviewDate: {
    type: Date
  },
  likesCount: {
    type: Number,
    default: 0
  },
  isLocalGuide: {
    type: Boolean,
    default: false
  },
  ownerReply: {
    type: String
  },
  ownerReplyDate: {
    type: Date
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', null],
    default: null
  },
  sentimentScore: {
    type: Number,
    min: 0,
    max: 1
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ScrapedReview', scrapedReviewSchema);
