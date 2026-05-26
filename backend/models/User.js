const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional because of Google OAuth
  googleId: { type: String },
  avatar: { type: String },
  plan: { type: String, enum: ['free', 'trial', 'premium'], default: 'trial' },
  trialStartDate: { type: Date, default: Date.now },
  trialEndDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  premiumStartDate: Date,
  premiumEndDate: Date,
  isTrialUsed: { type: Boolean, default: false },
  isOnboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
