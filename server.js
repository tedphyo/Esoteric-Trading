const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;

const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/config', (_req, res) => {
  res.json({
    authProvider: 'firebase',
    notesProvider: 'firestore',
    liveDataProvider: 'yahoo-finance',
  });
});

app.get('/api/historical', async (req, res) => {
  try {
    const { symbol, start, end } = req.query;
    if (!symbol || !start || !end) {
      return res.status(400).json({ error: 'Missing symbol, start, or end parameters' });
    }

    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - 7);
    const adjustedStart = startDate.toISOString().split('T')[0];

    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);
    const adjustedEnd = endDate.toISOString().split('T')[0];

    const result = await yf.historical(symbol, {
      period1: adjustedStart,
      period2: adjustedEnd,
      interval: '1d',
    });

    res.json(result.map((item) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    })));
  } catch (error) {
    console.error('[API/historical] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quote', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

    const quote = await yf.quote(symbol);
    res.json({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePct: quote.regularMarketChangePercent,
      open: quote.regularMarketOpen,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      name: quote.longName || quote.shortName || symbol,
    });
  } catch (error) {
    console.error('[API/quote] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Auth/notes use Firebase client SDK; live data uses Yahoo Finance.');
});
