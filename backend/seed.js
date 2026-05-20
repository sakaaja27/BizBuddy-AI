const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Models
const User = require('./models/User');
const Business = require('./models/Business');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Review = require('./models/Review');

mongoose.set('strictQuery', false);

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bizbuddy');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Business.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    console.log('Cleared existing data.');

    // 1. Create Demo User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);
    
    const demoUser = await User.create({
      name: 'Budi Santoso',
      email: 'demo@bizbuddy.com',
      password: hashedPassword,
      plan: 'premium',
      isOnboardingComplete: true
    });
    console.log('Created Demo User.');

    // 2. Create Business Profile
    const business = await Business.create({
      userId: demoUser._id,
      businessName: 'Warung Makan Budi',
      businessType: 'fnb',
      city: 'Jakarta',
      yearsRunning: '1-3 tahun',
      productCount: '10-50',
      platforms: ['GoFood', 'GrabFood', 'WhatsApp']
    });
    console.log('Created Business Profile.');

    // 3. Create Products (mixed stock levels)
    const productsData = [
      { name: 'Nasi Goreng Spesial', category: 'Makanan', price: 25000, stock: 45 },
      { name: 'Ayam Penyet', category: 'Makanan', price: 20000, stock: 8 }, // Kritis
      { name: 'Es Teh Manis', category: 'Minuman', price: 5000, stock: 100 },
      { name: 'Mie Tek-Tek', category: 'Makanan', price: 15000, stock: 12 }, // Warning
      { name: 'Sate Ayam (10 tusuk)', category: 'Makanan', price: 30000, stock: 5 }, // Kritis
    ];

    for (const p of productsData) {
      await Product.create({
        userId: demoUser._id,
        businessId: business._id,
        ...p
      });
    }
    console.log('Created 5 Products.');

    // 4. Create Recent Orders (Today)
    const today = new Date();
    const ordersData = [
      { orderId: '#ORD-0921', customerName: 'Siti Aminah', items: 'Nasi Goreng Spesial (x2)', totalAmount: 50000, status: 'Pending', createdAt: new Date(today.getTime() - 1000 * 60 * 10) },
      { orderId: '#ORD-0920', customerName: 'Andi Supriadi', items: 'Mie Tek-Tek, Es Teh', totalAmount: 20000, status: 'Processing', createdAt: new Date(today.getTime() - 1000 * 60 * 30) },
      { orderId: '#ORD-0919', customerName: 'Rina Herawati', items: 'Ayam Penyet + Nasi', totalAmount: 25000, status: 'Done', createdAt: new Date(today.getTime() - 1000 * 60 * 60) },
      { orderId: '#ORD-0918', customerName: 'Ahmad Fauzi', items: 'Sate Ayam (20 tusuk)', totalAmount: 60000, status: 'Done', createdAt: new Date(today.getTime() - 1000 * 60 * 120) },
      { orderId: '#ORD-0917', customerName: 'Dewi Lestari', items: 'Nasi Goreng Spesial', totalAmount: 25000, status: 'Done', createdAt: new Date(today.getTime() - 1000 * 60 * 180) },
    ];

    for (const o of ordersData) {
      await Order.create({
        userId: demoUser._id,
        businessId: business._id,
        ...o
      });
    }
    console.log('Created 5 Recent Orders.');

    // 5. Create Sample Reviews
    const reviewsData = [
      { customerName: 'Bambang', rating: 5, sentiment: 'Positif', comment: 'Rasa enak banget dan porsi pas!' },
      { customerName: 'Sinta', rating: 4, sentiment: 'Positif', comment: 'Pelayanan cepat.' },
      { customerName: 'Dodi', rating: 3, sentiment: 'Netral', comment: 'Rasa standar, harga lumayan.' },
      { customerName: 'Lisa', rating: 5, sentiment: 'Positif', comment: 'Suka banget sama sate ayamnya.' },
      { customerName: 'Agus', rating: 2, sentiment: 'Saran', comment: 'Sambalnya kurang pedas, mohon ditingkatkan.' },
      { customerName: 'Tono', rating: 5, sentiment: 'Positif', comment: 'Mantap pokoknya.' },
      { customerName: 'Yuni', rating: 4, sentiment: 'Positif', comment: 'Bersih dan enak.' },
      { customerName: 'Eka', rating: 3, sentiment: 'Netral', comment: 'Biasa saja.' },
    ];

    for (const r of reviewsData) {
      await Review.create({
        userId: demoUser._id,
        businessId: business._id,
        ...r
      });
    }
    console.log('Created Sample Reviews.');

    console.log('Database seeding completed successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
