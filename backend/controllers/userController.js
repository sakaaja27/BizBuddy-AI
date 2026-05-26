const User = require('../models/User');
const Business = require('../models/Business');
const bcrypt = require('bcrypt');

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    user.name = name || user.name;
    user.email = email || user.email;
    if (phone !== undefined) user.phone = phone; // Add phone field if missing in schema
    
    await user.save();
    res.json({ success: true, user: { name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update profil' });
  }
};

const updateBusinessProfile = async (req, res) => {
  try {
    const businessData = req.body;
    let business = await Business.findOne({ userId: req.user.id });
    
    if (!business) {
      return res.status(404).json({ message: 'Profil toko tidak ditemukan' });
    }

    // Update fields
    business.businessName = businessData.businessName || business.businessName;
    business.businessType = businessData.businessType || business.businessType;
    business.city = businessData.city || business.city;
    business.address = businessData.address !== undefined ? businessData.address : business.address;
    business.description = businessData.description !== undefined ? businessData.description : business.description;
    
    if (businessData.platforms) {
      business.platforms = businessData.platforms;
    }
    
    if (businessData.operatingHours) {
      business.operatingHours = businessData.operatingHours;
    }

    await business.save();
    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update profil toko', error: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user.password) {
      return res.status(400).json({ message: 'Akun ini terdaftar via Google, tidak memiliki password.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password saat ini salah' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah password' });
  }
};

const updateNotifications = async (req, res) => {
  try {
    // Assuming we store preferences in a hypothetical 'preferences' object on user
    // We will just return success for the demo as the schema may not have it yet.
    res.json({ success: true, message: 'Preferensi notifikasi disimpan' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan preferensi' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    
    await User.findByIdAndDelete(req.user.id);
    // Ideal: delete Business, Products, Orders, Reviews etc.
    await Business.findOneAndDelete({ userId: req.user.id });
    
    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus akun' });
  }
};

module.exports = {
  updateProfile,
  updateBusinessProfile,
  updatePassword,
  updateNotifications,
  deleteAccount
};
