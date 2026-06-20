const linkWA = "https://chat.whatsapp.com/FTpNCC1Y62PHrAvrrYCLw7";
const PASSWORD_VALID = "ALUMNIHARUM2026";

// Fungsi untuk menangani proses login anggota
function prosesLogin() {
    const nama = document.getElementById('username').value.trim();
    const wa = document.getElementById('whatsapp').value.trim();
    const pass = document.getElementById('grouppass').value.trim();

    if (nama === "" || wa === "" || pass === "") {
        alert("Semua kolom wajib diisi!");
        return;
    }

    if (pass !== PASSWORD_VALID) {
        alert("Password Salah! Hanya anggota di grup WA HARUM yang mengetahui password ini.");
        return;
    }

    localStorage.setItem('user_harum', nama);
    document.getElementById('nama-user').innerText = nama;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

// Membuka tautan Grup WhatsApp
function bukaGrupWA() {
    window.open(linkWA, '_blank');
}

// Fungsi keluar/logout aplikasi
function logout() {
    localStorage.removeItem('user_harum');
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    // Membersihkan form input kembali kosong
    document.getElementById('username').value = "";
    document.getElementById('whatsapp').value = "";
    document.getElementById('grouppass').value = "";
}

// Fungsi Navigasi Menu antar halaman internal
function bukaHalaman(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(pageId).classList.add('active');
    
    // Memberikan class active pada tombol menu yang diklik
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// --- SISTEM KALENDER REAL TIME (MASEHI, JAWA, HIJRIAH) ---
function updateJamDanTanggal() {
    const sekarang = new Date();
    
    // 1. Jam Digital Berdetak Nyata
    const jam = String(sekarang.getHours()).padStart(2, '0');
    const menit = String(sekarang.getMinutes()).padStart(2, '0');
    const detik = String(sekarang.getSeconds()).padStart(2, '0');
    document.getElementById('jam-info').innerText = `${jam}:${menit}:${detik} WIB`;

    // 2. Tanggal Masehi Berbahasa Indonesia
    const opsiMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const tglMasehi = sekarang.toLocaleDateString('id-ID', opsiMasehi);

    // 3. Kalkulasi Pasaran Jawa Real
    const pasaran = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const baseTime = new Date(1970, 0, 1).getTime();
    const diffDays = Math.floor((sekarang.getTime() - baseTime) / 86400000);
    const pasaranHariIni = pasaran[(diffDays + 3) % 5]; 

    // Nama Bulan Jawa Pranata Mangsa / Kalender Sultan Agung
    const bulanJawa = ["Sura", "Sapar", "Mulud", "Bakda Mulud", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Ruwah", "Pasa", "Sawal", "Sela", "Besar"];
    
    // 4. Hitung Kalender Hijriah & Jawa Berdasarkan Julian Day Astronomis
    let day = sekarang.getDate();
    let month = sekarang.getMonth() + 1;
    let year = sekarang.getFullYear();

    if (month < 3) {
        year -= 1;
        month += 12;
    }

    let a = Math.floor(year / 100);
    let b = Math.floor(a / 4);
    let c = 2 - a + b;
    let e = Math.floor(365.25 * (year + 4716));
    let f = Math.floor(30.6001 * (month + 1));
    let jd = c + day + e + f - 1524.5; 

    let ijd = Math.floor(jd + 0.5);
    let l = ijd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15313);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 30) * Math.floor((15313 * j) / 43) + 29;
    
    let mH = Math.floor((24 * l) / 709);
    let dH = l - Math.floor((709 * mH) / 24);
    let yH = 30 * n + j - 30; 

    const bulanHijriah = ["Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"];

    // Menampilkan ke Elemen HTML
    document.getElementById('kalender-masehi-jawa').innerText = `${tglMasehi} (${pasaranHariIni})`;
    document.getElementById('kalender-hijriah').innerText = `${dH} ${bulanHijriah[mH-1]} ${yH} H / ${dH} ${bulanJawa[mH-1]} ${yH + 512} AJ`;
}

// Menjalankan pengecekan sesi saat halaman pertama kali dimuat browser
window.onload = function() {
    const savedUser = localStorage.getItem('user_harum');
    if (savedUser) {
        document.getElementById('nama-user').innerText = savedUser;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    }
    updateJamDanTanggal();
    setInterval(updateJamDanTanggal, 1000);
}
