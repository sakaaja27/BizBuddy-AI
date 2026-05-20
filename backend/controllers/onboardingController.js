const Business = require('../models/Business');
const Product = require('../models/Product');
const User = require('../models/User');

const saveBusiness = async (req, res) => {
  try {
    const { businessName, businessType, city, yearsRunning, productCount, platforms } = req.body;
    
    // Check if user already has a business profile
    const existingBusiness = await Business.findOne({ userId: req.user.id });
    if (existingBusiness) {
      return res.status(400).json({ message: 'Profil bisnis sudah ada' });
    }

    const business = await Business.create({
      userId: req.user.id,
      businessName,
      businessType,
      city,
      yearsRunning,
      productCount,
      platforms
    });

    // Update user onboarding status
    await User.findByIdAndUpdate(req.user.id, { isOnboardingComplete: true });

    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan profil bisnis', error: error.message });
  }
};

const saveFirstProduct = async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    
    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(400).json({ message: 'Silakan isi profil bisnis terlebih dahulu' });
    }

    const product = await Product.create({
      userId: req.user.id,
      businessId: business._id,
      name,
      category,
      price,
      stock
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan produk', error: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ isOnboardingComplete: user.isOnboardingComplete });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  saveBusiness,
  saveFirstProduct,
  getStatus
};
