# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 📋 Persyaratan Sistem (Requirements)

Sebelum menginstal, pastikan server Anda memenuhi kriteria berikut:
- **PHP**: Versi 7.4 atau lebih tinggi.
- **Database**: MySQL 5.7+ atau MariaDB 10.3+.
- **Ekstensi PHP**: `pdo_mysql` (Wajib ada).
- **Web Server**: Apache (mendukung `.htaccess`) atau Nginx.
- **Izin Folder**: Folder `api/` harus memiliki izin tulis (**write permission**) agar installer bisa membuat file konfigurasi secara otomatis.
- **Lainnya**: Koneksi internet diperlukan untuk pengiriman email OTP (SMTP Gmail).

## ⚙️ Cara Install di Server Baru

1. Download/Clone isi repository ini ke server Anda.
   ```bash
   git clone https://github.com/kios-daeng-rate/kios-laundry.git .
   ```
2. Pastikan file berada di folder yang bisa diakses web server (misal: `public_html`).
3. Buka browser dan akses: `http://domain-anda.com/api/install.php`
4. Masukkan detail Database dan SMTP Gmail Anda.
5. Setelah selesai, hapus file `api/install.php`.
6. Gunakan tombol **Daftar Toko Baru** di halaman Login untuk membuat akun.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

---
Powered by **Kios Daeng Rate with AI © 2026**
