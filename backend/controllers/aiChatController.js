const Business = require('../models/Business');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Groq = require('groq-sdk');

async function buildBusinessContext(userId) {
  const business = await Business.findOne({ userId });
  if (!business) return 'Data bisnis tidak ditemukan.';

  // Get today's start date
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Today's orders
  const todayOrders = await Order.find({ 
    userId, 
    createdAt: { $gte: startOfToday } 
  });
  
  const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Low stock products
  const lowStockProducts = await Product.find({
    userId,
    stock: { $lt: 15 } // using < 15 as critical stock threshold
  });

  // Recent reviews
  const recentReviews = await Review.find({ userId }).sort({ createdAt: -1 }).limit(10);
  
  let totalRating = 0;
  let negativeReviewComments = [];
  
  recentReviews.forEach(r => {
    totalRating += r.rating;
    if (r.sentiment === 'negative' || r.rating <= 3) {
      negativeReviewComments.push(r.reviewText);
    }
  });

  const avgRating = recentReviews.length > 0 ? (totalRating / recentReviews.length).toFixed(1) : 0;

  // Top products calculation (simple version based on today's orders)
  const productSales = {};
  todayOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = 0;
      }
      productSales[item.productName] += item.qty;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([name, qty]) => `${name} (${qty} terjual)`);

  return `
Nama Bisnis: ${business.businessName}
Jenis Bisnis: ${business.businessType}
Pesanan hari ini: ${todayOrders.length}
Pendapatan hari ini: Rp ${totalRevenue.toLocaleString('id-ID')}
Produk terlaris hari ini: ${topProducts.join(', ') || 'Belum ada data'}
Produk stok kritis: ${lowStockProducts.map(p => p.name).join(', ') || 'Aman'}
Rata-rata rating ulasan: ${avgRating} / 5
Keluhan terbaru: ${negativeReviewComments.join(' | ') || 'Tidak ada'}
  `.trim();
}

// @desc    Chat with AI Assistant
// @route   POST /api/ai/chat
// @access  Private
const chatWithAi = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Pesan tidak boleh kosong' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'Groq API Key belum dikonfigurasi' });
    }

    const businessContext = await buildBusinessContext(userId);

    const systemPrompt = `
Kamu adalah BizBuddy, asisten AI bisnis yang cerdas, ramah, dan berbicara dalam Bahasa Indonesia yang santai namun profesional.
Kamu membantu pemilik UMKM Indonesia menganalisa data bisnis mereka dan memberikan saran yang actionable dan spesifik.

Konteks bisnis saat ini:
${businessContext}

Panduan respons:
- Jawab dalam Bahasa Indonesia yang hangat dan mudah dipahami. Sapa dengan ramah.
- Berikan angka dan data spesifik dari konteks bisnis jika diminta.
- Sertakan emoji yang relevan untuk membuat respons lebih menarik.
- Untuk pertanyaan produk/stok: berikan data konkret.
- Untuk saran: berikan 2-3 poin actionable.
- Maksimal 3 paragraf per respons. JANGAN panjang lebar.
- Jika ada saran tindakan spesifik, pastikan relevan dengan jenis bisnis.

PENTING: FORMAT DATA KHUSUS
1. Jika kamu memberikan informasi terkait produk terlaris, pendapatan, atau stok kritis, kamu BISA menyertakan data terstruktur di dalam tag <richData></richData> (Hanya 1 tag richData per pesan).
Format JSON di dalam <richData>:
Untuk produk laris: {"type": "product_highlight", "rank": 1, "name": "Nama Produk", "sold": 10, "growth": "+5%"}
Untuk pendapatan: {"type": "revenue_summary", "revenue": 50000, "comparison": "+10% vs kemarin"}
Untuk stok: {"type": "stock_alert", "criticalItems": ["Item 1", "Item 2"], "recommendation": "Saran restock"}

2. SELALU akhiri pesanmu dengan 2-3 ide pertanyaan lanjutan singkat (maksimal 5-7 kata per pertanyaan) yang bisa ditanyakan user selanjutnya. Masukkan ke dalam tag <suggestions> sebagai JSON Array.
Contoh: <suggestions>["Prediksi tren bulan depan?", "Cek review pelanggan"]</suggestions>

DILARANG menampilkan tag <richData> atau <suggestions> berantakan. Pastikan format JSON di dalamnya valid.
`;

    // Format history for Groq
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
    });

    let fullResponse = chatCompletion.choices[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";

    let richData = null;
    let suggestions = [];
    let replyText = fullResponse;

    // Extract richData
    const richDataMatch = fullResponse.match(/<richData>([\s\S]*?)<\/richData>/);
    if (richDataMatch) {
      try {
        richData = JSON.parse(richDataMatch[1].trim());
        replyText = replyText.replace(richDataMatch[0], ''); // Remove from final text
      } catch (e) {
        console.error("Failed to parse richData JSON:", e);
      }
    }

    // Extract suggestions
    const suggestionsMatch = fullResponse.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
    if (suggestionsMatch) {
      try {
        suggestions = JSON.parse(suggestionsMatch[1].trim());
        replyText = replyText.replace(suggestionsMatch[0], ''); // Remove from final text
      } catch (e) {
        console.error("Failed to parse suggestions JSON:", e);
      }
    }

    // Fallback suggestions if AI failed to generate valid JSON array
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = ["Ringkasan pesanan hari ini?", "Produk yang perlu di-restock?"];
    }

    res.json({
      reply: replyText.trim(),
      richData,
      suggestions
    });

  } catch (error) {
    console.error('Error in AI Chat:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada sistem AI' });
  }
};

module.exports = {
  chatWithAi
};
