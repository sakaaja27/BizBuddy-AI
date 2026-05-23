const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['operasional', 'gaji', 'marketing', 'peralatan', 'lainnya'], 
    required: true 
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
