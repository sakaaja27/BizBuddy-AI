const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_ID = 'compass~google-maps-reviews-scraper';

async function scrapeGoogleReviews(googleMapsUrl, maxReviews = 200) {
  try {
    // Step 1: Start Apify actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startUrls: [{ url: googleMapsUrl }],
          maxReviews: maxReviews,
          reviewsSort: 'newest',
          language: 'id',
          personalData: true
        })
      }
    );
    
    if (!runResponse.ok) {
      const errData = await runResponse.json();
      throw new Error(errData.error?.message || 'Failed to start Apify run');
    }
    
    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Step 2: Poll until finished
    // Timeout: 5 minutes max
    const maxWait = 300000;
    const pollInterval = 5000;
    let elapsed = 0;
    let status = 'RUNNING';

    while (status === 'RUNNING' || status === 'READY') {
      await new Promise(r => setTimeout(r, pollInterval));
      elapsed += pollInterval;

      if (elapsed > maxWait) {
        throw new Error('Apify timeout after 5 minutes');
      }

      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusData = await statusRes.json();
      status = statusData.data.status;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify run failed: ${status}`);
    }

    // Step 3: Fetch results from dataset
    const datasetId = runData.data.defaultDatasetId;
    const resultsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${maxReviews}&format=json`
    );
    const results = await resultsRes.json();
    return results;

  } catch (error) {
    throw new Error(`Apify scrape failed: ${error.message}`);
  }
}

// Map Apify response to our schema
function mapApifyToReview(item, businessId) {
  return {
    businessId,
    reviewId: item.reviewId || item.id,
    reviewerName: item.name || 'Anonim',
    reviewerAvatar: item.profilePhotoUrl || '',
    rating: item.stars || item.rating || 0,
    reviewText: item.text || item.snippet || '',
    reviewDate: item.publishedAtDate ? new Date(item.publishedAtDate) : new Date(),
    likesCount: item.likesCount || 0,
    isLocalGuide: item.isLocalGuide || false,
    ownerReply: item.responseFromOwnerText || '',
    ownerReplyDate: item.responseFromOwnerDate
      ? new Date(item.responseFromOwnerDate)
      : null,
    scrapedAt: new Date()
  };
}

module.exports = {
  scrapeGoogleReviews,
  mapApifyToReview
};
