async function testConnection() {
    const container = document.getElementById('market-list-container');
    container.innerHTML = "Mencoba memuat data...";
    
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10');
        const data = await response.json();
        
        // Jika berhasil, tampilkan datanya langsung
        container.innerHTML = data.map(coin => `
            <div style="padding:15px; border-bottom:1px solid #333; color:white;">
                ${coin.symbol.toUpperCase()} - $${coin.current_price}
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = "Gagal total: " + error.message;
    }
}

// Jalankan tes
testConnection();
