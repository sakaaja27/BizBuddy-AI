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
    // Assuming the products we just created: 
    // 0: Nasi Goreng (25k), 1: Ayam Penyet (20k), 2: Es Teh (5k), 3: Mie Tek-Tek (15k), 4: Sate (30k)
    const pNasi = await Product.findOne({ name: 'Nasi Goreng Spesial' });
    const pAyam = await Product.findOne({ name: 'Ayam Penyet' });
    const pTeh = await Product.findOne({ name: 'Es Teh Manis' });
    const pMie = await Product.findOne({ name: 'Mie Tek-Tek' });
    const pSate = await Product.findOne({ name: 'Sate Ayam (10 tusuk)' });

    const ordersData = [
      { 
        orderNumber: '#ORD-0921', 
        customerName: 'Siti Aminah', 
        orderType: 'meja',
        tableNumber: '4',
        items: [{ productId: pNasi._id, productName: pNasi.name, qty: 2, price: 25000, subtotal: 50000 }], 
        totalAmount: 50000, 
        status: 'pending', 
        createdAt: new Date(today.getTime() - 1000 * 60 * 10) 
      },
      { 
        orderNumber: '#ORD-0920', 
        customerName: 'Andi Supriadi', 
        orderType: 'bungkus',
        items: [
          { productId: pMie._id, productName: pMie.name, qty: 1, price: 15000, subtotal: 15000 },
          { productId: pTeh._id, productName: pTeh.name, qty: 1, price: 5000, subtotal: 5000 }
        ], 
        totalAmount: 20000, 
        status: 'processing', 
        createdAt: new Date(today.getTime() - 1000 * 60 * 30) 
      },
      { 
        orderNumber: '#ORD-0919', 
        customerName: 'Rina Herawati', 
        orderType: 'delivery',
        address: 'Jl. Melati No 10',
        items: [{ productId: pAyam._id, productName: pAyam.name, qty: 1, price: 25000, subtotal: 25000 }], 
        totalAmount: 25000, 
        status: 'done', 
        createdAt: new Date(today.getTime() - 1000 * 60 * 60) 
      },
      { 
        orderNumber: '#ORD-0918', 
        customerName: 'Ahmad Fauzi', 
        orderType: 'meja',
        tableNumber: '1',
        items: [{ productId: pSate._id, productName: pSate.name, qty: 2, price: 30000, subtotal: 60000 }], 
        totalAmount: 60000, 
        status: 'done', 
        createdAt: new Date(today.getTime() - 1000 * 60 * 120) 
      },
      { 
        orderNumber: '#ORD-0917', 
        customerName: 'Dewi Lestari', 
        orderType: 'bungkus',
        items: [{ productId: pNasi._id, productName: pNasi.name, qty: 1, price: 25000, subtotal: 25000 }], 
        totalAmount: 25000, 
        status: 'done', 
        createdAt: new Date(today.getTime() - 1000 * 60 * 180) 
      },
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
