// --- VARIABEL GLOBAL ---
let isScanning = false;

// --- FUNGSI NAVIGASI ---
function openNav() { document.getElementById("mySidebar").style.width = "260px"; document.getElementById("myOverlay").style.display = "block"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("myOverlay").style.display = "none"; }

// --- FUNGSI PASAR UTAMA ---
async function fetchMarketData() {
    const container = document.getElementById('market-list-container');
    const loadingText = document.getElementById('loading-text');
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20');
        const data = await res.json();
        loadingText.style.display = 'none';
        container.innerHTML = data.map(c => `
            <div class="crypto-row">
                <span>${c.symbol.toUpperCase()}</span>
                <span class="text-green">$${c.current_price}</span>
            </div>
        `).join('');
    } catch (e) {
        loadingText.innerText = "Gagal memuat data pasar.";
    }
}

// --- FUNGSI SNIPER MODE (UI & LOGIC) ---
function showCustomScanner() {
    const container = document.getElementById('scanner-container');
    document.getElementById('market-list-container').style.display = 'none';
    document.getElementById('top-tabs').style.display = 'none';
    container.style.display = 'block';
    document.getElementById('page-title-text').innerText = "Sniper Mode";
    
    container.innerHTML = `
        <div class="scanner-ui">
            <h3>Scanner Settings</h3>
            <div class="input-group">
                <input type="number" id="vol-min" class="input-field" placeholder="Vol Min">
                <input type="number" id="vol-max" class="input-field" placeholder="Vol Max">
            </div>
            <button id="scan-btn" class="btn-scan" onclick="runScanner()">▶ Start Scanning</button>
            <h3 style="margin-top:20px;">Detected Coins</h3>
            <div id="scan-results"></div>
        </div>
    `;
}

async function runScanner() {
    const btn = document.getElementById('scan-btn');
    const resDiv = document.getElementById('scan-results');
    
    if (isScanning) {
        isScanning = false;
        btn.innerText = "▶ Start Scanning";
        btn.style.backgroundColor = "#02c076";
        resDiv.innerHTML = "Scanning dihentikan.";
        return;
    }

    isScanning = true;
    btn.innerText = "⏹ Stop Scanning";
    btn.style.backgroundColor = "#cf304a";
    
    // Konfigurasi Bot
    const botToken = "7ufge3FrWNtaGBNx5AEysvvEyudCmnk4QBWurLmTxdjn";
    const chatId = "8294553147";

    while (isScanning) {
        const coin = { symbol: "DAR/IDR", change: "+0.78%", price: "130.0" };
        
        resDiv.innerHTML = `
            <div style="background:#2b3139; padding:15px; border-radius:10px; color:white;">
                <strong>${coin.symbol}</strong> | ${coin.change}<br>
                Price: ${coin.price}
                <button style="width:100%; margin-top:10px; background:#fcd535; border:none; padding:8px; font-weight:bold;">Hit</button>
            </div>
        `;

        // Bunyi Alarm (perlu interaksi layar sebelumnya)
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(()=>{});
        
        // Kirim Notifikasi Telegram
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=PumpDetected:${coin.symbol}`);

        await new Promise(r => setTimeout(r, 5000));
    }
}

// Inisialisasi
fetchMarketData();
