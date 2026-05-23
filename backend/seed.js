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
const Expense = require('./models/Expense');

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
    await Expense.deleteMany();
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

    // 4. Create 30 Days History (Orders, Stock Movements, Expenses)
    const today = new Date();
    const pNasi = await Product.findOne({ name: 'Nasi Goreng Spesial' });
    const pAyam = await Product.findOne({ name: 'Ayam Penyet' });
    const pTeh = await Product.findOne({ name: 'Es Teh Manis' });
    const pMie = await Product.findOne({ name: 'Mie Tek-Tek' });
    const pSate = await Product.findOne({ name: 'Sate Ayam (10 tusuk)' });
    const pKopi = await Product.findOne({ name: 'Kopi Susu Aren' });
    const productsList = [pNasi, pAyam, pTeh, pMie, pSate, pKopi];
    
    const customers = ['Siti Aminah', 'Andi Supriadi', 'Rina Herawati', 'Ahmad Fauzi', 'Dewi Lestari', 'Budi Hartono', 'Citra Kirana'];
    
    const stockMovements = [];
    const expenses = [];
    let orderCount = 1000;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Randomly generate 3 to 10 orders per day
      const dailyOrdersCount = Math.floor(Math.random() * 8) + 3;
      
      for (let j = 0; j < dailyOrdersCount; j++) {
        // Peak hours preference: 11-13 and 17-20
        const isPeak = Math.random() > 0.5;
        let hour;
        if (isPeak) {
          hour = Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 11 : Math.floor(Math.random() * 4) + 17;
        } else {
          hour = Math.floor(Math.random() * 10) + 8; // 8-17
        }
        
        const orderDate = new Date(date);
        orderDate.setHours(hour, Math.floor(Math.random() * 60));

        // 1 to 3 items per order
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let totalAmount = 0;
        
        for (let k = 0; k < numItems; k++) {
          const p = productsList[Math.floor(Math.random() * productsList.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          const subtotal = p.sellPrice * qty;
          totalAmount += subtotal;
          
          if (!items.find(item => item.productId === p._id)) {
            items.push({ productId: p._id, productName: p.name, qty, price: p.sellPrice, subtotal });
          }
        }
        
        // Status: Mostly 'done', but if today, maybe pending/processing
        let status = 'done';
        if (i === 0 && Math.random() > 0.7) {
          status = Math.random() > 0.5 ? 'pending' : 'processing';
        }

        await Order.create({
          userId: demoUser._id,
          businessId: business._id,
          orderNumber: `#ORD-${orderCount++}`,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          orderType: ['meja', 'bungkus', 'delivery'][Math.floor(Math.random() * 3)],
          items,
          totalAmount,
          status,
          createdAt: orderDate
        });
      }

      // Generate Stock Movements (Out) based on daily sales roughly
      productsList.forEach(p => {
        const outQty = Math.floor(Math.random() * 10) + 1;
        stockMovements.push({
          businessId: business._id,
          productId: p._id,
          productName: p.name,
          type: 'out',
          quantity: outQty,
          notes: 'Penjualan Harian',
          createdAt: date
        });
        
        // Occasional Restock
        if (Math.random() > 0.8) {
          stockMovements.push({
            businessId: business._id,
            productId: p._id,
            productName: p.name,
            type: 'in',
            quantity: Math.floor(Math.random() * 50) + 20,
            notes: 'Restock Berkala',
            createdAt: date
          });
        }
      });

      // Generate Expenses (every few days)
      if (Math.random() > 0.8) {
        const categories = ['operasional', 'peralatan', 'marketing', 'lainnya'];
        expenses.push({
          userId: demoUser._id,
          businessId: business._id,
          description: `Pengeluaran ${categories[Math.floor(Math.random() * categories.length)]} rutin`,
          category: categories[Math.floor(Math.random() * categories.length)],
          amount: Math.floor(Math.random() * 200000) + 50000,
          date: date
        });
      }
    }
    
    // Add fixed big expenses
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    expenses.push({ userId: demoUser._id, businessId: business._id, description: 'Pembayaran Listrik Bulanan', category: 'operasional', amount: 500000, date: lastWeek });
    expenses.push({ userId: demoUser._id, businessId: business._id, description: 'Gaji Karyawan', category: 'gaji', amount: 2000000, date: lastWeek });

    await StockMovement.insertMany(stockMovements);
    await Expense.insertMany(expenses);
    console.log('Created 30 days of Orders, Stock Movements, and Expenses.');

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
