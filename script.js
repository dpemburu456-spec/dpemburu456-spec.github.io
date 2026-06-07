// ======================== GLOBAL VARIABLES ========================
let globalMarketData = [];
let lastUpdateTime = null;
let autoRefreshInterval = null;
let currentDisplayMode = 'elit'; // 'elit', 'populer', 'sniper'
let isRefreshing = false;

// Sniper Scanner variables
let sniperScanning = false;
let sniperInterval = null;
let priceHistory = {}; // menyimpan array harga sebelumnya per coin
let historyLength = 4;
let volumeMin = 0;
let volumeMax = 900000000; // 900M
let scanIntervalSec = 2.5;
let pumpThresholdPercent = 3; // minimal kenaikan dalam interval terakhir

// Telegram config (isi dengan milik Anda)
const TELEGRAM_BOT_TOKEN = "7ufge3FrWNtaGBNx5AEysvvEyudCmnk4QBWurLmTxdjn";
const TELEGRAM_CHAT_ID = "8294553147";

// DOM Elements
const marketListContainer = document.getElementById('market-list-container');
const scannerContainer = document.getElementById('scanner-container');
const sniperContainer = document.getElementById('sniper-container');
const loadingText = document.getElementById('loading-text');
const updateTimerElement = document.getElementById('update-timer');
const pageTitleSpan = document.getElementById('page-title-text');
const tabElitBtn = document.getElementById('tab-elit');
const tabPopulerBtn = document.getElementById('tab-populer');
const tabSniperBtn = document.getElementById('tab-sniper');

// ======================== SIDEBAR ========================
window.openNav = function() {
    document.getElementById("mySidebar").style.width = "260px";
    document.getElementById("myOverlay").style.display = "block";
};
window.closeNav = function() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("myOverlay").style.display = "none";
};

// ======================== FETCH COINGECKO DATA ========================
async function fetchGlobalMarketData(forceRefresh = false) {
    if (!forceRefresh && globalMarketData.length > 0 && lastUpdateTime) {
        const secondsSinceUpdate = (new Date() - lastUpdateTime) / 1000;
        if (secondsSinceUpdate < 30) return globalMarketData;
    }
    if (isRefreshing) return globalMarketData;
    isRefreshing = true;
    if (loadingText) loadingText.style.display = 'block';
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
        console.error(error);
        if (marketListContainer) {
            marketListContainer.innerHTML = `<div style="padding:20px;text-align:center;color:#cf304a;">⚠️ Gagal ambil data. Coba refresh manual.<br><button id="retryBtn" style="background:#fcd535;border:none;padding:8px 16px;border-radius:8px;">Coba Lagi</button></div>`;
            document.getElementById('retryBtn')?.addEventListener('click', () => fetchGlobalMarketData(true));
        }
        return [];
    } finally {
        isRefreshing = false;
        if (loadingText) loadingText.style.display = 'none';
    }
}

function updateTimerDisplay() {
    if (updateTimerElement && lastUpdateTime) {
        const jam = lastUpdateTime.getHours().toString().padStart(2,'0');
        const menit = lastUpdateTime.getMinutes().toString().padStart(2,'0');
        const detik = lastUpdateTime.getSeconds().toString().padStart(2,'0');
        updateTimerElement.innerText = `🔄 Update: ${jam}:${menit}:${detik}`;
    } else if (updateTimerElement) {
        updateTimerElement.innerText = 'Menunggu data...';
    }
}

function renderMarketList(mode) {
    if (!marketListContainer) return;
    if (!globalMarketData.length) {
        marketListContainer.innerHTML = '<div class="loading">📡 Data belum tersedia.</div>';
        return;
    }
    let dataToRender = [...globalMarketData];
    if (mode === 'populer') {
        dataToRender.sort((a,b) => (b.price_change_percentage_24h ?? -Infinity) - (a.price_change_percentage_24h ?? -Infinity));
        pageTitleSpan.innerText = '🔥 Kenaikan Tertinggi / Top Gainers 24 Jam';
    } else {
        pageTitleSpan.innerText = '👑 Pasar Global / Kapitalisasi Terbesar';
    }
    let html = '';
    for (let i=0; i<dataToRender.length; i++) {
        const coin = dataToRender[i];
        const rank = mode === 'populer' ? i+1 : (coin.market_cap_rank || i+1);
        const price = coin.current_price ?? 0;
        const change24h = coin.price_change_percentage_24h ?? 0;
        const changeClass = change24h >= 0 ? 'text-green' : 'text-red';
        let priceFormatted = price < 1 ? price.toFixed(6) : price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
        html += `<div class="crypto-row">
            <div class="coin-info-block">
                <div class="coin-rank">#${rank}</div>
                <img class="coin-icon-img" src="${coin.image}" onerror="this.src='https://cryptologos.cc/logos/default.png'">
                <div class="coin-meta">
                    <div class="coin-symbol-text">${coin.symbol.toUpperCase()}</div>
                    <div class="coin-name-text">${coin.name}</div>
                </div>
            </div>
            <div class="price-block">
                <div class="coin-price-text">$${priceFormatted}</div>
                <div class="percent-text ${changeClass}">${change24h>=0?'+':''}${change24h.toFixed(2)}%</div>
            </div>
        </div>`;
    }
    marketListContainer.innerHTML = html;
}

// ======================== SWITCH TAB ========================
window.switchTab = async function(tabId) {
    window.closeNav();
    // Sembunyikan semua container
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'none';
    sniperContainer.style.display = 'none';
    if (tabId === 'elit') {
        currentDisplayMode = 'elit';
        tabElitBtn.classList.add('active');
        tabPopulerBtn.classList.remove('active');
        if(tabSniperBtn) tabSniperBtn.classList.remove('active');
        marketListContainer.style.display = 'block';
        renderMarketList('elit');
    } else if (tabId === 'populer') {
        currentDisplayMode = 'populer';
        tabPopulerBtn.classList.add('active');
        tabElitBtn.classList.remove('active');
        if(tabSniperBtn) tabSniperBtn.classList.remove('active');
        marketListContainer.style.display = 'block';
        renderMarketList('populer');
    } else if (tabId === 'sniper') {
        currentDisplayMode = 'sniper';
        if(tabSniperBtn) tabSniperBtn.classList.add('active');
        tabElitBtn.classList.remove('active');
        tabPopulerBtn.classList.remove('active');
        sniperContainer.style.display = 'block';
        await buildSniperUI();
    } else {
        // fallback
        marketListContainer.style.display = 'block';
    }
};

// ======================== SNIPER SCANNER UI ========================
async function buildSniperUI() {
    if (!sniperContainer) return;
    sniperContainer.innerHTML = `
        <div class="scanner-ui">
            <h3>🎯 Sniper Scanner (Volume & Price Surge)</h3>
            <p style="font-size:12px; color:#fcd535;">Deteksi koin berpotensi pump berdasarkan volume & lonjakan harga intra-interval</p>
            <div style="display:grid; gap:12px; margin:20px 0;">
                <div><label>Volume Start (USD)</label><br><input type="number" id="volStart" value="0" step="1000000" class="input-field" style="width:100%;"></div>
                <div><label>Volume End (USD)</label><br><input type="number" id="volEnd" value="900000000" step="10000000" class="input-field" style="width:100%;"></div>
                <div><label>Interval (detik)</label><br><input type="number" id="intervalSec" value="2.5" step="0.5" class="input-field" style="width:100%;"></div>
                <div><label>History (berapa kali harga disimpan)</label><br><input type="number" id="historyCount" value="4" step="1" min="2" max="10" class="input-field" style="width:100%;"></div>
                <div><label>Minimal kenaikan % dalam interval terakhir</label><br><input type="number" id="pumpThreshold" value="3" step="0.5" class="input-field" style="width:100%;"></div>
            </div>
            <button id="startSniperBtn" class="btn-scan" style="background:#02c076;">▶ MULAI SCAN</button>
            <button id="stopSniperBtn" class="btn-scan" style="background:#cf304a; margin-top:10px; display:none;">⏹ STOP SCAN</button>
            <div id="sniperLog" style="margin-top:20px; background:#0b0e11; padding:10px; border-radius:8px; max-height:300px; overflow-y:auto; font-size:12px; text-align:left;"></div>
        </div>
    `;

    document.getElementById('startSniperBtn').onclick = () => startSniperScanning();
    document.getElementById('stopSniperBtn').onclick = () => stopSniperScanning();
}

async function startSniperScanning() {
    if (sniperScanning) return;
    // Ambil nilai dari UI
    volumeMin = parseFloat(document.getElementById('volStart').value) || 0;
    volumeMax = parseFloat(document.getElementById('volEnd').value) || 900000000;
    scanIntervalSec = parseFloat(document.getElementById('intervalSec').value) || 2.5;
    historyLength = parseInt(document.getElementById('historyCount').value) || 4;
    pumpThresholdPercent = parseFloat(document.getElementById('pumpThreshold').value) || 3;

    // Reset history
    priceHistory = {};

    // Tampilkan tombol stop
    document.getElementById('startSniperBtn').style.display = 'none';
    document.getElementById('stopSniperBtn').style.display = 'block';
    sniperScanning = true;
    logToSniper('✅ Sniper scanner dimulai. Interval: ' + scanIntervalSec + ' detik');
    // Langsung scan sekali
    await performSniperScan();
    // Set interval
    if (sniperInterval) clearInterval(sniperInterval);
    sniperInterval = setInterval(async () => {
        if (sniperScanning) await performSniperScan();
    }, scanIntervalSec * 1000);
}

function stopSniperScanning() {
    if (sniperInterval) {
        clearInterval(sniperInterval);
        sniperInterval = null;
    }
    sniperScanning = false;
    document.getElementById('startSniperBtn').style.display = 'block';
    document.getElementById('stopSniperBtn').style.display = 'none';
    logToSniper('⏹ Scanner dihentikan.');
}

async function performSniperScan() {
    // Ambil data pasar terbaru
    await fetchGlobalMarketData(true);
    if (!globalMarketData.length) return;

    let detectedCoins = [];
    for (let coin of globalMarketData) {
        const symbol = coin.symbol.toUpperCase();
        const currentPrice = coin.current_price;
        const volume = coin.total_volume; // volume 24h dalam USD
        if (volume < volumeMin || volume > volumeMax) continue;

        // Simpan history harga
        if (!priceHistory[symbol]) priceHistory[symbol] = [];
        priceHistory[symbol].push(currentPrice);
        if (priceHistory[symbol].length > historyLength) priceHistory[symbol].shift();

        // Perlu minimal 2 data untuk membandingkan
        if (priceHistory[symbol].length < 2) continue;

        const prevPrice = priceHistory[symbol][priceHistory[symbol].length-2];
        const priceChangePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
        
        if (priceChangePercent >= pumpThresholdPercent) {
            // Terdeteksi pump dalam interval ini
            detectedCoins.push({
                symbol: symbol,
                name: coin.name,
                price: currentPrice,
                change: priceChangePercent,
                volume: volume,
                image: coin.image
            });
        }
    }

    if (detectedCoins.length > 0) {
        // Urutkan dari % tertinggi
        detectedCoins.sort((a,b) => b.change - a.change);
        for (let hit of detectedCoins.slice(0,5)) {
            const message = `🚨 *SNIPER DETECTED* 🚨\nCoin: ${hit.symbol} (${hit.name})\nHarga: $${hit.price.toFixed(6)}\nKenaikan dalam ${scanIntervalSec} detik: +${hit.change.toFixed(2)}%\nVolume 24j: $${hit.volume.toLocaleString()}\nWaktu: ${new Date().toLocaleTimeString()}`;
            logToSniper(`🎯 ${hit.symbol} +${hit.change.toFixed(2)}% dalam ${scanIntervalSec}s`);
            sendTelegramMessage(message);
        }
    } else {
        logToSniper(`🔎 Scan pada ${new Date().toLocaleTimeString()} - Tidak ada koin memenuhi kriteria`);
    }
}

function logToSniper(msg) {
    const logDiv = document.getElementById('sniperLog');
    if (logDiv) {
        const p = document.createElement('div');
        p.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logDiv.appendChild(p);
        logDiv.scrollTop = logDiv.scrollHeight;
        if (logDiv.children.length > 50) logDiv.removeChild(logDiv.children[0]);
    }
}

// ======================== TELEGRAM NOTIFICATION ========================
async function sendTelegramMessage(text) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "7ufge3FrWNtaGBNx5AEysvvEyudCmnk4QBWurLmTxdjn" && TELEGRAM_CHAT_ID === "8294553147") {
        // Gunakan token yang sudah diberikan user
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        if (!response.ok) throw new Error('Gagal kirim ke Telegram');
        console.log('Telegram notifikasi terkirim');
    } catch (err) {
        console.error('Telegram error:', err);
        logToSniper(`❌ Gagal kirim notifikasi Telegram: ${err.message}`);
    }
}

// ======================== OTHER SCANNERS (detektor pump, binance, top pump) ========================
window.showCustomScanner = async function() {
    window.closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    sniperContainer.style.display = 'none';
    await fetchGlobalMarketData(true);
    scannerContainer.innerHTML = `<div class="scanner-ui"><h3>⚡ Detektor Koin Pump</h3><div class="input-group"><input type="number" id="pumpThresholdSimple" placeholder="Min %" value="7" step="0.5"><button id="btnDetectPumpSimple">Scan Pump</button></div><div id="pumpResultSimple"></div></div>`;
    document.getElementById('btnDetectPumpSimple').onclick = async () => {
        let thr = parseFloat(document.getElementById('pumpThresholdSimple').value) || 7;
        const resDiv = document.getElementById('pumpResultSimple');
        await fetchGlobalMarketData(true);
        const pumpCoins = globalMarketData.filter(c => (c.price_change_percentage_24h ?? 0) >= thr).sort((a,b)=>b.price_change_percentage_24h - a.price_change_percentage_24h);
        if(!pumpCoins.length) { resDiv.innerHTML = `<div>Tidak ada koin > ${thr}%</div>`; return; }
        let html = `<div>🚀 ${pumpCoins.length} koin pump > ${thr}%:</div>`;
        pumpCoins.slice(0,30).forEach(c => { html += `<div>${c.symbol.toUpperCase()} +${c.price_change_percentage_24h.toFixed(2)}%</div>`; });
        resDiv.innerHTML = html;
    };
};

window.showBinanceScanner = function() {
    window.closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    sniperContainer.style.display = 'none';
    scannerContainer.innerHTML = `<div class="scanner-ui"><h3>🔍 Binance Checker</h3><input id="binanceSymbol" placeholder="BTCUSDT"><button id="binanceCheck">Cek</button><div id="binanceResult"></div></div>`;
    document.getElementById('binanceCheck').onclick = async () => {
        let sym = document.getElementById('binanceSymbol').value.toUpperCase();
        if(!sym.endsWith('USDT')) sym+='USDT';
        const resDiv = document.getElementById('binanceResult');
        try {
            const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
            const d = await r.json();
            resDiv.innerHTML = `💰 Harga: $${parseFloat(d.lastPrice).toLocaleString()}<br>📈 24j: ${d.priceChangePercent}%`;
        } catch(e){ resDiv.innerHTML = `Error: pair tidak ditemukan`; }
    };
};

window.showPumpPage = async function() {
    window.closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    sniperContainer.style.display = 'none';
    await fetchGlobalMarketData(true);
    const top = [...globalMarketData].sort((a,b)=>(b.price_change_percentage_24h??0)-(a.price_change_percentage_24h??0)).slice(0,25);
    let html = `<div class="scanner-ui"><h3>🚀 Top 25 Pump 24 Jam</h3>`;
    top.forEach(c => { html += `<div>${c.symbol.toUpperCase()} +${c.price_change_percentage_24h.toFixed(2)}%</div>`; });
    html += `</div>`;
    scannerContainer.innerHTML = html;
};

// ======================== AUTO REFRESH & INIT ========================
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(async () => {
        await fetchGlobalMarketData(true);
        if (currentDisplayMode === 'elit' || currentDisplayMode === 'populer') renderMarketList(currentDisplayMode);
    }, 60000);
}

async function init() {
    await fetchGlobalMarketData(true);
    switchTab('elit');
    startAutoRefresh();
    const header = document.querySelector('header');
    if(header && !document.getElementById('manualRefreshBtn')){
        const btn = document.createElement('button');
        btn.id = 'manualRefreshBtn';
        btn.innerText = '⟳';
        btn.style.cssText = 'background:none;border:none;color:#fcd535;font-size:22px;margin-left:auto;cursor:pointer';
        btn.onclick = () => fetchGlobalMarketData(true);
        header.appendChild(btn);
    }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
