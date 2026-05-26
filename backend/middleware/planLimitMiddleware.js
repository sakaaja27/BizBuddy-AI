const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review'); // Optional, if you track them

const planLimitMiddleware = (feature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      // If premium or enterprise, no limits
      if (user.plan === 'premium' || user.plan === 'enterprise') {
        return next();
      }

      // 'free' plan limits
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (feature === 'orders') {
        const orderCount = await Order.countDocuments({
          userId: user._id,
          createdAt: { $gte: startOfMonth }
        });
        
        if (orderCount >= 50) {
          return res.status(403).json({
            error: 'LIMIT_REACHED',
            feature: 'orders',
            limit: 50
          });
        }
      }

      if (feature === 'products') {
        const productCount = await Product.countDocuments({ userId: user._id });
        if (productCount >= 10) {
          return res.status(403).json({
            error: 'LIMIT_REACHED',
            feature: 'products',
            limit: 10
          });
        }
      }

      if (feature === 'ai_chat') {
        // Mock AI chat usage limit check if stored in a separate table, or tracked in user object
        // For now, if implemented, we'd check usage here.
        // If not, we just pass since chat limits are usually tracked via a ChatLog schema
        const chatLimit = 20; 
        // Example check:
        // const chatCount = await ChatLog.countDocuments({ userId: user._id, createdAt: { $gte: startOfDay }});
        // if (chatCount >= chatLimit) return res.status(403).json({ error: 'LIMIT_REACHED', feature: 'ai_chat', limit: chatLimit });
      }

      if (feature === 'review_analysis') {
        const reviewLimit = 10;
        // const analysisCount = await Review.countDocuments({ userId: user._id, isAnalyzed: true, createdAt: { $gte: startOfMonth }});
        // if (analysisCount >= reviewLimit) return res.status(403).json({ error: 'LIMIT_REACHED', feature: 'review_analysis', limit: reviewLimit });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan saat mengecek limit plan', error: error.message });
    }
  };
};

module.exports = { planLimitMiddleware };
