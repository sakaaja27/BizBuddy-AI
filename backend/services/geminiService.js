const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyzeReviewsWithGemini(reviews, businessName, businessType) {
  // Prepare reviews text (max 200)
  const reviewsText = reviews
    .slice(0, 200)
    .map((r, i) => `Review ${i + 1} (${r.rating}⭐): ${r.reviewText || 'Tanpa teks'}`)
    .join('\n');

  const prompt = `
Kamu adalah analis bisnis AI untuk UMKM Indonesia.
Analisis ${reviews.length} ulasan Google Maps berikut untuk bisnis "${businessName}" (kategori: ${businessType}).

DATA ULASAN:
${reviewsText}

Berikan analisis LENGKAP dalam format JSON berikut.
Respond ONLY with valid JSON, no markdown, no explanation:

{
  "sentimentBreakdown": {
    "positive": {
      "count": <number>,
      "percentage": <number 0-100>
    },
    "neutral": {
      "count": <number>, 
      "percentage": <number 0-100>
    },
    "negative": {
      "count": <number>,
      "percentage": <number 0-100>
    }
  },
  "averageRating": <number 1-5>,
  "topPositives": [
    "<hal yang sering dipuji 1>",
    "<hal yang sering dipuji 2>",
    "<hal yang sering dipuji 3>"
  ],
  "topNegatives": [
    "<keluhan yang sering muncul 1>",
    "<keluhan yang sering muncul 2>"
  ],
  "trendingTopics": [
    "<topik/keyword yang sering disebut 1>",
    "<topik/keyword yang sering disebut 2>",
    "<topik/keyword yang sering disebut 3>"
  ],
  "recommendations": [
    "<rekomendasi actionable 1>",
    "<rekomendasi actionable 2>",
    "<rekomendasi actionable 3>"
  ],
  "overallSummary": "<ringkasan 2-3 kalimat tentang kondisi bisnis berdasarkan review>",
  "reviewSentiments": [
    {
      "reviewId": "<reviewId>",
      "sentiment": "positive|neutral|negative",
      "score": <0.0-1.0>
    }
  ]
}
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const text = chatCompletion.choices[0]?.message?.content;
    
    // Clean response & parse JSON
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    return JSON.parse(cleaned);
  } catch (error) {
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      throw new Error('API limit billing sudah habis');
    }
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

// Analyze individual review sentiment
async function analyzeSingleSentiment(reviewText, rating) {
  const prompt = `
Klasifikasikan sentimen review ini.
Rating: ${rating}/5
Review: "${reviewText}"

Respond ONLY with JSON:
{
  "sentiment": "positive|neutral|negative",
  "score": <0.0-1.0>,
  "reason": "<alasan singkat>"
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const text = chatCompletion.choices[0]?.message?.content;
    return JSON.parse(
      text.replace(/```json|```/g, '').trim()
    );
  } catch (error) {
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      throw new Error('API limit billing sudah habis');
    }
    throw error;
  }
}

module.exports = {
  analyzeReviewsWithGemini,
  analyzeSingleSentiment
};
