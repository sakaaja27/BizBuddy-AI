const User = require('../models/User');

const PROMO_CODES = {
  'UMKM2024': { discount: 20, type: 'percent' },
  'JUARA': { discount: 50, type: 'percent' },
  'GRATIS': { discount: 100, type: 'percent' },
  'HEMAT33': { discount: 33, type: 'percent' }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let trialDaysLeft = 0;
    if (user.plan === 'trial') {
      const now = new Date();
      const trialEndDate = new Date(user.trialEndDate);
      trialDaysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
    }

    res.json({
      plan: user.plan,
      trialDaysLeft,
      trialEndDate: user.trialEndDate,
      premiumEndDate: user.premiumEndDate,
      isTrialUsed: user.isTrialUsed
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const applyPromo = (req, res) => {
  const { code } = req.body;
  const promo = PROMO_CODES[code.toUpperCase()];

  if (promo) {
    res.json({ valid: true, discount: promo.discount });
  } else {
    res.json({ valid: false, message: 'Kode promo tidak valid' });
  }
};

const activatePremium = async (req, res) => {
  try {
    const { paymentMethod, promoCode, billingType } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    user.plan = 'premium';
    user.premiumStartDate = new Date();
    
    // Default 30 days if monthly, 365 days if yearly
    const daysToAdd = billingType === 'yearly' ? 365 : 30;
    
    // If user already has premium, append to current end date
    if (user.premiumEndDate && new Date(user.premiumEndDate) > new Date()) {
       user.premiumEndDate = new Date(user.premiumEndDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
       user.premiumEndDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    }

    await user.save();

    res.json({
      success: true,
      premiumEndDate: user.premiumEndDate,
      message: 'Premium berhasil diaktifkan!'
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengaktifkan premium', error: error.message });
  }
};

module.exports = {
  getSubscriptionStatus,
  applyPromo,
  activatePremium
};
