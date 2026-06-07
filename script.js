// ======================== GLOBAL VARIABLES ========================
let globalMarketData = [];          // Menyimpan data 100 koin dari CoinGecko
let lastUpdateTime = null;          // Waktu update terakhir
let autoRefreshInterval = null;      // Interval refresh otomatis
let currentDisplayMode = 'elit';     // 'elit' atau 'populer'
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
function openNav() {
    document.getElementById("mySidebar").style.width = "260px";
    document.getElementById("myOverlay").style.display = "block";
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("myOverlay").style.display = "none";
}

// ======================== FETCH MARKET DATA (CoinGecko) ========================
async function fetchGlobalMarketData(forceRefresh = false) {
    // Jika sudah ada data dan tidak dipaksa refresh, kembalikan data yang ada
    if (!forceRefresh && globalMarketData.length > 0 && lastUpdateTime) {
        const secondsSinceUpdate = (new Date() - lastUpdateTime) / 1000;
        if (secondsSinceUpdate < 30) {
            return globalMarketData;
        }
    }
    
    if (isRefreshing) return globalMarketData;
    isRefreshing = true;
    
    if (loadingText) loadingText.style.display = 'block';
    
    try {
        const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: Gagal mengambil data`);
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Data tidak valid dari API');
        
        globalMarketData = data;
        lastUpdateTime = new Date();
        updateTimerDisplay();
        
        // Jika mode saat ini adalah elit/populer, render ulang market list
        if (currentDisplayMode === 'elit' || currentDisplayMode === 'populer') {
            renderMarketList(currentDisplayMode);
        }
        
        return globalMarketData;
    } catch (error) {
        console.error('Fetch error:', error);
        if (marketListContainer) {
            marketListContainer.innerHTML = `<div style="padding:20px;text-align:center;color:#cf304a;">⚠️ Gagal mengambil data pasar. Coba lagi nanti.<br>${error.message}</div>`;
        }
        if (loadingText) loadingText.style.display = 'none';
        return [];
    } finally {
        isRefreshing = false;
        if (loadingText) loadingText.style.display = 'none';
    }
}

// Update tampilan waktu terakhir update
function updateTimerDisplay() {
    if (!updateTimerElement) return;
    if (lastUpdateTime) {
        const jam = lastUpdateTime.getHours().toString().padStart(2,'0');
        const menit = lastUpdateTime.getMinutes().toString().padStart(2,'0');
        const detik = lastUpdateTime.getSeconds().toString().padStart(2,'0');
        updateTimerElement.innerText = `🔄 Update: ${jam}:${menit}:${detik}`;
    } else {
        updateTimerElement.innerText = 'Menunggu data...';
    }
}

// ======================== RENDER MARKET LIST (TOP 100 atau GAINERS) ========================
function renderMarketList(mode) {
    if (!marketListContainer) return;
    if (!globalMarketData.length) {
        marketListContainer.innerHTML = '<div class="loading">Memuat data pasar...</div>';
        return;
    }
    
    let dataToRender = [...globalMarketData];
    
    if (mode === 'populer') {
        // Gainers tertinggi (price_change_percentage_24h descending)
        dataToRender.sort((a, b) => {
            const changeA = a.price_change_percentage_24h ?? -Infinity;
            const changeB = b.price_change_percentage_24h ?? -Infinity;
            return changeB - changeA;
        });
        pageTitleSpan.innerText = '🔥 Kenaikan Tertinggi / Top Gainers 24 Jam';
    } else {
        // Default: berdasarkan market cap (sudah urut dari API)
        pageTitleSpan.innerText = '👑 Pasar Global / Kapitalisasi Terbesar';
    }
    
    let html = '';
    for (let i = 0; i < dataToRender.length; i++) {
        const coin = dataToRender[i];
        const rank = mode === 'populer' ? i+1 : (coin.market_cap_rank || i+1);
        const price = coin.current_price ?? 0;
        const change24h = coin.price_change_percentage_24h ?? 0;
        const changeClass = change24h >= 0 ? 'text-green' : 'text-red';
        const changeSymbol = change24h >= 0 ? '+' : '';
        const changeFormatted = change24h.toFixed(2);
        
        // Format harga
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
                    <div class="percent-text ${changeClass}">${changeSymbol}${changeFormatted}%</div>
                </div>
            </div>
        `;
    }
    
    marketListContainer.innerHTML = html;
}

// ======================== SWITCH TAB (Elit / Populer) ========================
function switchTab(tabId) {
    closeNav(); // Tutup sidebar jika terbuka
    
    if (tabId === 'elit') {
        currentDisplayMode = 'elit';
        tabElitBtn.classList.add('active');
        tabPopulerBtn.classList.remove('active');
        // Tampilkan market list, sembunyikan scanner
        marketListContainer.style.display = 'block';
        scannerContainer.style.display = 'none';
        renderMarketList('elit');
    } 
    else if (tabId === 'populer') {
        currentDisplayMode = 'populer';
        tabPopulerBtn.classList.add('active');
        tabElitBtn.classList.remove('active');
        marketListContainer.style.display = 'block';
        scannerContainer.style.display = 'none';
        renderMarketList('populer');
    }
    else if (tabId === 'scanner') {
        // Untuk menu Scanner Binance via sidebar
        showBinanceScanner();
    }
}

// ======================== BINANCE SCANNER (Cek Pair Tertentu) ========================
async function showBinanceScanner() {
    closeNav();
    // Sembunyikan market list, tampilkan scanner container
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    
    // Isi UI Scanner Binance
    scannerContainer.innerHTML = `
        <div class="scanner-ui">
            <h3 style="margin-top:0;">🔍 Scanner Binance Live</h3>
            <p style="font-size:13px; color:#848e9c;">Cek harga & perubahan 24 jam untuk pair tertentu</p>
            <div class="input-group">
                <input type="text" id="binanceSymbol" class="input-field" placeholder="BTCUSDT" value="BTCUSDT" style="flex:1; width:auto;">
                <button id="btnCheckBinance" class="btn-scan" style="width:auto; padding:10px 20px;">Cek Harga</button>
            </div>
            <div id="binanceResult" style="margin-top:20px; text-align:left; background:#0b0e11; padding:15px; border-radius:12px;">
                💡 Contoh: BTCUSDT, ETHUSDT, SOLUSDT, DOGEUSDT
            </div>
        </div>
    `;
    
    const checkBtn = document.getElementById('btnCheckBinance');
    const symbolInput = document.getElementById('binanceSymbol');
    const resultDiv = document.getElementById('binanceResult');
    
    checkBtn.addEventListener('click', async () => {
        let symbol = symbolInput.value.trim().toUpperCase();
        if (!symbol.endsWith('USDT')) symbol += 'USDT';
        resultDiv.innerHTML = '<div class="loading">⏳ Mengambil data dari Binance...</div>';
        
        try {
            const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Pair tidak ditemukan atau error API');
            const data = await response.json();
            
            const lastPrice = parseFloat(data.lastPrice);
            const changePercent = parseFloat(data.priceChangePercent);
            const high = parseFloat(data.highPrice);
            const low = parseFloat(data.lowPrice);
            const volume = parseFloat(data.volume);
            
            const changeClass = changePercent >= 0 ? 'text-green' : 'text-red';
            const changeSymbol = changePercent >= 0 ? '+' : '';
            
            resultDiv.innerHTML = `
                <div style="font-weight:bold; margin-bottom:10px;">📊 ${symbol}</div>
                <div>💰 Harga Saat Ini: <strong>$${lastPrice.toLocaleString()}</strong></div>
                <div>📈 Perubahan 24j: <span class="${changeClass}">${changeSymbol}${changePercent.toFixed(2)}%</span></div>
                <div>📊 Tertinggi 24j: $${high.toLocaleString()} | Terendah: $${low.toLocaleString()}</div>
                <div>🔄 Volume 24j: ${volume.toLocaleString()} ${symbol.replace('USDT','')}</div>
            `;
        } catch (err) {
            resultDiv.innerHTML = `<div style="color:#cf304a;">❌ Gagal: ${err.message}<br>Coba gunakan format seperti BTCUSDT, ETHUSDT</div>`;
        }
    });
}

// ======================== DETEKTOR KOIN PUMP (Filter Persentase Kenaikan) ========================
async function showCustomScanner() {
    closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    
    // Pastikan data terbaru
    await fetchGlobalMarketData(true);
    
    scannerContainer.innerHTML = `
        <div class="scanner-ui">
            <h3 style="margin-top:0;">⚡ Detektor Koin Pump</h3>
            <p style="font-size:13px; color:#848e9c;">Cari koin dengan kenaikan harga di atas ambang batas tertentu (24 jam)</p>
            <div class="input-group">
                <input type="number" id="pumpThreshold" class="input-field" placeholder="Min %" value="7" step="0.5" style="width:100px;">
                <button id="btnDetectPump" class="btn-scan" style="width:auto; padding:10px 20px;">Scan Pump</button>
            </div>
            <div id="pumpResult" style="margin-top:20px; max-height:500px; overflow-y:auto;">
                ⚙️ Masukkan minimal persentase kenaikan (contoh: 7%) lalu klik Scan.
            </div>
        </div>
    `;
    
    const detectBtn = document.getElementById('btnDetectPump');
    const thresholdInput = document.getElementById('pumpThreshold');
    const resultDiv = document.getElementById('pumpResult');
    
    detectBtn.addEventListener('click', async () => {
        let threshold = parseFloat(thresholdInput.value);
        if (isNaN(threshold)) threshold = 7;
        
        resultDiv.innerHTML = '<div class="loading">🔍 Menyaring koin pump...</div>';
        
        // Refresh data lagi biar akurat
        await fetchGlobalMarketData(true);
        
        const pumpCoins = globalMarketData.filter(coin => {
            const change = coin.price_change_percentage_24h ?? -999;
            return change >= threshold;
        });
        
        // Urutkan dari yang paling tinggi persennya
        pumpCoins.sort((a,b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
        
        if (pumpCoins.length === 0) {
            resultDiv.innerHTML = `<div style="padding:20px; text-align:center; color:#848e9c;">😢 Tidak ada koin yang naik di atas ${threshold}% dalam 24 jam terakhir.</div>`;
            return;
        }
        
        let html = `<div style="font-weight:bold; margin-bottom:15px;">🚀 Ditemukan ${pumpCoins.length} koin pump > ${threshold}% :</div>`;
        for (let coin of pumpCoins.slice(0, 30)) {
            const change = coin.price_change_percentage_24h ?? 0;
            const price = coin.current_price ?? 0;
            let priceFormatted = price < 1 ? price.toFixed(6) : price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #2b2f36;">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <img src="${coin.image}" width="24" height="24" style="border-radius:50%;">
                        <div><strong>${coin.symbol.toUpperCase()}</strong><br><span style="font-size:11px; color:#848e9c;">${coin.name}</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div>$${priceFormatted}</div>
                        <div class="text-green">+${change.toFixed(2)}%</div>
                    </div>
                </div>
            `;
        }
        resultDiv.innerHTML = html;
    });
}

// ======================== TOP PUMP (MENAMPILKAN GAINERS TERBESAR) ========================
async function showPumpPage() {
    closeNav();
    marketListContainer.style.display = 'none';
    scannerContainer.style.display = 'block';
    
    // Pastikan data fresh
    await fetchGlobalMarketData(true);
    
    // Urutkan berdasarkan kenaikan tertinggi
    const sortedByGain = [...globalMarketData].sort((a,b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
    const topGainers = sortedByGain.slice(0, 25);
    
    let html = `
        <div class="scanner-ui">
            <h3 style="margin-top:0;">🚀 Top Pump - Kenaikan 24 Jam Tertinggi</h3>
            <p style="font-size:13px; color:#fcd535; margin-bottom:15px;">🔥 Update realtime dari pasar global</p>
            <div id="topPumpList" style="max-height:550px; overflow-y:auto;">
    `;
    
    for (let coin of topGainers) {
        const change = coin.price_change_percentage_24h ?? 0;
        const price = coin.current_price ?? 0;
        let priceFormatted = price < 1 ? price.toFixed(6) : price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #2b2f36;">
                <div style="display:flex; gap:15px; align-items:center;">
                    <img src="${coin.image}" width="28" height="28" style="border-radius:50%;">
                    <div>
                        <div><strong>${coin.symbol.toUpperCase()}</strong> <span style="font-size:11px; color:#848e9c;">${coin.name}</span></div>
                        <div style="font-size:12px;">💰 $${priceFormatted}</div>
                    </div>
                </div>
                <div class="text-green" style="font-size:18px; font-weight:bold;">+${change.toFixed(2)}%</div>
            </div>
        `;
    }
    
    html += `</div><div style="margin-top:15px; font-size:12px; color:#848e9c; text-align:center;">✨ Data berdasarkan perubahan harga 24 jam terakhir dari CoinGecko</div></div>`;
    scannerContainer.innerHTML = html;
}

// ======================== AUTO REFRESH (SETIAP 60 DETIK) ========================
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(async () => {
        // Refresh data di background tanpa mengganggu tampilan jika sedang di mode elit/populer
        await fetchGlobalMarketData(true);
        // Jika sedang di mode elit atau populer, render ulang sesuai mode
        if (currentDisplayMode === 'elit' || currentDisplayMode === 'populer') {
            renderMarketList(currentDisplayMode);
        }
        // Untuk scanner yang sedang aktif (tidak otomatis merender ulang, biarkan user refresh manual)
    }, 60000); // setiap 60 detik
}

// ======================== INITIAL LOAD ========================
async function init() {
    // Tampilkan loading
    if (loadingText) loadingText.style.display = 'block';
    
    // Ambil data pertama
    await fetchGlobalMarketData(true);
    
    // Tampilkan default tab Elit
    switchTab('elit');
    
    // Mulai auto refresh
    startAutoRefresh();
    
    // Event listener untuk tombol tab secara manual (antisipasi)
    if (tabElitBtn) tabElitBtn.addEventListener('click', () => switchTab('elit'));
    if (tabPopulerBtn) tabPopulerBtn.addEventListener('click', () => switchTab('populer'));
    
    // Tambahkan event untuk menu-menu lain yang mungkin belum terdefinisi di HTML (tapi sudah ada onclick di HTML)
    // Pastikan semua fungsi global tersedia.
    window.switchTab = switchTab;
    window.showCustomScanner = showCustomScanner;
    window.showPumpPage = showPumpPage;
    window.showBinanceScanner = showBinanceScanner;
    window.openNav = openNav;
    window.closeNav = closeNav;
}

// Jalankan ketika DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
