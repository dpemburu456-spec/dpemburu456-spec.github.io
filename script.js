// ======================== GLOBAL VARIABLES ========================
let globalMarketData = [];      // Menyimpan 100 koin dari CoinGecko
let lastUpdateTime = null;      // Waktu update terakhir
let autoRefreshInterval = null;  // Interval auto refresh
let currentDisplayMode = 'elit'; // 'elit' atau 'populer'
let isRefreshing = false;

// DOM Elements
const marketListContainer = document.getElementById('market-list-container');
const scannerContainer = document.getElementById('scanner-container');
const loadingText = document.getElementById('loading-text');
const updateTimerElement = document.getElementById('update-timer');
const pageTitleSpan = document.getElementById('page-title-text');
const tabElitBtn = document.getElementById('tab-elit');
const tabPopulerBtn = document.getElementById('tab-populer');

// ======================== SIDEBAR FUNCTIONS ========================
window.openNav = function() {
    document.getElementById("mySidebar").style.width = "260px";
    document.getElementById("myOverlay").style.display = "block";
};

window.closeNav = function() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("myOverlay").style.display = "none";
};

// ======================== FETCH DATA FROM COINGECKO ========================
async function fetchGlobalMarketData(forceRefresh = false) {
    if (!forceRefresh && globalMarketData.length > 0 && lastUpdateTime) {
        const secondsSinceUpdate = (new Date() - lastUpdateTime) / 1000;
        if (secondsSinceUpdate < 30) return globalMarketData;
    }
    if (isRefreshing) return globalMarketData;
    isRefreshing = true;

    if (loadingText) loadingText.style.display = 'block';
    if (marketListContainer) marketListContainer.innerHTML = '<div class="loading">🌐 Mengambil data pasar global...</div>';

    try {
        const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Data kosong');

        globalMarketData = data;
        lastUpdateTime = new Date();
        updateTimerDisplay();

        if (currentDisplayMode === 'elit' || currentDisplayMode === 'populer') {
            renderMarketList(currentDisplayMode);
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        let errorMsg = `⚠️ Gagal mengambil data dari CoinGecko.<br>
        ▶️ Kemungkinan penyebab:<br>
        - Buka melalui Live Server (bukan file://)<br>
        - Rate limit API, coba tunggu sebentar<br>
        - Koneksi internet bermasalah<br><br>
        <button id="retryBtn" style="background:#fcd535; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;">Coba Lagi</button>`;
        if (marketListContainer) marketListContainer.innerHTML = `<div style="padding:20px;text-align:center;color:#cf304a;">${errorMsg}</div>`;
        document.getElementById('retryBtn')?.addEventListener('click', () => fetchGlobalMarketData(true));
        return [];
    } finally {
        isRefreshing = false;
        if (loadingText) loadingText.style.display = 'none';
    }
}

function updateTimerDisplay() {
    if (!updateTimerElement) return;
    if (lastUpdateTime) {
        const jam = lastUpdateTime.getHours().toString().padStart(2, '0');
        const menit = lastUpdateTime.getMinutes().toString().padStart(2, '0');
        const detik = lastUpdateTime.getSeconds().toString().padStart(2, '0');
        updateTimerElement.innerText = `🔄 Update: ${jam}:${menit}:${detik}`;
    } else {
        updateTimerElement.innerText = 'Menunggu data...';
    }
}

// ======================== RENDER MARKET LIST (TOP 100 / GAINERS) ========================
function renderMarketList(mode) {
    if (!marketListContainer) return;
    if (!globalMarketData.length) {
        marketListContainer.innerHTML = '<div class="loading">📡 Data belum tersedia. Tarik untuk refresh...</div>';
        return;
    }

    let dataToRender = [...globalMarketData];
    if (mode === 'populer') {
        dataToRender.sort((a, b) => (b.price_change_percentage_24h ?? -Infinity) - (a.price_change_percentage_24h ?? -Infinity));
        pageTitleSpan.innerText = '🔥 Kenaikan Tertinggi / Top Gainers 24 Jam';
    } else {
        pageTitleSpan.innerText = '👑 Pasar Global / Kapitalisasi Terbesar';
    }

    let html = '';
    for (let i = 0; i < dataToRender.length; i++) {
        const coin = dataToRender[i];
        const rank = mode === 'populer' ? i + 1 : (coin.market_cap_rank || i + 1);
        const price = coin.current_price ?? 0;
        const change24h = coin.price_change_percentage_24h ?? 0;
        const changeClass = change24h >= 0 ? 'text-green' : 'text-red';
        const changeSymbol = change24h >= 0 ? '+' : '';

        let priceFormatted;
        if (price < 0.000001) priceFormatted = price.toExponential(6);
        else if (price < 1) priceFormatted = price.toFixed(6);
        else priceFormatted = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        html += `
            <div class="crypto-row">
                <div class="coin-info-block">
                    <div class="coin-rank">#${rank}</div>
                    <img class="coin-icon-img" src="${coin.image}" alt="${coin.symbol}" onerror="this.src='https://cryptologos.cc/logos/default.png'">
                    <div class="coin-meta">
                        <div class="coin-symbol-text">${coin.symbol.toUpperCase()}</div>
                        <div class="coin-name-text">${coin.name}</div>
                    </div>
                </div>
                <div class="price-block">
                    <div class="coin-price-text">$${priceFormatted}</div>
                    <div class="percent-text ${changeClass}">${changeSymbol}${change24h.toFixed(2)}%</div>
                </div>
            </div>
        `;
    }
    marketListContainer.innerHTML = html;
}

// ======================== SWITCH TAB (Elit / Populer) ========================
window.switchTab = function(tabId) {
    window.closeNav();
    if (tabId === 'elit') {
        currentDisplayMode = 'elit';
        tabElitBtn.classList.add('active');
        tabPopulerBtn.classList.remove('active');
        marketListContainer.style.display = 'block';
        scannerContainer.style.display = 'none';
        renderMarketList('elit');
    } else if (tabId === 'populer') {
        currentDisplayMode = 'populer';
        tabPopulerBtn.classList.add('active');
        tabElitBtn.classList.remove('active');
        marketListContainer.style.display = 'block';
        scannerContainer.style.display = 'none';
        renderMarketList('populer');
    } else if (tabId === 'scanner') {
        showBinanceScanner();
    }
};

// ======================== BINANCE SCANNER ========================
window.showBinanceScanner = function() {
    window.closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    scannerContainer.innerHTML = `
        <div class="scanner-ui">
            <h3 style="margin-top:0;">🔍 Scanner Binance Live</h3>
            <p style="font-size:13px; color:#848e9c;">Cek harga & perubahan 24 jam (pair USDT)</p>
            <div class="input-group">
                <input type="text" id="binanceSymbol" class="input-field" placeholder="BTCUSDT" value="BTCUSDT" style="flex:1; width:auto;">
                <button id="btnCheckBinance" class="btn-scan" style="width:auto; padding:10px 20px;">Cek Harga</button>
            </div>
            <div id="binanceResult" style="margin-top:20px; text-align:left; background:#0b0e11; padding:15px; border-radius:12px;">
                💡 Contoh: BTCUSDT, ETHUSDT, SOLUSDT, DOGEUSDT
            </div>
        </div>
    `;
    document.getElementById('btnCheckBinance')?.addEventListener('click', async () => {
        let symbol = document.getElementById('binanceSymbol').value.trim().toUpperCase();
        if (!symbol.endsWith('USDT')) symbol += 'USDT';
        const resultDiv = document.getElementById('binanceResult');
        resultDiv.innerHTML = '<div class="loading">⏳ Mengambil data dari Binance...</div>';
        try {
            const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            if (!res.ok) throw new Error('Pair tidak ditemukan');
            const data = await res.json();
            const lastPrice = parseFloat(data.lastPrice);
            const changePercent = parseFloat(data.priceChangePercent);
            resultDiv.innerHTML = `
                <div>💰 Harga: <strong>$${lastPrice.toLocaleString()}</strong></div>
                <div>📈 Perubahan 24j: <span class="${changePercent >= 0 ? 'text-green' : 'text-red'}">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span></div>
                <div>📊 Tertinggi: $${parseFloat(data.highPrice).toLocaleString()} | Terendah: $${parseFloat(data.lowPrice).toLocaleString()}</div>
            `;
        } catch (err) {
            resultDiv.innerHTML = `<div style="color:#cf304a;">❌ ${err.message}<br>Coba format: BTCUSDT, ETHUSDT</div>`;
        }
    });
};

// ======================== DETEKTOR KOIN PUMP ========================
window.showCustomScanner = async function() {
    window.closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    await fetchGlobalMarketData(true);

    scannerContainer.innerHTML = `
        <div class="scanner-ui">
            <h3>⚡ Detektor Koin Pump</h3>
            <div class="input-group">
                <input type="number" id="pumpThreshold" placeholder="Min %" value="7" step="0.5" style="width:100px;">
                <button id="btnDetectPump" class="btn-scan" style="width:auto; padding:10px 20px;">Scan Pump</button>
            </div>
            <div id="pumpResult" style="margin-top:20px; max-height:500px; overflow-y:auto;"></div>
        </div>
    `;
    document.getElementById('btnDetectPump')?.addEventListener('click', async () => {
        let threshold = parseFloat(document.getElementById('pumpThreshold').value) || 7;
        const resultDiv = document.getElementById('pumpResult');
        resultDiv.innerHTML = '<div class="loading">🔍 Menyaring koin pump...</div>';
        await fetchGlobalMarketData(true);
        const pumpCoins = globalMarketData.filter(c => (c.price_change_percentage_24h ?? -999) >= threshold)
            .sort((a,b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
        if (pumpCoins.length === 0) {
            resultDiv.innerHTML = `<div style="padding:20px; text-align:center;">😢 Tidak ada koin naik > ${threshold}%</div>`;
            return;
        }
        let html = `<div style="font-weight:bold;">🚀 ${pumpCoins.length} koin pump > ${threshold}% :</div>`;
        for (let coin of pumpCoins.slice(0, 30)) {
            html += `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #2b2f36;">
                    <div><img src="${coin.image}" width="24" style="border-radius:50%;"> ${coin.symbol.toUpperCase()}</div>
                    <div class="text-green">+${coin.price_change_percentage_24h.toFixed(2)}%</div>
                </div>
            `;
        }
        resultDiv.innerHTML = html;
    });
};

// ======================== TOP PUMP PAGE ========================
window.showPumpPage = async function() {
    window.closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    await fetchGlobalMarketData(true);
    const topGainers = [...globalMarketData].sort((a,b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)).slice(0, 25);
    let html = `<div class="scanner-ui"><h3>🚀 Top Pump 24 Jam</h3>`;
    for (let coin of topGainers) {
        html += `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #2b2f36;">
                <div><img src="${coin.image}" width="24" style="border-radius:50%;"> ${coin.symbol.toUpperCase()} - ${coin.name}</div>
                <div class="text-green">+${coin.price_change_percentage_24h.toFixed(2)}%</div>
            </div>
        `;
    }
    html += `</div>`;
    scannerContainer.innerHTML = html;
};

// ======================== AUTO REFRESH (SETIAP 60 DETIK) ========================
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(async () => {
        await fetchGlobalMarketData(true);
        if (currentDisplayMode === 'elit' || currentDisplayMode === 'populer') {
            renderMarketList(currentDisplayMode);
        }
    }, 60000);
}

// ======================== INITIAL LOAD ========================
async function init() {
    await fetchGlobalMarketData(true);
    switchTab('elit');
    startAutoRefresh();

    // Tambahkan tombol refresh manual di header (opsional)
    const header = document.querySelector('header');
    if (header && !document.getElementById('manualRefreshBtn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'manualRefreshBtn';
        refreshBtn.innerText = '⟳';
        refreshBtn.style.cssText = 'background:none; border:none; color:#fcd535; font-size:22px; cursor:pointer; margin-left:auto;';
        refreshBtn.title = 'Refresh data manual';
        refreshBtn.onclick = () => fetchGlobalMarketData(true);
        header.appendChild(refreshBtn);
    }
}

// Jalankan saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
                }
