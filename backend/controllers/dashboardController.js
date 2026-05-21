const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Business = require('../models/Business');
const Groq = require('groq-sdk');

// Cache in-memory untuk menyimpan laporan AI agar tidak boros token
// Key: userId, Value: { reportBody: string, expiresAt: number }
const aiReportCache = new Map();

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's start date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Total Orders & Revenue Today
    const todayOrders = await Order.find({
      userId,
      createdAt: { $gte: startOfToday }
    });

    const totalOrders = todayOrders.length;
    const revenueToday = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Low Stock Items (Threshold < 15)
    const lowStockItems = await Product.find({
      userId,
      stock: { $lt: 15 }
    });
    const lowStockCount = lowStockItems.length;

    // 3. Average Review
    const reviews = await Review.find({ userId });
    let averageReview = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      averageReview = (sum / reviews.length).toFixed(1);
    }

    // 4. Recent Orders (last 5)
    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Sentiment Distribution
    const sentimentCounts = { Positif: 0, Netral: 0, Saran: 0 };
    reviews.forEach(rev => {
      if (sentimentCounts[rev.sentiment] !== undefined) {
        sentimentCounts[rev.sentiment]++;
      }
    });

    // Calculate percentages
    const totalReviews = reviews.length || 1; // avoid division by zero
    const sentiment = {
      Positif: Math.round((sentimentCounts.Positif / totalReviews) * 100),
      Netral: Math.round((sentimentCounts.Netral / totalReviews) * 100),
      Saran: Math.round((sentimentCounts.Saran / totalReviews) * 100),
    };

    // 6. Stock Status List
    const allProducts = await Product.find({ userId }).sort({ stock: 1 }).limit(4);

    // 7. AI Daily Report via Groq
    let aiReportBody = "Produk terlaris hari ini: Nasi Goreng Spesial menyumbang 30% dari total penjualan. Kami menyarankan untuk menambah stok bahan baku utama (Beras, Telur) besok mengingat tren akhir pekan. Sentimen pelanggan sangat positif terkait kecepatan pelayanan.";

    const now = Date.now();
    // Cache Key Pintar: Menggabungkan userId dengan data krusial. 
    // Jika ada pesanan baru atau stok berubah, cacheKey akan otomatis berbeda!
    const dataSignature = `${totalOrders}_${revenueToday}_${lowStockCount}`;
    const cacheKey = `${userId.toString()}_${dataSignature}`;
    const cachedData = aiReportCache.get(cacheKey);

    // Cek apakah ada cache yang masih valid untuk "kondisi data" yang persis sama
    if (cachedData && cachedData.expiresAt > now) {
      aiReportBody = cachedData.reportBody;
    } else {
      try {
        if (process.env.GROQ_API_KEY) {
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
          const criticalStockNames = allProducts.filter(p => p.stock < 15).map(p => p.name).join(', ');
  
          const prompt = `
            Anda adalah asisten AI bisnis UMKM bernama BizBuddy AI. 
            Buat laporan harian super singkat (maks 2-3 kalimat pendek) dalam bahasa Indonesia berdasarkan data toko berikut. 
            Berikan satu insight atau rekomendasi tindakan.
            Gunakan tag [bold]teks[/bold] untuk menyoroti 1 atau 2 kata kunci penting (JANGAN gunakan markdown bintang).
            
            Data Hari Ini:
            - Total Pesanan: ${totalOrders}
            - Pendapatan: Rp ${revenueToday}
            - Stok Menipis: ${lowStockCount} item (termasuk: ${criticalStockNames || 'Tidak ada'})
            - Sentimen Pelanggan: Positif ${sentiment.Positif}%, Netral ${sentiment.Netral}%, Saran ${sentiment.Saran}%
          `;
  
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
          });
  
          const responseText = chatCompletion.choices[0]?.message?.content;
          if (responseText) {
            aiReportBody = responseText.replace(/\*/g, '').trim(); 
            
            // Simpan ke cache selama  jam, TAPI HANYA untuk "dataSignature" ini
            aiReportCache.set(cacheKey, {
              reportBody: aiReportBody,
              expiresAt: now + 60 * 60 * 1000
            });
          }
        }
      } catch (aiError) {
        console.error("Groq API Error:", aiError);
        // Fallback to mock if API fails
      }
    }

    const aiReport = {
      title: "AI Daily Report",
      body: aiReportBody
    };

    res.json({
      stats: {
        totalOrders,
        revenueToday,
        lowStockCount,
        averageReview,
        totalReviews: reviews.length
      },
      aiReport,
      stockStatus: allProducts,
      recentOrders,
      sentiment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat dashboard' });
  }
};

module.exports = {
  getDashboardStats
};
