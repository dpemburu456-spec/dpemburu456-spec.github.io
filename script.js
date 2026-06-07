let currentView = 'elit'; 
let globalCoinsData = [];

function openNav() {
    document.getElementById("mySidebar").style.width = "260px";
    document.getElementById("myOverlay").style.display = "block";
}
function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("myOverlay").style.display = "none";
}

function switchTab(tabType) {
    currentView = tabType;
    
    const tabs = document.getElementById('top-tabs');
    const marketContainer = document.getElementById('market-list-container');
    const scannerContainer = document.getElementById('scanner-container');
    const titleText = document.getElementById('page-title-text');

    if (tabType === 'scanner') {
        tabs.style.display = 'none';
        marketContainer.style.display = 'none';
        scannerContainer.style.display = 'block';
        titleText.innerText = "🔍 Scanner Pasar Binance (Teknikal)";
        loadTradingViewScanner();
    } else {
        tabs.style.display = 'flex';
        marketContainer.style.display = 'block';
        scannerContainer.style.display = 'none';
        
        document.getElementById('tab-elit').classList.remove('active');
        document.getElementById('tab-populer').classList.remove('active');
        
        if (tabType === 'elit') {
            document.getElementById('tab-elit').classList.add('active');
            titleText.innerText = "Pasar Global / Global Top 100";
        } else {
            document.getElementById('tab-populer').classList.add('active');
            titleText.innerText = "Pasar Global / Kenaikan Tertinggi";
        }
        renderMarketData();
    }
}

function showPumpPage() {
    currentView = 'pump';
    document.getElementById('top-tabs').style.display = 'none'; 
    document.getElementById('market-list-container').style.display = 'block';
    document.getElementById('scanner-container').style.display = 'none';
    document.getElementById('page-title-text').innerText = "🚀 Top Pump";
    renderMarketData();
}

function loadTradingViewScanner() {
    const container = document.getElementById('scanner-container');
    // Bersihkan isi container terlebih dahulu agar tidak menumpuk eror
    container.innerHTML = ''; 

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '500px';

    const innerWidget = document.createElement('div');
    innerWidget.className = 'tradingview-widget-container__widget';
    widgetDiv.appendChild(innerWidget);
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.text = JSON.stringify({
        "width": "100%",
        "height": "500",
        "defaultColumn": "overview",
        "screener_type": "crypto_mkt",
        "displayCurrency": "USD",
        "colorTheme": "dark",
        "locale": "id",
        "market": "crypto"
    });
    widgetDiv.appendChild(script);
}

async function fetchMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        globalCoinsData = await response.json();
        
        document.getElementById('loading-text').style.display = 'none';
        document.getElementById('update-timer').innerText = 'Live otomatis';
        
        renderMarketData();
    } catch (error) {
        document.getElementById('loading-text').innerText = "Koneksi sibuk, memuat ulang otomatis...";
        console.error(error);
    }
}

function renderMarketData() {
    if (currentView === 'scanner') return;
    
    const container = document.getElementById('market-list-container');
    container.innerHTML = '';
    
    let targetCoins = [];
    
    if (currentView === 'elit') {
        targetCoins = [...globalCoinsData];
    } else if (currentView === 'populer') {
        targetCoins = [...globalCoinsData].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else {
        targetCoins = [...globalCoinsData].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 10);
    }

    if (targetCoins.length === 0) return;

    targetCoins.forEach((coin, index) => {
        const symbol = coin.symbol.toUpperCase();
        const name = coin.name;
        const price = coin.current_price;
        const percentRaw = coin.price_change_percentage_24h;
        const percent = percentRaw ? percentRaw.toFixed(2) : "0.00";
        const iconUrl = coin.image;
        
        const displayRank = currentView === 'elit' ? (index + 1) : coin.market_cap_rank;

        let formattedPrice = price;
        if (price >= 1) {
            formattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            formattedPrice = price.toFixed(4);
        }

        const isPositive = percentRaw >= 0;
        const percentClass = isPositive ? 'text-green' : 'text-red';
        const percentSign = isPositive ? '+' : '';

        const rowHTML = `
            <div class="crypto-row">
                <div class="coin-info-block">
                    <div class="coin-rank">${displayRank}</div>
                    <img class="coin-icon-img" src="${iconUrl}" alt="${name}">
                    <div class="coin-meta">
                        <div class="coin-symbol-text">${symbol}</div>
                        <div class="coin-name-text">${name}</div>
                    </div>
                </div>
                <div class="price-block">
                    <div class="coin-price-text">$${formattedPrice}</div>
                    <div class="percent-text ${percentClass}">${percentSign}${percent}%</div>
                </div>
            </div>
        `;
        container.innerHTML += rowHTML;
    });
}
function showCustomScanner() {
    const container = document.getElementById('scanner-container');
    document.getElementById('market-list-container').style.display = 'none';
    document.getElementById('top-tabs').style.display = 'none';
    container.style.display = 'block';
    
    container.innerHTML = `
        <div class="scanner-ui">
            <h3>Scanner Settings</h3>
            <div class="input-group">
                <input type="number" id="vol-min" class="input-field" placeholder="Min Vol">
                <span>-</span>
                <input type="number" id="vol-max" class="input-field" placeholder="Max Vol">
            </div>
            <button class="btn-scan" onclick="runScanner()">▶ Start Scanning</button>
            <div id="scan-results" style="margin-top:20px;"></div>
        </div>
    `;
    document.getElementById('page-title-text').innerText = "⚡ Detektor Koin Pump";
}

async function runScanner() {
    const minVol = document.getElementById('vol-min').value;
    const maxVol = document.getElementById('vol-max').value;
    const resDiv = document.getElementById('scan-results');
    
    resDiv.innerHTML = "Memindai Binance...";
    
    // Mengambil data dari Binance API
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const data = await response.json();
    
    // Filter berdasarkan volume (contoh logic)
    const filtered = data.filter(coin => 
        coin.symbol.includes('USDT') && 
        parseFloat(coin.quoteVolume) > minVol && 
        parseFloat(coin.quoteVolume) < maxVol
    ).slice(0, 5);

    resDiv.innerHTML = filtered.map(c => `
        <div class="crypto-row">
            <span>${c.symbol}</span>
            <span class="text-green">${c.priceChangePercent}%</span>
        </div>
    `).join('');
}

fetchMarketData();
setInterval(fetchMarketData, 60000);

function showCustomScanner() {
    const container = document.getElementById('scanner-container');
    document.getElementById('market-list-container').style.display = 'none';
    document.getElementById('top-tabs').style.display = 'none';
    container.style.display = 'block';
    
    container.innerHTML = `
        <div class="scanner-ui">
            <h3>Scanner Settings</h3>
            <div class="input-group">
                <input type="number" id="vol-min" class="input-field" placeholder="Min Vol">
                <span>-</span>
                <input type="number" id="vol-max" class="input-field" placeholder="Max Vol">
            </div>
            <button class="btn-scan" onclick="runScanner()">▶ Start Scanning</button>
            <div id="scan-results" style="margin-top:20px;"></div>
        </div>
    `;
    document.getElementById('page-title-text').innerText = "⚡ Detektor Koin Pump";
}

async function runScanner() {
    const minVol = document.getElementById('vol-min').value;
    const maxVol = document.getElementById('vol-max').value;
    const resDiv = document.getElementById('scan-results');
    
    resDiv.innerHTML = "Memindai Binance...";
    
    // Mengambil data dari Binance API
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const data = await response.json();
    
    // Filter berdasarkan volume (contoh logic)
    const filtered = data.filter(coin => 
        coin.symbol.includes('USDT') && 
        parseFloat(coin.quoteVolume) > minVol && 
        parseFloat(coin.quoteVolume) < maxVol
    ).slice(0, 5);

    resDiv.innerHTML = filtered.map(c => `
        <div class="crypto-row">
            <span>${c.symbol}</span>
            <span class="text-green">${c.priceChangePercent}%</span>
        </div>
    `).join('');
}

