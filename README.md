# FreshClean Laundry POS 🧺

Aplikasi Kasir (Point of Sale) khusus untuk usaha Laundry dengan fitur manajemen pelanggan, order, reports, dan branding dinamis.

## 🚀 Persyaratan Sistem

Sebelum melakukan instalasi, pastikan server Anda (Linux/STB/VPS) memenuhi spesifikasi berikut:
- **Web Server**: Apache atau Nginx
- **PHP**: Versi 7.4 ke atas (Direkomendasikan 8.1+) dengan ekstensi `pdo_mysql`
- **Database**: MySQL 5.7+ atau MariaDB 10.3+
- **Frontend Build**: Node.js & npm (Hanya jika ingin build dari source code)

## 🛠️ Langkah Instalasi

### 1. Clone Repository
Gunakan perintah `git clone` untuk mengambil source code ke server/komputer Anda:
```bash
git clone https://github.com/kios-daeng-rate/kios-laundry.git
cd kios-laundry
```

### 2. Build Frontend (Opsional jika folder `dist` sudah ada)
Jika Anda melakukan perubahan pada source code React, Anda perlu melakukan build ulang:
```bash
npm install
npm run build
```
Hasil build akan berada di folder `dist`.

### 3. Deploy ke Web Server
Pindahkan isi dari folder `dist` (beserta folder `api`) ke dalam direktori web server Anda (misal: `/var/www/html` atau `public_html`).

Pastikan folder `api` memiliki hak akses tulis (write permission) karena sistem akan membuat file `api/config.php` secara otomatis.

### 4. Jalankan Web Installer
1. Buka browser dan akses ke: `http://domain-anda.com/api/install.php`
2. Ikuti langkah-langkah di layar:
   - **Step 1**: Cek persyaratan sistem.
   - **Step 2**: Masukkan kredensial Database MySQL (Host, User, Pass, DB Name).
   - **Step 3**: Atur nama Laundry dan akun Admin utama.
   - **Step 4**: Selesai.

### 5. Keamanan (Penting!)
Setelah instalasi berhasil, **segera hapus file `api/install.php`** dari server Anda untuk mencegah penyalahgunaan akses setup.

## 🔐 Akun Default
Setelah instalasi, Anda bisa login menggunakan username dan password admin yang telah Anda buat pada Step 3 di web installer.

---
**Powered by Kios Daeng Rate with AI 2026**
