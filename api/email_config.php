<?php
/**
 * Konfigurasi SMTP untuk pengiriman email OTP.
 * PENTING: Jangan upload file ini ke repository publik (tambahkan ke .gitignore)!
 *
 * Cara mendapatkan Gmail App Password:
 * 1. Buka: https://myaccount.google.com/security
 * 2. Aktifkan 2-Step Verification (jika belum)
 * 3. Buka: https://myaccount.google.com/apppasswords
 * 4. Pilih App: "Mail", Device: "Other" → beri nama "FreshClean"
 * 5. Salin kode 16 karakter yang muncul (tanpa spasi)
 */

define('MAIL_HOST',     'smtp.gmail.com');  // Server SMTP
define('MAIL_PORT',     587);               // Port TLS
define('MAIL_USERNAME', 'email-anda@gmail.com');    // ← GANTI dengan Gmail Anda
define('MAIL_PASSWORD', 'xxxx xxxx xxxx xxxx');     // ← GANTI dengan App Password
define('MAIL_FROM',     'email-anda@gmail.com');    // ← GANTI (sama dengan username)
define('MAIL_FROM_NAME', 'FreshClean POS');          // Nama pengirim yang tampil di email
