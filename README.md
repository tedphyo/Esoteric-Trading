# Battlefield — Esoteric Trading

Numerology-based market prediction. Live site: https://tedphyo.github.io/Esoteric-Trading

## Run locally (enables live backtest)

```bash
git clone https://github.com/tedphyo/Esoteric-Trading.git
cd Esoteric-Trading
node server.js
# open http://localhost:3000
```

App auto-detects localhost and enables live backtest data from Yahoo Finance.

## API (local only)

`GET /api/historical?symbol=SPY&start=2026-01-01&end=2026-04-17`

Supported: SPY, QQQ, DIA, BTC-USD, GC=F