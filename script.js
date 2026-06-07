let isScanning = false;

// Fungsi Navigasi
function openNav() { document.getElementById("mySidebar").style.width = "260px"; document.getElementById("myOverlay").style.display = "block"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("myOverlay").style.display = "none"; }

// Fungsi Tampilan Utama
function showCustomScanner() {
    const container = document.getElementById('scanner-container');
    document.getElementById('market-list-container').style.display = 'none';
    document.getElementById('top-tabs').style.display = 'none';
    container.style.display = 'block';
    document.getElementById('page-title-text').innerText = "Sniper Mode";
    
    container.innerHTML = `
        <div class="scanner-ui" style="background:#181a20; padding:15px; color:white; border-radius:10px;">
            <h3>Scanner Settings</h3>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="number" id="vol-min" placeholder="Vol Min" style="width:50%; padding:10px; background:#2b3139; color:white; border:none; border-radius:5px;">
                <input type="number" id="vol-max" placeholder="Vol Max" style="width:50%; padding:10px; background:#2b3139; color:white; border:none; border-radius:5px;">
            </div>
            <button id="scan-btn" onclick="runScanner()" style="background:#02c076; color:white; border:none; padding:15px; width:100%; font-weight:bold; border-radius:5px;">▶ Start Scanning</button>
            <h3 style="margin-top:20px;">Detected Coins</h3>
            <div id="scan-results"></div>
        </div>
    `;
}

// Fungsi Inti Sniper
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
    
    // Konfigurasi Bot
    const botToken = "7ufge3FrWNtaGBNx5AEysvvEyudCmnk4QBWurLmTxdjn";
    const chatId = "8294553147";

    while (isScanning) {
        // Logika Deteksi (Disini kamu bisa masukkan logika Binance nantinya)
        const coin = { symbol: "DAR/IDR", price: "130.0", change: "+0.78%", vol: "404.6M" };
        
        resDiv.innerHTML = `
            <div style="background:#2b3139; padding:15px; border-radius:10px; margin-bottom:10px;">
                <strong>${coin.symbol}</strong> | <span style="color:#02c076;">${coin.change}</span><br>
                Price: ${coin.price} | Vol: ${coin.vol}
                <button style="display:block; width:100%; background:#fcd535; border:none; padding:8px; margin-top:10px; font-weight:bold;">Hit</button>
            </div>
        `;

        // Bunyi Alarm
        const alarm = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        alarm.play().catch(e => console.log("Perlu klik layar dulu agar suara keluar"));

        // Kirim ke Telegram
        const msg = `🚀 PUMP DETECTED!\n${coin.symbol} | ${coin.change}\nVol: ${coin.vol}`;
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}`);

        await new Promise(r => setTimeout(r, 5000));
    }
}
