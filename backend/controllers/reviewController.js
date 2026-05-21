const Review = require('../models/Review');
const Business = require('../models/Business');
const Groq = require('groq-sdk');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private
const getReviews = async (req, res) => {
  try {
    const { sentiment, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (sentiment && sentiment !== 'all') {
      query.sentiment = sentiment;
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat ulasan' });
  }
};

// @desc    Add single review
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { customerName, platform, rating, reviewText, sentiment, sentimentScore } = req.body;
    const userId = req.user.id;

    const business = await Business.findOne({ userId });
    if (!business) {
      return res.status(400).json({ message: 'Profil bisnis tidak ditemukan' });
    }

    const review = await Review.create({
      userId,
      businessId: business._id,
      customerName,
      platform,
      rating,
      reviewText,
      sentiment: sentiment || 'neutral',
      sentimentScore: sentimentScore || 0
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Gagal menambahkan ulasan' });
  }
};

// @desc    Analyze review with Groq AI
// @route   POST /api/reviews/analyze
// @access  Private
const analyzeReview = async (req, res) => {
  try {
    const { reviewsText, source } = req.body;
    
    if (!reviewsText) {
      return res.status(400).json({ message: 'Teks ulasan tidak boleh kosong' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'Groq API Key belum dikonfigurasi' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
Kamu adalah analis bisnis AI profesional untuk UMKM Indonesia.
Analisis ulasan pelanggan berikut. Teks ulasan mungkin berisi gabungan beberapa ulasan dari sumber: ${source.join(', ')}.

Ulasan Pelanggan:
"${reviewsText}"

Berikan output DALAM FORMAT JSON YANG SANGAT KAKU dengan struktur berikut:
{
  "positives": ["Poin positif 1", "Poin positif 2"], // Array string hal-hal baik yang disebut pelanggan
  "negatives": ["Poin negatif 1", "Poin negatif 2"], // Array string keluhan/masalah (kosongkan jika tidak ada)
  "recommendation": "Saran konkrit 1 paragraf untuk bisnis berdasarkan ulasan ini.",
  "sentiment": {
    "positive": 80, // persentase (angka)
    "neutral": 10,
    "negative": 10
  },
  "suggestedReply": "Draft balasan profesional dan empati dalam bahasa Indonesia yang siap digunakan admin untuk membalas ulasan ini."
}

RESPOND ONLY WITH VALID JSON. NO MARKDOWN. NO EXPLANATION.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    try {
      const parsedResult = JSON.parse(responseContent);
      res.json(parsedResult);
    } catch (parseError) {
      console.error("Failed to parse Groq response as JSON:", responseContent);
      res.status(500).json({ message: 'AI gagal menghasilkan analisis format JSON yang valid.' });
    }
  } catch (error) {
    console.error('Error analyzing review:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses analisis AI' });
  }
};

// @desc    Get review stats
// @route   GET /api/reviews/stats
// @access  Private
const getReviewStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await Review.find({ userId });
    
    const totalReviews = reviews.length;
    
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let totalScore = 0;

    reviews.forEach(r => {
      if (sentimentCounts[r.sentiment] !== undefined) {
        sentimentCounts[r.sentiment]++;
      }
      totalScore += r.rating;
    });

    const averageRating = totalReviews > 0 ? (totalScore / totalReviews).toFixed(1) : 0;
    
    const sentimentPercentage = {
      positive: totalReviews > 0 ? Math.round((sentimentCounts.positive / totalReviews) * 100) : 0,
      neutral: totalReviews > 0 ? Math.round((sentimentCounts.neutral / totalReviews) * 100) : 0,
      negative: totalReviews > 0 ? Math.round((sentimentCounts.negative / totalReviews) * 100) : 0,
    };

    // Dummy trending topics for now
    const trendingTopics = [
      { name: 'Kualitas Jahitan', type: 'positive' }, // Adjust to business context realistically, using generic for now
      { name: 'Rasa Makanan', type: 'positive' },
      { name: 'Harga', type: 'neutral' },
      { name: 'Pengiriman Cepat', type: 'positive' }
    ];

    res.json({
      totalReviews,
      averageRating,
      sentimentCounts,
      sentimentPercentage,
      trendingTopics
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: 'Gagal mengambil statistik ulasan' });
  }
};

module.exports = {
  getReviews,
  addReview,
  analyzeReview,
  getReviewStats
};
