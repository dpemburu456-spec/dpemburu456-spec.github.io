let currentView = 'elit'; 
let globalCoinsData = [];
let tradingViewWidgetLoaded = false;

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
        // TAMPILKAN HALAMAN SCANNER BINANCE
        tabs.style.display = 'none';
        marketContainer.style.display = 'none';
        scannerContainer.style.display = 'block';
        titleText.innerText = "🔍 Scanner Pasar Binance (Teknikal)";
        loadTradingViewScanner();
    } else {
        // TAMPILKAN HALAMAN UTAMA COINGECKO
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

// FUNGSI LOAD SCREENER JALUR TRADINGVIEW BINANCE MARKET
function loadTradingViewScanner() {
    const container = document.getElementById('scanner-container');
    if (tradingViewWidgetLoaded) return;

    container.innerHTML = '';
    
    // Membuat elemen penampung widget asli
    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container';
    widgetWrapper.style.height = '550px';
    widgetWrapper.style.width = '100%';
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetWrapper.appendChild(widgetContainer);
    container.appendChild(widgetWrapper);

    // Injeksi Script Resmi TradingView dengan parameter yang fix & stabil untuk mobile
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "100%",
        "defaultColumn": "overview",
        "screener_type": "crypto_mkt",
        "displayCurrency": "USD",
        "colorTheme": "dark",
        "locale": "id",
        "market": "crypto",
        "enableScrolling": true
    });
    
    widgetWrapper.appendChild(script);
    tradingViewWidgetLoaded = true;
                }
            }
            </script>
        </div>
    `;
    
    // Trik memaksa injeksi script TradingView agar aktif di browser mobile
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "550",
        "defaultColumn": "overview",
        "screener_type": "crypto_mkt",
        "displayCurrency": "USD",
        "colorTheme": "dark",
        "locale": "id",
        "market": "crypto"
    });
    container.appendChild(script);
    tradingViewWidgetLoaded = true;
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

fetchMarketData();
setInterval(fetchMarketData, 60000); 
