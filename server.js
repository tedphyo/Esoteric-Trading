/**
 * Battlefield — Local Development Server
 * Run: node server.js  then open http://localhost:3000
 */
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const PORT = process.env.PORT || 3000;

function fetchYahooHistorical(symbol, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const p1 = Math.floor(new Date(startDate).getTime()/1000) - 86400;
    const p2 = Math.floor(new Date(endDate).getTime()/1000) + 86400;
    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${p1}&period2=${p2}`;
    const options = { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } };
    https.get(yfUrl, options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(raw);
          const r = j?.chart?.result?.[0];
          if (!r || !r.timestamp) return reject(new Error('no data'));
          resolve(r);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function buildDirectionMap(result) {
  const map = {}, ts = result.timestamp, close = result.indicators.quote[0].close;
  for (let i = 1; i < ts.length; i++) {
    if (close[i] == null || close[i-1] == null) continue;
    const d = new Date(ts[i]*1000);
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    map[key] = close[i] > close[i-1] ? 1 : close[i] < close[i-1] ? -1 : 0;
  }
  return map;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  setCors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (pathname === '/api/historical' && req.method === 'GET') {
    const { symbol, start, end } = query;
    if (!symbol || !start || !end) { res.writeHead(400); return res.end(JSON.stringify({error:'missing params'})); }
    try {
      const result = await fetchYahooHistorical(symbol, start, end);
      const dates = buildDirectionMap(result);
      const keys = Object.keys(dates).sort();
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({symbol, start:keys[0], end:keys[keys.length-1], count:keys.length, source:'yahoo-finance-v8', dates}));
      console.log(`[API] ${symbol}: ${keys.length} days`);
    } catch(e) { res.writeHead(502); res.end(JSON.stringify({error:e.message})); }
    return;
  }
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'}); res.end(data);
    }); return;
  }
  res.writeHead(404); res.end(JSON.stringify({error:'not found'}));
});

server.listen(PORT, () => {
  console.log('\n  ◆ Battlefield server running');
  console.log(`  → http://localhost:${PORT}`);
  console.log('  Set ENABLE_LIVE_BACKTEST=true in index.html for live backtest data.\n');
});