# Battlefield - Esoteric Trading

Numerology-based market prediction.

Live site: https://tedphyo.github.io/Esoteric-Trading

## Live Architecture

GitHub Pages serves `index.html` as a static site. Live backtest data is fetched from the Cloudflare Worker API:

`https://esoteric-trading-api.tedphyo-esoteric-trading.workers.dev`

The Worker source is in `worker.js`.

## Run Locally

```bash
git clone https://github.com/tedphyo/Esoteric-Trading.git
cd Esoteric-Trading
npm install
npm start
# open http://localhost:3000
```

Local mode uses `server.js` for the same live Yahoo Finance historical data endpoints.

## API

`GET /api/historical?symbol=SPY&start=2026-01-01&end=2026-04-17`

Supported: SPY, QQQ, DIA, BTC-USD, GC=F.

## Auth

Login/signup requires real Supabase project values. The checked-in app does not expose any private Supabase service key. Put local secrets in `.env`; never commit `.env`.
