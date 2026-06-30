export default async function handler(req, res) {
  // Set CORS headers so it's accessible in local development and production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/140410.KQ?interval=1d&range=1d';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with status ${response.status}`);
    }

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta) {
      throw new Error('Failed to parse stock meta data from Yahoo Finance');
    }

    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const currency = meta.currency || 'KRW';
    const regularMarketTime = meta.regularMarketTime;

    // Set caching header to avoid hitting Yahoo API too frequently (cache for 30s)
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');

    return res.status(200).json({
      success: true,
      price: price,
      previousClose: previousClose,
      currency: currency,
      timestamp: regularMarketTime * 1000 // Convert to milliseconds
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
