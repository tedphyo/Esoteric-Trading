const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && process.env[key] === undefined) process.env[key] = value;
    }
}

loadEnvFile(path.join(__dirname, '.env'));

// yahoo-finance2 v3: `.default` is the YahooFinance constructor, must use `new`
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Supabase Admin Client (service role — stays server-side only) ────────────
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
        authEnabled: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && supabase)
    });
});

// ── /api/historical — real daily candles from Yahoo Finance ─────────────────
app.get('/api/historical', async (req, res) => {
    try {
        const { symbol, start, end } = req.query;
        if (!symbol || !start || !end) {
            return res.status(400).json({ error: 'Missing symbol, start, or end parameters' });
        }

        // Pull extra days before start so we can compute direction on the first requested day
        const startDate = new Date(start);
        startDate.setDate(startDate.getDate() - 7);
        const adjustedStart = startDate.toISOString().split('T')[0];

        // Make end inclusive (Yahoo end date is exclusive)
        const endDate = new Date(end);
        endDate.setDate(endDate.getDate() + 1);
        const adjustedEnd = endDate.toISOString().split('T')[0];

        const result = await yf.historical(symbol, {
            period1: adjustedStart,
            period2: adjustedEnd,
            interval: '1d'
        });

        const normalized = result.map(item => ({
            date: item.date,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume
        }));

        console.log(`[API] ${symbol} ${start}→${end}: ${normalized.length} rows`);
        res.json(normalized);
    } catch (error) {
        console.error('[Backend] Error fetching historical data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ── /api/quote — single ticker real-time quote via Yahoo Finance ─────────────
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
            name: quote.longName || quote.shortName || symbol
        });
    } catch (error) {
        console.error('[API/quote] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ── /api/notes — per-user notes (requires Supabase) ─────────────────────────
// All note routes require Authorization: Bearer <supabase_jwt>
// We verify the JWT using the Supabase admin client.

async function getUserFromToken(authHeader) {
    if (!supabase || !authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
}

// GET /api/notes?entity_name=...&week_start=YYYY-MM-DD
app.get('/api/notes', async (req, res) => {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { entity_name, week_start } = req.query;
    const query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);

    if (entity_name) query.eq('entity_name', entity_name);
    if (week_start) query.gte('note_date', week_start);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/notes — upsert a single note
app.post('/api/notes', async (req, res) => {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { entity_name, note_date, content } = req.body;
    if (!entity_name || !note_date) return res.status(400).json({ error: 'Missing fields' });

    const { data, error } = await supabase
        .from('notes')
        .upsert({ user_id: user.id, entity_name, note_date, content, updated_at: new Date().toISOString() },
                 { onConflict: 'user_id,entity_name,note_date' })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// DELETE /api/notes — delete a note
app.delete('/api/notes', async (req, res) => {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { entity_name, note_date } = req.query;
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_name', entity_name)
        .eq('note_date', note_date);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

// ── /api/profile — get/set user profile ─────────────────────────────────────
app.get('/api/profile', async (req, res) => {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json(data || { user_id: user.id, display_name: '', preferred_asset: '', preferred_date: '' });
});

app.post('/api/profile', async (req, res) => {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { display_name, preferred_asset, preferred_date } = req.body;
    const { data, error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, display_name, preferred_asset, preferred_date, updated_at: new Date().toISOString() },
                 { onConflict: 'user_id' })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    if (!supabase) {
        console.warn('[Auth] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — auth routes disabled (notes/profile require Supabase)');
    } else {
        console.log('[Auth] Supabase connected');
    }
});
