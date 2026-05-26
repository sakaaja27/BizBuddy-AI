const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User tidak ditemukan' });
      }

      // --- TRIAL & PREMIUM CHECK ---
      let planChanged = false;
      const now = new Date();

      if (user.plan === 'trial') {
        const trialEndDate = new Date(user.trialEndDate);
        const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

        if (now > trialEndDate) {
          user.plan = 'free';
          user.isTrialUsed = true;
          planChanged = true;
          res.set('X-Trial-Expired', 'true');
        } else {
          res.set('X-Trial-Days-Left', daysLeft.toString());
        }
      } else if (user.plan === 'premium') {
        const premiumEndDate = new Date(user.premiumEndDate);
        if (now > premiumEndDate) {
          user.plan = 'free';
          planChanged = true;
          res.set('X-Premium-Expired', 'true');
        }
      }

      if (planChanged) {
        await user.save();
      }
      // -----------------------------

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
