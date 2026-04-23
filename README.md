# Battlefield - Esoteric Trading

Numerology-based market prediction.

Live site: https://tedphyo.github.io/Esoteric-Trading

## Live Architecture

GitHub Pages serves `index.html` as a static site. Live backtest data is fetched from the Cloudflare Worker API:

`https://esoteric-trading-api.tedphyo-esoteric-trading.workers.dev`

The Worker source is in `worker.js`.

Authentication and private Daily Notes use Firebase Authentication + Cloud Firestore directly from the static frontend. Firestore security rules in `firestore.rules` restrict each user's notes to their own UID.

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

Login/signup requires Firebase project setup:

1. Create a Firebase project.
2. Add a Web App in Firebase project settings.
3. Enable Authentication -> Sign-in method -> Email/Password.
4. Create a Cloud Firestore database.
5. Copy the Web App config into `firebase-config.js`.
6. Publish the rules in `firestore.rules` to Firestore.

The Firebase Web config is public client configuration, not a private service key. Do not commit Firebase Admin credentials or private service account keys.

## Stock Metadata

Search metadata lives in `stock-metadata.js`. Add more entries there with:

- `symbol`
- `name`
- `exchange`
- `date` in `MM/DD/YYYY` format for numerology
- `foundedLabel`
- `foundedPrecision`
- `chart`
