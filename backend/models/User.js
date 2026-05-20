const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional because of Google OAuth
  googleId: { type: String },
  avatar: { type: String },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  isOnboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
