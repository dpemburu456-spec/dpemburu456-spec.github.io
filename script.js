let isScanning = false;

// Navigasi
function openNav() { document.getElementById("mySidebar").style.width = "260px"; document.getElementById("myOverlay").style.display = "block"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("myOverlay").style.display = "none"; }

// Sniper Mode UI
function showCustomScanner() {
    const container = document.getElementById('scanner-container');
    document.getElementById('market-list-container').style.display = 'none';
    document.getElementById('top-tabs').style.display = 'none';
    container.style.display = 'block';
    document.getElementById('page-title-text').innerText = "Sniper Mode";
    
    container.innerHTML = `
        <div class="scanner-ui" style="background:#181a20; padding:20px; border-radius:15px; color:white;">
            <h3>Scanner Settings</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                <input type="number" id="vol-min" placeholder="Vol Min" style="padding:10px; border-radius:5px; border:none;">
                <input type="number" id="vol-max" placeholder="Vol Max" style="padding:10px; border-radius:5px; border:none;">
            </div>
            <button id="scan-btn" onclick="runScanner()" style="background:#02c076; width:100%; padding:15px; border:none; border-radius:8px; font-weight:bold; color:white;">▶ Start Scanning</button>
            <div id="scan-results" style="margin-top:20px;"></div>
        </div>
    `;
}

// Sniper Engine
async function runScanner() {
    const btn = document.getElementById('scan-btn');
    const resDiv = document.getElementById('scan-results');
    
    if (isScanning) {
        isScanning = false;
        btn.innerText = "▶ Start Scanning";
        btn.style.backgroundColor = "#02c076";
        return;
    }

    isScanning = true;
    btn.innerText = "⏹ Stop Scanning";
    btn.style.backgroundColor = "#cf304a";
    
    while (isScanning) {
        // Simulasi deteksi (Ganti dengan Fetch API Binance jika ingin live)
        resDiv.innerHTML = `<div style="background:#2b3139; padding:15px; border-radius:10px;">DAR/IDR | +0.78% | <button>Hit</button></div>`;
        
        // Bunyi Alarm (Auto-play dihandle browser)
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(()=>{});
        
        // Simulasi Telegram (Pesan dikirim lewat URL)
        fetch(`https://api.telegram.org/bot7ufge3FrWNtaGBNx5AEysvvEyudCmnk4QBWurLmTxdjn/sendMessage?chat_id=8294553147&text=PumpDetected:DAR/IDR`);
        
        await new Promise(r => setTimeout(r, 5000));
    }
}

// Initial Load Data Market
async function fetchMarketData() {
    const container = document.getElementById('market-list-container');
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20');
        const data = await res.json();
        container.innerHTML = data.map(c => `<div style="padding:15px; border-bottom:1px solid #333;">${c.symbol.toUpperCase()} - $${c.current_price}</div>`).join('');
    } catch (e) {
        container.innerHTML = "Gagal memuat data. Periksa koneksi.";
    }
}

fetchMarketData();
