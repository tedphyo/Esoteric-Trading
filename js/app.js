document.addEventListener('DOMContentLoaded', () => {
    const datePicker = document.getElementById('date-picker');
    const symbolSearchInput = document.getElementById('symbol-search-input');
    const symbolSearchResults = document.getElementById('symbol-search-results');
    const symbolSelect = document.getElementById('symbol-select');
    const currentSymbolDisplay = document.getElementById('current-symbol');
    const numerologyContainer = document.getElementById('numerology-container');
    const statusDot = document.getElementById('status-dot');
    const statusIndicator = document.getElementById('status-indicator');
    const marketSPYPrice = document.getElementById('spy-price');
    const marketSPYChange = document.getElementById('spy-change');
    const marketQQQPrice = document.getElementById('qqq-price');
    const marketQQQChange = document.getElementById('qqq-change');
    const tradingViewContainer = document.getElementById('tradingview-advanced-chart');
    const chartLoading = document.getElementById('chart-loading');
    const chartSource = document.getElementById('chart-source');
    const chartTabs = document.querySelectorAll('[data-chart-symbol]');
    const bdSymbol = document.getElementById('bd-symbol');
    const bdLast = document.getElementById('bd-last');
    const bdTrend = document.getElementById('bd-trend');
    const bdRange = document.getElementById('bd-range');
    const bdHilo = document.getElementById('bd-hilo');
    const bdVolume = document.getElementById('bd-volume');
    const lastUpdatedEl = document.getElementById('last-updated');
    const signalBanner = document.getElementById('signal-banner');
    const watchlistPanel = document.getElementById('watchlist-panel');
    const watchlistToggle = document.getElementById('watchlist-toggle');
    const watchlistItems = document.getElementById('watchlist-items');

    let currentCalculations = {};
    let selectedFoundationDate = '1993-01-22';
    let selectedSymbol = currentSymbolDisplay.textContent || 'SPY';
    let spyFoundationDate = '1993-01-22';
    let qqqFoundationDate = '1999-03-10';
    let chartSymbol = 'SPY';
    let isPaused = false;
    let tradingViewWidget = null;
    let chartInterval = '15m';

    const INTERVAL_MAP = {
        '1m': { tv: '1', api: '1m' },
        '5m': { tv: '5', api: '5m' },
        '15m': { tv: '15', api: '15m' },
        '1h': { tv: '60', api: '1h' },
        'D': { tv: 'D', api: '1d' }
    };

    let chartTimer = null;
    let quoteRefreshTimer = null;
    let tvRefreshTimer = null;
    let watchlistRefreshTimer = null;

    function stopTimers() {
        if (chartTimer) clearInterval(chartTimer);
        if (quoteRefreshTimer) clearInterval(quoteRefreshTimer);
        if (tvRefreshTimer) clearInterval(tvRefreshTimer);
        if (watchlistRefreshTimer) clearInterval(watchlistRefreshTimer);
    }

    function startTimers() {
        stopTimers(); // Ensure no duplicate timers
        // Set initial timer values
        chartTimer = setInterval(() => loadChart(chartSymbol), 60 * 1000); // Chart refresh
        quoteRefreshTimer = setInterval(refreshQuoteData, 45 * 1000); // Quote data refresh
        tvRefreshTimer = setInterval(refreshTradingView, 60 * 1000); // TradingView widget refresh
        watchlistRefreshTimer = setInterval(() => { if (!document.hidden && !isPaused) { fetchWatchlist(); } }, 45 * 1000); // Watchlist refresh
    }

    function getInterval() { return INTERVAL_MAP[chartInterval] || INTERVAL_MAP['15m']; }

    // ── Load persisted state from localStorage ──
    const savedSymbol = localStorage.getItem('invictus-edge-symbol');
    const savedInterval = localStorage.getItem('invictus-edge-interval');
    if (savedSymbol && savedSymbol !== 'Custom') {
        selectedSymbol = savedSymbol;
        currentSymbolDisplay.textContent = savedSymbol;
    }
    if (savedInterval) {
        chartInterval = savedInterval;
    }

    async function makeRequest(url) {
        statusIndicator.textContent = 'Loading...';
        statusDot.style.backgroundColor = '#ffd700';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            const data = await response.json();
            statusIndicator.textContent = 'Ready';
            statusDot.style.backgroundColor = '#4caf50';
            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            statusIndicator.textContent = 'Offline';
            statusDot.style.backgroundColor = '#f59e0b';
            return { _source: 'unavailable', _error: 'Backend offline' };
        }
    }

    function getEnergySpec(n) {
        const map = {
            1: { spec: 'Initiation, leadership, impulse', tags: ['push', 'fresh start'] },
            2: { spec: 'Balance, patience, reaction', tags: ['wait', 'confirm'] },
            3: { spec: 'Expansion, communication, volatility', tags: ['expressive', 'range'] },
            4: { spec: 'Structure, discipline, support/resistance', tags: ['levels', 'rules'] },
            5: { spec: 'Movement, change, momentum', tags: ['breakout', 'adapt'] },
            6: { spec: 'Harmony, repair, mean reversion', tags: ['balance', 'fade'] },
            7: { spec: 'Analysis, hidden risk, patience', tags: ['caution', 'observe'] },
            8: { spec: 'Power, money, execution', tags: ['trend', 'size carefully'] },
            9: { spec: 'Completion, release, reversal risk', tags: ['exhaustion', 'close cycle'] },
            11: { spec: 'Master signal, sensitivity, sharp turns', tags: ['high alert', 'intuition'] },
            22: { spec: 'Master builder, structure under pressure', tags: ['institutional', 'big level'] },
            33: { spec: 'Master teacher, emotional extremes', tags: ['crowd emotion', 'discipline'] }
        };
        return map[n] || { spec: 'Neutral cycle', tags: ['neutral'] };
    }

    function renderNumerologyDashboard(data) {
        numerologyContainer.innerHTML = `
            <div class="grid-row grid-row-3">
                <div class="card card-ud"><div class="card-title">Universal Day</div><div class="card-value">${data.ud.value}<span class="card-number">/${data.ud.reduced}</span></div><div class="card-chain">UY: ${data.ud.universalYear} — UM: ${data.ud.universalMonth}</div></div>
                <div class="card card-pd"><div class="card-title">Personal Day</div><div class="card-value">${data.pd.value}<span class="card-number">/${data.pd.reduced}</span></div><div class="card-chain">PY: ${data.pd.personalYear} — PM: ${data.pd.personalMonth}</div></div>
                <div class="card instr-current"><div class="card-title">${data.symbolFoundation.symbol} Foundation</div><div class="card-value">${data.symbolFoundation.value}<span class="card-number">/${data.symbolFoundation.reduced}</span></div><div class="card-chain">${data.symbolFoundation.date}</div></div>
            </div>
            <div class="grid-row grid-row-2">
                <div class="card compat-card"><div class="card-title">${data.symbolFoundation.symbol} Universal Compatibility</div><div class="compat-text">${data.compatibility.universal}</div></div>
                <div class="card compat-card"><div class="card-title">${data.symbolFoundation.symbol} Personal Compatibility</div><div class="compat-text">${data.compatibility.personal}</div></div>
            </div>
            <div class="grid-row grid-row-2">
                <div class="card energy-card"><div class="card-title">Universal Energy Spec</div><div class="energy-spec">${data.universalEnergy.spec}</div><div class="energy-tags">${data.universalEnergy.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></div>
                <div class="card energy-card"><div class="card-title">Personal Energy Spec</div><div class="energy-spec">${data.personalEnergy.spec}</div><div class="energy-tags">${data.personalEnergy.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></div>
            </div>
            <div class="grid-row"><div class="card guardrail-card ${data.guardrail.type}"><div class="card-title">Guardrail</div><div class="guardrail-text">${data.guardrail.message}</div><div class="market-notice">A ${data.guardrail.marketBias} day for ${data.symbolFoundation.symbol}</div></div></div>`;

        document.getElementById('sig-ud').textContent = data.ud.reduced;
        document.getElementById('sig-ud-int').textContent = data.ud.interpretation;
        document.getElementById('sig-pd').textContent = data.pd.reduced;
        document.getElementById('sig-pd-int').textContent = data.pd.interpretation;
        const signalItem = document.getElementById('sig-signal');
        const signalIntItem = document.getElementById('sig-signal-int');
        signalItem.textContent = data.signal.value || '--';
        signalIntItem.textContent = data.signal.interpretation || 'No signal active';
        signalItem.parentElement.classList.remove('signal-7', 'signal-11', 'signal-28');
        if (data.signal.value) signalItem.parentElement.classList.add(`signal-${data.signal.value}`);
    }

    function updateSignalBanner(signalValue) {
        if (!signalBanner) return;
        signalBanner.classList.remove('banner-7', 'banner-11', 'banner-28', 'banner-none');
        if (signalValue === 7) {
            signalBanner.classList.add('banner-7');
            signalBanner.innerHTML = '<span>&#9888;&#65039;</span> SIGNAL 7 SETUP';
        } else if (signalValue === 11) {
            signalBanner.classList.add('banner-11');
            signalBanner.innerHTML = '<span>&#128680;</span> SIGNAL 11 SETUP';
        } else if (signalValue === 28) {
            signalBanner.classList.add('banner-28');
            signalBanner.innerHTML = '<span>&#128176;</span> SIGNAL 28 SETUP';
        } else {
            signalBanner.classList.add('banner-none');
            signalBanner.textContent = 'No cycle signal today';
        }
    }

    // ── Watchlist Panel ──
    const WATCHLIST_SYMBOLS = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA', 'MSFT'];
    let watchlistData = [];

    async function fetchWatchlist() {
        const symbolsParam = WATCHLIST_SYMBOLS.join(',');
        const data = await makeRequest(`/api/watchlist?symbols=${symbolsParam}`);
        if (data && data._source === 'unavailable') {
            watchlistData = WATCHLIST_SYMBOLS.map(sym => ({ symbol: sym, quote: { price: '--', change: 0, changePercent: 0 }, _source: 'unavailable' }));
            renderWatchlist();
        } else if (Array.isArray(data)) {
            watchlistData = data;
            renderWatchlist();
        }
    }

    function computeNumerologyAlignment(symbol) {
        if (!currentCalculations || !currentCalculations.ud || !currentCalculations.pd) return false;
        const sym = String(symbol || '').toUpperCase();
        const foundationDates = {
            'SPY': '1993-01-22',
            'QQQ': '1999-03-10',
            'NVDA': '1993-04-05',
            'AAPL': '1976-04-01',
            'TSLA': '2003-07-01',
            'MSFT': '1975-04-04'
        };
        if (!foundationDates[sym]) return false;
        try {
            const numerology = window.InvictusNumerology;
            if (!numerology) return false;
            const targetDate = new Date((datePicker.value || new Date().toISOString().split('T')[0]) + 'T00:00:00Z');
            const inst = numerology.getInstrumentReading(sym, targetDate, foundationDates[sym]);
            const ud = currentCalculations.ud.reduced;
            const instReduced = inst.foundation.reduced;
            return ud === instReduced || currentCalculations.pd.reduced === instReduced;
        } catch (e) {
            return false;
        }
    }

    function renderWatchlist() {
        if (!watchlistItems) return;
        if (!watchlistData || !watchlistData.length) {
            watchlistItems.innerHTML = '<div class="watchlist-loading">No data</div>';
            return;
        }
        watchlistItems.innerHTML = '';
        watchlistData.forEach(item => {
            const sym = String(item.symbol || '').toUpperCase();
            const unavailable = item._source === 'unavailable';
            const q = item.quote || {};
            const price = unavailable ? '--' : (Number.isFinite(Number(q.price)) ? Number(q.price).toFixed(2) : '--');
            const change = unavailable ? 0 : (Number.isFinite(Number(q.change)) ? Number(q.change) : 0);
            const changePct = unavailable ? 0 : (Number.isFinite(Number(q.changePercent)) ? Number(q.changePercent) : 0);
            const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
            const pctStr = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
            const aligned = computeNumerologyAlignment(sym);
            const card = document.createElement('div');
            card.className = `watchlist-card${chartSymbol === sym ? ' active' : ''}${unavailable ? ' unavailable' : ''}`;
            card.innerHTML = `
                <span class="wl-symbol">${sym}</span>
                <span class="wl-price">${unavailable ? '--' : '$' + price}</span>
                <span class="wl-change ${unavailable ? 'offline' : (change >= 0 ? 'positive' : 'negative')}">${unavailable ? 'Offline' : changeStr + ' (' + pctStr + ')'}</span>
                <span class="wl-num-dot ${aligned ? 'aligned' : 'not-aligned'}" title="${aligned ? 'Numerologically aligned' : 'Not aligned'}"></span>
            `;
            card.addEventListener('click', () => {
                if (sym !== chartSymbol) {
                    selectSymbol(sym);
                    loadChart(sym);
                }
            });
            watchlistItems.appendChild(card);
        });
    }

    // ── Watchlist toggle ──
    if (watchlistToggle && watchlistPanel) {
        let watchlistCollapsed = false;
        try {
            const saved = localStorage.getItem('invictus-edge-watchlist-collapsed');
            if (saved === 'true') watchlistCollapsed = true;
        } catch (e) { /* ignore */ }
        if (watchlistCollapsed) {
            watchlistPanel.classList.add('collapsed');
            watchlistToggle.innerHTML = '&raquo;';
        }
        watchlistToggle.addEventListener('click', () => {
            watchlistCollapsed = !watchlistCollapsed;
            watchlistPanel.classList.toggle('collapsed', watchlistCollapsed);
            watchlistToggle.innerHTML = watchlistCollapsed ? '&raquo;' : '&laquo;';
            try {
                localStorage.setItem('invictus-edge-watchlist-collapsed', String(watchlistCollapsed));
            } catch (e) { /* ignore */ }
        });
    }

    async function fetchAndRenderNumerology(date, symbol, foundationDate) {
        try {
            const numerology = window.InvictusNumerology;
            const targetDate = new Date(date + 'T00:00:00Z');
            const daily = numerology.getDailyReading(targetDate);
            const instrument = numerology.getInstrumentReading(symbol, targetDate, foundationDate);
            const ud = daily.universal.day;
            const pd = daily.personal.day;
            const inst = instrument.foundation;
            const universalEnergy = getEnergySpec(ud.reduced);
            const personalEnergy = getEnergySpec(pd.reduced);
            const alignment = ud.reduced === inst.reduced || pd.reduced === inst.reduced;
            currentCalculations = {
                ud: { value: ud.compound, reduced: ud.reduced, display: ud.display, universalYear: daily.universal.year.display, universalMonth: daily.universal.month.display, interpretation: universalEnergy.spec },
                pd: { value: pd.compound, reduced: pd.reduced, display: pd.display, personalYear: daily.personal.year.display, personalMonth: daily.personal.month.display, interpretation: personalEnergy.spec },
                symbolFoundation: { symbol, value: inst.compound, reduced: inst.reduced, date: foundationDate },
                compatibility: {
                    universal: `${symbol} foundation ${inst.display} vs Universal Day ${ud.display} — ${ud.reduced === inst.reduced ? 'aligned' : 'not aligned'}`,
                    personal: `${symbol} foundation ${inst.display} vs Ted Personal Day ${pd.display} — ${pd.reduced === inst.reduced ? 'aligned' : 'not aligned'}`
                },
                universalEnergy, personalEnergy,
                guardrail: { type: alignment ? 'aligned' : 'neutral', message: alignment ? `${symbol} is numerologically aligned today. Still require chart confirmation.` : `${symbol} has no direct numerology alignment today. Let price/VWAP confirm.`, marketBias: alignment ? 'heightened attention' : 'neutral/planning' },
                signal: { value: [7, 11, 28].includes(pd.compound) ? pd.compound : null, interpretation: [7, 11, 28].includes(pd.compound) ? 'Cycle signal active — use as timing context, not standalone entry.' : 'No special Ted cycle signal active.' }
            };
            renderNumerologyDashboard(currentCalculations);
            updateSignalBanner(currentCalculations.signal.value);
        } catch (error) {
            console.error('Error calculating numerology:', error);
            numerologyContainer.innerHTML = `<div class="numerology-unavailable"><div class="card-title">Numerology</div><div class="unavailable-label">Cycle calculation unavailable</div></div>`;
        }
    }

    function fmt(n, d = 2) { return Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '--'; }
    function formatVolume(n) { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n || 0); }

    function toTradingViewSymbol(symbol) {
        const clean = String(symbol || 'SPY').toUpperCase().trim();
        if (clean.includes(':')) return clean;
        if (clean === 'SPY' || clean === 'QQQ') return `BATS:${clean}`;
        return `NASDAQ:${clean}`;
    }

    function tradingViewEmbedUrl(symbol) {
        const cfg = getInterval();
        const config = {
            symbol: toTradingViewSymbol(symbol),
            interval: cfg.tv,
            hide_side_toolbar: '0',
            allow_symbol_change: '1',
            save_image: '1',
            details: '1',
            theme: 'dark',
            style: '1',
            timezone: 'America/Chicago',
            withdateranges: '1',
            studies: [
                'STD;Volume',
                'STD;VWAP',
                'STD;EMA',
                'STD;Relative_Strength_Index'
            ]
        };
        return `https://s.tradingview.com/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en#${encodeURIComponent(JSON.stringify(config))}`;
    }

    function renderTradingViewWidget(symbol) {
        if (!tradingViewContainer) return;
        chartLoading.textContent = `Loading TradingView ${symbol}...`;
        chartLoading.style.display = 'flex';
        tradingViewContainer.src = tradingViewEmbedUrl(symbol);
        tradingViewContainer.onload = () => setTimeout(() => { chartLoading.style.display = 'none'; }, 900);
        tradingViewContainer.onerror = () => {
            console.warn('TradingView iframe load error for', symbol);
            chartLoading.textContent = 'Chart widget unavailable';
        };
        // Timeout fallback — hide loading if iframe takes >15s
        setTimeout(() => {
            if (chartLoading.style.display !== 'none') {
                chartLoading.style.display = 'none';
            }
        }, 15000);
    }

    function renderBreakdown(chart) {
        if (!chart || chart._source === 'unavailable') {
            bdSymbol.textContent = chartSymbol || '---';
            bdLast.textContent = '---';
            bdTrend.textContent = 'Breakdown unavailable';
            bdRange.textContent = '---';
            bdHilo.textContent = '---';
            bdVolume.textContent = '---';
            if (chartSource) chartSource.textContent = 'Chart data unavailable';
            return;
        }
        const bars = chart.bars || [];
        if (!bars.length) return;
        const first = bars[0];
        const last = bars[bars.length - 1];
        const high = Math.max(...bars.map(b => b.high));
        const low = Math.min(...bars.map(b => b.low));
        const volume = bars.reduce((sum, b) => sum + (b.volume || 0), 0);
        const change = last.close - first.open;
        const changePct = change / first.open * 100;
        bdSymbol.textContent = chart.symbol;
        bdLast.textContent = `$${fmt(last.close)} (${change >= 0 ? '+' : ''}${fmt(change)} / ${changePct >= 0 ? '+' : ''}${fmt(changePct)}%)`;
        bdTrend.textContent = change > 0 ? 'Uptrend from first candle' : change < 0 ? 'Downtrend from first candle' : 'Flat rotation';
        bdRange.textContent = `$${fmt(high - low)} intraday range`;
        bdHilo.textContent = `$${fmt(high)} / $${fmt(low)}`;
        bdVolume.textContent = formatVolume(volume);
        chartSource.textContent = `${chart.symbol} ${chart.interval} • ${chart.marketState} • ${new Date(chart.timestamp).toLocaleTimeString()}`;
    }

    async function loadChart(symbol) {
        try {
            chartSymbol = symbol;
            chartLoading.textContent = `Loading ${symbol} chart...`;
            chartLoading.style.display = 'flex';
            chartTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.chartSymbol === symbol));
            renderTradingViewWidget(symbol);
            const chart = await makeRequest(`/api/chart/${symbol}?range=1d&interval=5m`);
            renderBreakdown(chart);
            chartLoading.style.display = 'none';
            if (watchlistItems && watchlistData.length) {
                watchlistItems.querySelectorAll('.watchlist-card').forEach(card => {
                    const symEl = card.querySelector('.wl-symbol');
                    const sym = symEl ? symEl.textContent.trim() : '';
                    card.classList.toggle('active', sym === symbol);
                });
            }
        } catch (error) {
            console.error('Chart load failed:', error);
            chartLoading.textContent = 'Chart unavailable';
        }
    }

    async function fetchMarketData(symbol) {
        const quoteData = await makeRequest(`/api/quote/${symbol}`);
        const metaData = await makeRequest(`/api/symbol-meta/${symbol}`);
        const quoteOffline = quoteData && quoteData._source === 'unavailable';
        const updateMarketCard = (priceElement, changeElement, price, change, changePercent) => {
            if (quoteOffline) {
                priceElement.textContent = '--';
                changeElement.textContent = 'Live unavailable';
                changeElement.className = 'change offline';
                return;
            }
            priceElement.textContent = price ? parseFloat(price).toFixed(2) : 'N/A';
            if (Number.isFinite(Number(change))) {
                const changeVal = parseFloat(change);
                changeElement.textContent = `${changeVal > 0 ? '+' : ''}${changeVal.toFixed(2)} (${parseFloat(changePercent).toFixed(2)}%)`;
                changeElement.className = `change ${changeVal > 0 ? 'positive' : 'negative'}`;
            } else {
                changeElement.textContent = 'N/A';
                changeElement.className = 'change';
            }
        };
        if (symbol === 'SPY') updateMarketCard(marketSPYPrice, marketSPYChange, quoteData.price, quoteData.change, quoteData.changePercent);
        else if (symbol === 'QQQ') updateMarketCard(marketQQQPrice, marketQQQChange, quoteData.price, quoteData.change, quoteData.changePercent);
        else {
            marketSPYPrice.parentElement.querySelector('.symbol').textContent = symbol;
            updateMarketCard(marketSPYPrice, marketSPYChange, quoteData.price, quoteData.change, quoteData.changePercent);
            marketSPYPrice.parentElement.classList.add('instr-current');
            marketQQQPrice.parentElement.querySelector('.symbol').textContent = 'QQQ';
            marketQQQPrice.textContent = '---';
            marketQQQChange.textContent = '---';
            marketQQQChange.className = 'change';
        }
        const targetFoundationDate = (metaData && metaData.foundationDate) || (symbol === 'SPY' ? spyFoundationDate : (symbol === 'QQQ' ? qqqFoundationDate : null));
        if (targetFoundationDate) selectedFoundationDate = targetFoundationDate;
        const today = datePicker.value || new Date().toISOString().split('T')[0];
        fetchAndRenderNumerology(today, symbol, targetFoundationDate);
    }

    async function handleSearchInput() {
        const query = symbolSearchInput.value.trim();
        symbolSearchResults.innerHTML = '';
        if (query.length < 2) { symbolSearchResults.style.display = 'none'; return; }
        const results = await makeRequest(`/api/search/${query}`);
        if (results && results._source === 'unavailable') {
            const div = document.createElement('div');
            div.className = 'search-result-item dim';
            div.textContent = 'Search unavailable';
            symbolSearchResults.appendChild(div);
        } else if (results && results.length > 0) {
            results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = `${item.symbol} - ${item.name} (${item.exchange})`;
                div.addEventListener('click', () => { selectSymbol(item.symbol); symbolSearchResults.style.display = 'none'; });
                symbolSearchResults.appendChild(div);
            });
        } else {
            const div = document.createElement('div');
            div.className = 'search-result-item dim';
            div.textContent = 'No results found';
            symbolSearchResults.appendChild(div);
        }
        symbolSearchResults.style.display = 'block';
    }

    // ── State persistence ──
    function saveState() {
        try {
            localStorage.setItem('invictus-edge-symbol', selectedSymbol);
            localStorage.setItem('invictus-edge-interval', chartInterval);
        } catch (e) {
            console.warn('localStorage write failed:', e);
        }
    }

    // ── Last updated badge ──
    function updateLastUpdated() {
        if (!lastUpdatedEl) return;
        const now = new Date();
        const ts = now.toLocaleTimeString('en-US', { hour12: false });
        lastUpdatedEl.textContent = `Last updated: ${ts}`;
        lastUpdatedEl.className = 'last-updated-badge fresh';
        if (document.hidden) {
            lastUpdatedEl.className = 'last-updated-badge paused';
        }
    }

    // ── Refresh intervals ──
    async function refreshQuoteData() {
        if (document.hidden || isPaused) return;
        try {
            await fetchMarketData(selectedSymbol);
            updateLastUpdated();
        } catch (e) {
            console.warn('Quote refresh failed:', e);
            if (lastUpdatedEl) {
                lastUpdatedEl.className = 'last-updated-badge stale';
            }
        }
    }

    function refreshTradingView() {
        if (document.hidden || isPaused) return;
        if (tradingViewWidget) {
            tradingViewWidget.contentWindow.postMessage({ type: 'setSymbol', symbol: toTradingViewSymbol(chartSymbol) }, '*');
        }
    }

    // ── TradingView Chart Widget ──
    function initTradingViewChart(symbol) {
        // This function is intended to be called when the TradingView iframe is ready to receive messages
        // However, the current setup reloads the iframe for every symbol change, invalidating previous widget references.
        // If we want to use postMessage for symbol changes, the iframe must be persistent.
        // For now, renderTradingViewWidget handles the iframe source change directly.
        console.warn("initTradingViewChart is redundant with current iframe loading strategy, consider refactoring.");
    }

    // --- Price Ticker ---
    // (Existing price ticker logic here, if any. No explicit ticker functions found in previous analysis.)

    // --- Search functionality ---
    symbolSearchInput.addEventListener('input', handleSearchInput);
    symbolSearchInput.addEventListener('focus', handleSearchInput);
    symbolSelect.addEventListener('change', () => selectSymbol(symbolSelect.value));
    symbolSearchResults.addEventListener('mouseleave', () => {
        // Delay hide to allow click on search results
        setTimeout(() => {
            symbolSearchResults.style.display = 'none';
        }, 300);
    });

    datePicker.addEventListener('change', () => {
        localStorage.setItem('invictus-edge-date', datePicker.value);
        fetchAndRenderNumerology(datePicker.value, selectedSymbol, selectedFoundationDate);
    });

    // ── Initial setup ──
    async function setupInitialState() {
        // Set initial date to today
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = localStorage.getItem('invictus-edge-date') || today;

        // Fetch initial data for market cards
        await Promise.allSettled([
            fetchMarketData('SPY'),
            fetchMarketData('QQQ')
        ]).then(() => {
            // After initial fetches, load the chart with the selected symbol
            loadChart(selectedSymbol);
        }).catch(err => console.error("Initial market data fetch failed:", err));

        // Fetch initial watchlist data
        await fetchWatchlist();
    }

    // --- Event Listeners ---
    document.querySelectorAll('[data-chart-interval]').forEach(btn => {
        btn.addEventListener('click', () => {
            chartInterval = btn.dataset.chartInterval;
            localStorage.setItem('invictus-edge-interval', chartInterval);
            document.querySelectorAll('[data-chart-interval]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTradingViewWidget(chartSymbol); // Re-render widget with new interval
        });
    });

    chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const symbol = tab.dataset.chartSymbol;
            selectSymbol(symbol);
            loadChart(symbol);
        });
    });

    function selectSymbol(newSymbol) {
        selectedSymbol = newSymbol;
        currentSymbolDisplay.textContent = newSymbol;
        symbolSelect.value = newSymbol;
        localStorage.setItem('invictus-edge-symbol', newSymbol);
        // Clear old market card highlight
        marketSPYPrice.parentElement.classList.remove('instr-current');
        marketQQQPrice.parentElement.classList.remove('instr-current');
        // Update new market card highlight
        if (newSymbol === 'SPY') {
            marketSPYPrice.parentElement.classList.add('instr-current');
            selectedFoundationDate = spyFoundationDate;
        } else if (newSymbol === 'QQQ') {
            marketQQQPrice.parentElement.classList.add('instr-current');
            selectedFoundationDate = qqqFoundationDate;
        } else { // Custom symbol
            // Attempt to get foundation date for custom symbol
            fetchMarketData(newSymbol);
        }
        const today = datePicker.value || new Date().toISOString().split('T')[0];
        fetchAndRenderNumerology(today, newSymbol, selectedFoundationDate);
    }

    // Initial calls
    setupInitialState().then(() => {
        startTimers();
        updateLastUpdated();
        fetchWatchlist();
    }).catch(err => console.error("Initial setup failed:", err));

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page is visible again, refresh data and restart timers if needed
            fetchMarketData(selectedSymbol);
            fetchWatchlist();
            startTimers(); // Ensure timers are running
        } else {
            // Page is hidden, pause timers optionally
            // stopTimers(); // Optional: pause timers when tab is not active
        }
    });
});
