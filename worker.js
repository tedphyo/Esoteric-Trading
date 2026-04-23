const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function parseDateParam(value) {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKeyFromUnixSeconds(seconds) {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

async function fetchYahooHistorical(symbol, start, end) {
  const startDate = parseDateParam(start);
  const endDate = parseDateParam(end);
  if (!symbol || !startDate || !endDate) {
    return json({ error: 'Missing or invalid symbol, start, or end parameters' }, 400);
  }

  const period1 = Math.floor(startDate.getTime() / 1000) - 7 * 86400;
  const period2 = Math.floor(endDate.getTime() / 1000) + 86400;
  const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/'
    + encodeURIComponent(symbol)
    + '?interval=1d&period1=' + period1
    + '&period2=' + period2;

  const upstream = await fetch(yahooUrl, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
  });
  if (!upstream.ok) return json({ error: 'Yahoo Finance HTTP ' + upstream.status }, 502);

  const payload = await upstream.json();
  const result = payload && payload.chart && payload.chart.result && payload.chart.result[0];
  const quote = result && result.indicators && result.indicators.quote && result.indicators.quote[0];
  if (!result || !Array.isArray(result.timestamp) || !quote) {
    return json({ error: 'No historical data returned' }, 502);
  }

  const rows = result.timestamp.map((seconds, index) => ({
    date: dateKeyFromUnixSeconds(seconds),
    open: quote.open && quote.open[index],
    high: quote.high && quote.high[index],
    low: quote.low && quote.low[index],
    close: quote.close && quote.close[index],
    volume: quote.volume && quote.volume[index],
  })).filter((row) => row.close != null);

  return json(rows);
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/api/health') {
      return json({ ok: true, service: 'esoteric-trading-api' });
    }
    if (url.pathname === '/api/config') {
      return json({ authEnabled: false, supabaseUrl: '', supabaseAnonKey: '' });
    }
    if (url.pathname === '/api/historical' && request.method === 'GET') {
      return fetchYahooHistorical(url.searchParams.get('symbol'), url.searchParams.get('start'), url.searchParams.get('end'));
    }
    return json({ error: 'Not found' }, 404);
  },
};
