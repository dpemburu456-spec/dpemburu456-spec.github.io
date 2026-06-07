// --- FUNGSI NAVIGASI ---
function openNav() { document.getElementById("mySidebar").style.width = "260px"; document.getElementById("myOverlay").style.display = "block"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; document.getElementById("myOverlay").style.display = "none"; }

// --- FUNGSI MARKET DATA (STABIL) ---
async function fetchMarketData() {
    const container = document.getElementById('market-list-container');
    const loadingText = document.getElementById('loading-text');
    
    // Tampilkan status loading
    loadingText.style.display = 'block';
    loadingText.innerText = "Memuat data pasar...";
    
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
        loadingText.innerText = "Gagal memuat data. Silakan refresh.";
    }
}

// Inisialisasi
fetchMarketData();

