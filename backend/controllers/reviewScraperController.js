const Business = require('../models/Business');
const ScrapedReview = require('../models/ScrapedReview');
const ReviewAnalytics = require('../models/ReviewAnalytics');
const { scrapeGoogleReviews, mapApifyToReview } = require('../services/apifyService');
const { analyzeReviewsWithGemini } = require('../services/geminiService');
const Groq = require('groq-sdk');

// POST /api/reviews/connect-gmaps
// User connects their Google Maps listing
async function connectGoogleMaps(req, res) {
  const { googleMapsUrl } = req.body;
  const businessId = req.user?.businessId; // Ensure we get this correctly, or fetch business from req.user.id
  
  try {
    let business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Profil bisnis tidak ditemukan' });
    }

    // Validate Google Maps URL
    if (!googleMapsUrl.includes('google.com/maps') 
      && !googleMapsUrl.includes('maps.app.goo.gl')
      && !googleMapsUrl.includes('goo.gl/maps')) {
      return res.status(400).json({ 
        error: 'URL Google Maps tidak valid' 
      });
    }

    // Check if already exists
    let analytics = await ReviewAnalytics.findOne({ businessId: business._id });
    
    if (!analytics) {
      analytics = new ReviewAnalytics({
        businessId: business._id,
        googleMapsUrl,
        scrapeStatus: 'idle'
      });
      await analytics.save();
    } else {
      analytics.googleMapsUrl = googleMapsUrl;
      await analytics.save();
    }

    res.json({ 
      success: true, 
      message: 'Google Maps berhasil dihubungkan',
      analytics 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/reviews/scrape
// Trigger scraping + analysis (manual or refresh)
async function scrapeAndAnalyze(req, res) {
  try {
    let business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Profil bisnis tidak ditemukan' });
    }

    const businessId = business._id;
    const analytics = await ReviewAnalytics.findOne({ businessId });
    
    if (!analytics?.googleMapsUrl) {
      return res.status(400).json({ 
        error: 'Hubungkan Google Maps dulu' 
      });
    }

    // Check cooldown: prevent spam refresh
    // Min 1 hour between scrapes
    if (analytics.lastScrapedAt) {
      const hoursSince = (Date.now() - analytics.lastScrapedAt) / 3600000;
      if (hoursSince < 1) {
        const minutesLeft = Math.ceil((1 - hoursSince) * 60);
        return res.status(429).json({
          error: `Tunggu ${minutesLeft} menit lagi sebelum refresh`,
          cooldownMinutes: minutesLeft
        });
      }
    }

    // Update status to scraping
    analytics.scrapeStatus = 'scraping';
    await analytics.save();

    // Respond immediately (process in background)
    res.json({ 
      success: true,
      message: 'Proses scraping dimulai...',
      status: 'scraping'
    });

    // BACKGROUND PROCESS (async, no await)
    processScrapeAndAnalyze(businessId, analytics).catch(console.error);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Background processing function
async function processScrapeAndAnalyze(businessId, analytics) {
  try {
    const business = await Business.findById(businessId);

    // STEP 1: SCRAPE with Apify
    console.log('Starting Apify scrape...');
    const rawReviews = await scrapeGoogleReviews(analytics.googleMapsUrl, 200);
    
    // STEP 2: Save raw reviews to MongoDB
    // Delete old scraped reviews for this business
    await ScrapedReview.deleteMany({ businessId });
    
    const reviewDocs = rawReviews.map(item => mapApifyToReview(item, businessId));
    await ScrapedReview.insertMany(reviewDocs);
    
    // Update status
    analytics.scrapeStatus = 'analyzing';
    analytics.lastScrapedAt = new Date();
    analytics.totalReviews = reviewDocs.length;
    analytics.googlePlaceName = rawReviews[0]?.title || business.businessName;
    await analytics.save();

    // STEP 3: ANALYZE with Gemini
    console.log('Starting Gemini analysis...');
    const analysisResult = await analyzeReviewsWithGemini(
      reviewDocs,
      business.businessName,
      business.businessType
    );

    // STEP 4: Update sentiment per review (with robust fallback)
    const sentimentMap = new Map();
    if (analysisResult.reviewSentiments) {
      analysisResult.reviewSentiments.forEach(rs => {
        if (rs.reviewId) sentimentMap.set(rs.reviewId, rs);
      });
    }

    for (const doc of reviewDocs) {
      const rs = sentimentMap.get(doc.reviewId);
      // Fallback: 4-5 is positive, 3 is neutral, 1-2 is negative
      let finalSentiment = 'neutral';
      if (rs?.sentiment) {
        finalSentiment = rs.sentiment.toLowerCase();
      } else {
        finalSentiment = doc.rating >= 4 ? 'positive' : doc.rating === 3 ? 'neutral' : 'negative';
      }
      
      const finalScore = rs?.score || (doc.rating / 5);

      await ScrapedReview.findOneAndUpdate(
        { businessId, reviewId: doc.reviewId },
        { 
          sentiment: finalSentiment,
          sentimentScore: finalScore 
        }
      );
    }

    // STEP 5: Save analytics result
    analytics.sentimentBreakdown = analysisResult.sentimentBreakdown;
    analytics.averageRating = analysisResult.averageRating;
    analytics.topPositives = analysisResult.topPositives;
    analytics.topNegatives = analysisResult.topNegatives;
    analytics.trendingTopics = analysisResult.trendingTopics;
    analytics.recommendations = analysisResult.recommendations;
    analytics.overallSummary = analysisResult.overallSummary;
    analytics.analyzedCount = reviewDocs.length;
    analytics.lastAnalyzedAt = new Date();
    analytics.scrapeStatus = 'done';
    analytics.errorMessage = null;
    await analytics.save();

    console.log('Scrape & analyze complete!');

  } catch (error) {
    console.error('Pipeline error:', error);
    await ReviewAnalytics.findOneAndUpdate(
      { businessId },
      { 
        scrapeStatus: 'error',
        errorMessage: error.message 
      }
    );
  }
}

// GET /api/reviews/analytics
// Dashboard reads from DB only (fast!)
async function getAnalytics(req, res) {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ connected: false, message: 'Profil bisnis tidak ditemukan' });
    }

    const businessId = business._id;
    const analytics = await ReviewAnalytics.findOne({ businessId });
    
    if (!analytics) {
      return res.json({ 
        connected: false,
        message: 'Belum terhubung ke Google Maps'
      });
    }

    res.json({ 
      connected: true,
      analytics 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/reviews/list
// Get scraped reviews with pagination
async function getReviewList(req, res) {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Profil bisnis tidak ditemukan' });
    }

    const businessId = business._id;
    const { page=1, limit=10, sentiment } = req.query;
    
    const filter = { businessId };
    if (sentiment && sentiment !== 'all') filter.sentiment = sentiment;
    
    const reviews = await ScrapedReview
      .find(filter)
      .sort({ reviewDate: -1 })
      .skip((page-1) * limit)
      .limit(Number(limit));
    
    const total = await ScrapedReview.countDocuments(filter);
    
    res.json({ reviews, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/reviews/status
// Polling endpoint for scrape progress
async function getScrapeStatus(req, res) {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ error: 'Profil bisnis tidak ditemukan' });
    }

    const analytics = await ReviewAnalytics.findOne({ businessId: business._id });
    
    res.json({
      status: analytics?.scrapeStatus || 'idle',
      lastScrapedAt: analytics?.lastScrapedAt,
      totalReviews: analytics?.totalReviews || 0,
      errorMessage: analytics?.errorMessage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/reviews/generate-reply
// Generate reply for a single review using Gemini
async function generateReply(req, res) {
  try {
    const { reviewId, reviewText, rating, businessName } = req.body;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const prompt = `
Sebagai pemilik bisnis "${businessName}", buatlah balasan yang profesional, sopan, dan solutif untuk ulasan pelanggan berikut.
Rating: ${rating} Bintang
Review: "${reviewText}"

Balasan harus dalam bahasa Indonesia yang baik, empati (jika ada keluhan), dan tidak bertele-tele. Jangan gunakan markdown atau format tambahan, cukup teks balasannya saja.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
    });
    
    const reply = chatCompletion.choices[0]?.message?.content?.trim();
    
    res.json({ reply });
  } catch (error) {
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      return res.status(429).json({ error: 'API limit billing sudah habis' });
    }
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  connectGoogleMaps,
  scrapeAndAnalyze,
  getAnalytics,
  getReviewList,
  getScrapeStatus,
  generateReply
};
