let currentView = 'elit'; 
let globalCoinsData = [];

function openNav() { document.getElementById("mySidebar").style.width = "260px"; document.getElementById("myOverlay").style.display = "block"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("myOverlay").style.display = "none"; }

function switchTab(tabType) {
    currentView = tabType;
    document.getElementById('top-tabs').style.display = 'flex';
    document.getElementById('market-list-container').style.display = 'block';
    document.getElementById('scanner-container').style.display = 'none';
    document.getElementById('page-title-text').innerText = "Pasar Global / Global Top 100";
    renderMarketData();
}

function showPumpPage() {
    currentView = 'pump';
    document.getElementById('top-tabs').style.display = 'none';
    document.getElementById('market-list-container').style.display = 'block';
    document.getElementById('scanner-container').style.display = 'none';
    document.getElementById('page-title-text').innerText = "🚀 Top Pump";
    renderMarketData();
}

// FUNGSI SCANNER KUSTOM BARU
function showCustomScanner() {
    const container = document.getElementById('scanner-container');
    document.getElementById('market-list-container').style.display = 'none';
    document.getElementById('top-tabs').style.display = 'none';
    container.style.display = 'block';
    document.getElementById('page-title-text').innerText = "⚡ Detektor Koin Pump";
    
    container.innerHTML = `
        <div class="scanner-ui" style="background:#181a20; padding:20px; border-radius:15px; border:1px solid #333; color:white;">
            <h3 style="margin-top:0;">Scanner Settings</h3>
            <div class="input-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="number" id="vol-min" placeholder="Min Vol" style="background:#2b3139; border:1px solid #474d57; color:white; padding:10px; border-radius:8px; width:50%;">
                <input type="number" id="vol-max" placeholder="Max Vol" style="background:#2b3139; border:1px solid #474d57; color:white; padding:10px; border-radius:8px; width:50%;">
            </div>
            <button onclick="runScanner()" style="background:#02c076; color:white; border:none; padding:15px; width:100%; border-radius:8px; font-weight:bold; cursor:pointer;">▶ Start Scanning</button>
            <div id="scan-results" style="margin-top:20px;"></div>
        </div>
    `;
}

async function runScanner() {
    const minVol = document.getElementById('vol-min').value;
    const maxVol = document.getElementById('vol-max').value;
    const resDiv = document.getElementById('scan-results');
    resDiv.innerHTML = "Memindai Binance...";
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const data = await response.json();
    const filtered = data.filter(c => c.symbol.includes('USDT') && parseFloat(c.quoteVolume) > minVol && parseFloat(c.quoteVolume) < maxVol).slice(0, 10);
    resDiv.innerHTML = filtered.map(c => `<div style="padding:10px; border-bottom:1px solid #333;">${c.symbol} | <span style="color:#02c076;">${c.priceChangePercent}%</span></div>`).join('');
}

async function fetchMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        globalCoinsData = await response.json();
        document.getElementById('loading-text').style.display = 'none';
        renderMarketData();
    } catch (e) { console.error(e); }
}

function renderMarketData() {
    const container = document.getElementById('market-list-container');
    container.innerHTML = globalCoinsData.map((c, i) => `
        <div class="crypto-row" style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #2b2f36;">
            <span>${i+1}. ${c.symbol.toUpperCase()}</span>
            <span class="${c.price_change_percentage_24h >= 0 ? 'text-green' : 'text-red'}">$${c.current_price}</span>
        </div>
    `).join('');
}

fetchMarketData();
