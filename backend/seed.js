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
const StockMovement = require('./models/StockMovement');

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
    await StockMovement.deleteMany();
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

    // 3. Create Products (mixed stock levels, new schema)
    const productsData = [
      { name: 'Nasi Goreng Spesial', category: 'Makanan', sellPrice: 25000, buyPrice: 15000, stock: 45, minStock: 20, unit: 'porsi', isActive: true },
      { name: 'Ayam Penyet', category: 'Makanan', sellPrice: 20000, buyPrice: 12000, stock: 8, minStock: 10, unit: 'porsi', isActive: true }, // Kritis
      { name: 'Es Teh Manis', category: 'Minuman', sellPrice: 5000, buyPrice: 2000, stock: 100, minStock: 20, unit: 'gelas', isActive: true },
      { name: 'Mie Tek-Tek', category: 'Makanan', sellPrice: 15000, buyPrice: 8000, stock: 12, minStock: 15, unit: 'porsi', isActive: true }, // Hampir habis
      { name: 'Sate Ayam (10 tusuk)', category: 'Makanan', sellPrice: 30000, buyPrice: 18000, stock: 5, minStock: 10, unit: 'porsi', isActive: true }, // Kritis
      { name: 'Kopi Susu Aren', category: 'Minuman', sellPrice: 18000, buyPrice: 8000, stock: 0, minStock: 15, unit: 'cup', isActive: true }, // Habis total
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
    const pNasi = await Product.findOne({ name: 'Nasi Goreng Spesial' });
    const pAyam = await Product.findOne({ name: 'Ayam Penyet' });
    const pTeh = await Product.findOne({ name: 'Es Teh Manis' });
    const pMie = await Product.findOne({ name: 'Mie Tek-Tek' });
    const pSate = await Product.findOne({ name: 'Sate Ayam (10 tusuk)' });
    const pKopi = await Product.findOne({ name: 'Kopi Susu Aren' });

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

    // 4.5. Create Stock Movement (7 Days History)
    const stockMovements = [];
    const productsList = [pNasi, pAyam, pTeh, pMie, pSate, pKopi];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random OUT movements for all products
      productsList.forEach(p => {
        const outQty = Math.floor(Math.random() * 20) + 1; // 1 to 20
        stockMovements.push({
          businessId: business._id,
          productId: p._id,
          productName: p.name,
          type: 'out',
          quantity: outQty,
          notes: 'Penjualan Harian',
          createdAt: date
        });
        
        // Random IN movements (less frequent)
        if (Math.random() > 0.7) {
          const inQty = Math.floor(Math.random() * 50) + 20;
          stockMovements.push({
            businessId: business._id,
            productId: p._id,
            productName: p.name,
            type: 'in',
            quantity: inQty,
            notes: 'Restock Mingguan',
            createdAt: date
          });
        }
      });
    }

    await StockMovement.insertMany(stockMovements);
    console.log('Created Stock Movements for 7 days.');

    // 5. Create Sample Reviews
    const reviewsData = [
      { 
        customerName: 'Bambang S.', 
        platform: 'gofood',
        rating: 5, 
        sentiment: 'positive', 
        reviewText: 'Nasi gorengnya juara! Bumbunya pas, porsinya melimpah. Bakal langganan terus sih ini.',
        aiAnalyzed: false
      },
      { 
        customerName: 'Sinta', 
        platform: 'shopee',
        rating: 4, 
        sentiment: 'positive', 
        reviewText: 'Pengiriman cepat banget, rasa juga oke. Cuma porsi ayamnya agak kecil dibanding biasanya.',
        aiAnalyzed: false
      },
      { 
        customerName: 'Dodi', 
        platform: 'google',
        rating: 3, 
        sentiment: 'neutral', 
        reviewText: 'Tempatnya lumayan nyaman, rasa standar aja sih. Harganya standar warung pada umumnya.',
        aiAnalyzed: false
      },
      { 
        customerName: 'Lisa M.', 
        platform: 'tokopedia',
        rating: 5, 
        sentiment: 'positive', 
        reviewText: 'Suka banget sama sate ayamnya, bumbu kacangnya legit. Packaging juga rapi dan aman.',
        aiAnalyzed: false
      },
      { 
        customerName: 'Agus P.', 
        platform: 'gofood',
        rating: 2, 
        sentiment: 'negative', 
        reviewText: 'Ayamnya keras banget susah dikunyah. Tolong diperhatikan lagi kualitas masakannya. Kecewa banget.',
        aiAnalyzed: true,
        suggestedReply: 'Halo Kak Agus, mohon maaf atas ketidaknyamanannya terkait ayam yang keras. Kami akan segera mengevaluasi proses memasak di dapur agar kejadian ini tidak terulang. Silakan hubungi WA kami ya Kak 🙏'
      },
      { 
        customerName: 'Tono', 
        platform: 'manual',
        rating: 5, 
        sentiment: 'positive', 
        reviewText: 'Selalu mantap kalau makan di sini. Teh manisnya juga enak kerasa banget tehnya.',
        aiAnalyzed: false
      },
      { 
        customerName: 'Yuni Astuti', 
        platform: 'google',
        rating: 4, 
        sentiment: 'positive', 
        reviewText: 'Warungnya bersih, pelayanan ramah. Makanannya enak cuma agak lama keluarnya kalau lagi rame.',
        aiAnalyzed: false
      },
      { 
        customerName: 'Eka', 
        platform: 'shopee',
        rating: 3, 
        sentiment: 'negative', 
        reviewText: 'Pesan mie tek-tek tapi mienya kelembekan. Terus sambalnya dikit banget padahal udah nulis minta pedes.',
        aiAnalyzed: true,
        suggestedReply: 'Halo Kak Eka, maaf ya mienya kurang pas seleranya. Kami siap bantu periksa detail pesanannya untuk kompensasi. Boleh chat admin untuk dibantu proses lebih lanjut ya Kak 🙏'
      },
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
