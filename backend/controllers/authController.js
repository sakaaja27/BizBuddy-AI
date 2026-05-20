const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const Business = require('../models/Business');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        isOnboardingComplete: user.isOnboardingComplete
      });
    } else {
      res.status(400).json({ message: 'Data pengguna tidak valid' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const business = await Business.findOne({ userId: user._id });
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        isOnboardingComplete: user.isOnboardingComplete,
        businessName: business ? business.businessName : null
      });
    } else {
      res.status(401).json({ message: 'Email atau password salah' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const business = await Business.findOne({ userId: req.user.id });
    if (business && user) {
      user.businessName = business.businessName;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verifikasi token dari Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture: avatar } = payload;

    // Cek apakah user sudah ada
    let user = await User.findOne({ email });

    if (!user) {
      // Buat user baru tanpa password (karena login via Google)
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        isOnboardingComplete: false
      });
    }

    const business = await Business.findOne({ userId: user._id });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
      isOnboardingComplete: user.isOnboardingComplete,
      businessName: business ? business.businessName : null
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({ message: 'Verifikasi Google gagal' });
  }
};

const logoutUser = (req, res) => {
  res.json({ message: 'Berhasil logout' });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  logoutUser
};
