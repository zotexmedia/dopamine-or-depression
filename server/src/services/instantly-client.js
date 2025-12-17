// Instantly API Client with Rate Limiting
// Based on patterns from lead-recycling-tool

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const BASE_URL = 'https://api.instantly.ai/api/v2';

// Rate limiter: 95 requests per 10 seconds, 580 per minute
class RateLimiter {
  constructor() {
    this.shortWindowRequests = [];  // 10 second window
    this.longWindowRequests = [];   // 60 second window
    this.shortLimit = 95;
    this.longLimit = 580;
  }

  async waitForSlot() {
    const now = Date.now();

    // Clean old requests
    this.shortWindowRequests = this.shortWindowRequests.filter(t => now - t < 10000);
    this.longWindowRequests = this.longWindowRequests.filter(t => now - t < 60000);

    // Calculate wait time if limits exceeded
    let waitTime = 0;

    if (this.shortWindowRequests.length >= this.shortLimit) {
      const oldest = this.shortWindowRequests[0];
      waitTime = Math.max(waitTime, 10000 - (now - oldest) + 100);
    }

    if (this.longWindowRequests.length >= this.longLimit) {
      const oldest = this.longWindowRequests[0];
      waitTime = Math.max(waitTime, 60000 - (now - oldest) + 100);
    }

    if (waitTime > 0) {
      console.log(`Rate limit - waiting ${waitTime}ms`);
      await new Promise(r => setTimeout(r, waitTime));
    }

    // Record this request
    const requestTime = Date.now();
    this.shortWindowRequests.push(requestTime);
    this.longWindowRequests.push(requestTime);
  }
}

class InstantlyClient {
  constructor() {
    this.apiKey = INSTANTLY_API_KEY;
    this.baseUrl = BASE_URL;
    this.rateLimiter = new RateLimiter();
  }

  async request(path, options = {}) {
    if (!this.apiKey) {
      throw new Error('INSTANTLY_API_KEY is not configured');
    }

    await this.rateLimiter.waitForSlot();

    const url = `${this.baseUrl}${path}`;
    const fetchOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    let lastError;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
          console.log(`Rate limited (429), waiting ${retryAfter}s before retry`);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Instantly API error ${response.status}: ${errorText}`);
        }

        return await response.json();
      } catch (err) {
        lastError = err;
        if (attempt < 5) {
          const delay = 2000 * Math.pow(2, attempt - 1);
          console.log(`Request failed (attempt ${attempt}), retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  // Get daily analytics for all campaigns
  async getDailyAnalytics(startDate, endDate, campaignStatus = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (campaignStatus !== null) params.append('campaign_status', campaignStatus);

    const url = `/campaigns/analytics/daily${params.toString() ? '?' + params.toString() : ''}`;
    const result = await this.request(url, { method: 'GET' });

    return result;
  }

  // Get campaign-level analytics (per campaign stats)
  async getCampaignAnalytics(startDate, endDate, campaignIds = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `/campaigns/analytics${params.toString() ? '?' + params.toString() : ''}`;
    const result = await this.request(url, { method: 'GET' });

    return result;
  }

  // Get aggregate analytics across all campaigns for a date range
  async getAggregateAnalytics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `/campaigns/analytics${params.toString() ? '?' + params.toString() : ''}`;
    const result = await this.request(url, { method: 'GET' });

    // Sum up all campaign stats
    const totals = {
      sent: 0,
      contacted: 0,
      replied: 0,
      bounced: 0,
      opened: 0,
      clicked: 0
    };

    if (Array.isArray(result)) {
      for (const campaign of result) {
        totals.sent += campaign.emails_sent_count || campaign.sent || 0;
        totals.contacted += campaign.contacted_count || campaign.contacted || 0;
        totals.replied += campaign.reply_count || campaign.replied || 0;
        totals.bounced += campaign.bounced_count || campaign.bounced || 0;
        totals.opened += campaign.opened_count || campaign.opened || 0;
        totals.clicked += campaign.clicked_count || campaign.clicked || 0;
      }
    }

    return totals;
  }

  // Get total sends for a specific date
  async getTotalSendsForDate(date) {
    try {
      const analytics = await this.getAggregateAnalytics(date, date);
      return analytics.sent || 0;
    } catch (err) {
      console.error(`Failed to get sends for ${date}:`, err.message);
      return 0;
    }
  }

  // Check if API is configured and working
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return { ok: false, error: 'API key not configured' };
      }

      // Try a simple request
      await this.request('/campaigns?limit=1', { method: 'GET' });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

export const instantlyClient = new InstantlyClient();
export default instantlyClient;
