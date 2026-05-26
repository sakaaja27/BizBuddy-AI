const Business = require('../models/Business');
const Product = require('../models/Product');
const User = require('../models/User');

const step1 = async (req, res) => {
  try {
    const { businessType } = req.body;
    let business = await Business.findOne({ userId: req.user.id });
    
    if (business) {
      business.businessType = businessType;
      await business.save();
    } else {
      business = await Business.create({
        userId: req.user.id,
        businessType
      });
    }

    res.status(200).json({ business });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses step 1', error: error.message });
  }
};

const step2 = async (req, res) => {
  try {
    const { businessName, city, yearsRunning, productCount, platforms } = req.body;
    
    let business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Profil bisnis belum ada, silakan mulai dari langkah 1' });
    }

    business.businessName = businessName;
    business.city = city;
    business.yearsRunning = yearsRunning;
    business.productCount = productCount;
    business.platforms = platforms;
    
    await business.save();

    res.status(200).json({ business });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses step 2', error: error.message });
  }
};

const step3 = async (req, res) => {
  try {
    const { product } = req.body;
    
    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'Profil bisnis tidak ditemukan' });
    }

    let newProduct = null;
    if (product && product.name && product.price) {
      newProduct = await Product.create({
        userId: req.user.id,
        businessId: business._id,
        name: product.name,
        category: product.category || 'Umum',
        sellPrice: product.price,
        buyPrice: product.buyPrice || 0,
        stock: product.stock || 0,
        minStock: product.minStock || 5,
        unit: product.unit || 'pcs'
      });
    }

    await User.findByIdAndUpdate(req.user.id, { isOnboardingComplete: true });

    res.status(200).json({ business, product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses step 3', error: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const business = await Business.findOne({ userId: req.user.id });
    res.json({ 
      isComplete: user.isOnboardingComplete,
      business 
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  step1,
  step2,
  step3,
  getStatus
};
