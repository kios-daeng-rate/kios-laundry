<?php
require_once __DIR__ . '/core.php';
require_once __DIR__ . '/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input      = json_decode(file_get_contents('php://input'), true);
$tenantSlug = trim($input['tenant_slug'] ?? '');

if (empty($tenantSlug)) {
    sendError('Kode Toko wajib diisi', 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT id, name, email, is_verified FROM tenants WHERE slug = ?");
    $stmt->execute([$tenantSlug]);
    $tenant = $stmt->fetch();

    if (!$tenant) {
        sendError('Toko tidak ditemukan', 404);
    }

    if ($tenant['is_verified']) {
        sendError('Email sudah diverifikasi. Silakan login.', 400);
    }

    if (empty($tenant['email'])) {
        sendError('Email admin tidak ditemukan di database.', 400);
    }

    // Buat OTP baru (rate limit: minimal 1 menit antar pengiriman)
    $stmtCheck = $db->prepare("SELECT otp_expires_at FROM tenants WHERE id = ?");
    $stmtCheck->execute([$tenant['id']]);
    $row = $stmtCheck->fetch();
    if ($row && $row['otp_expires_at']) {
        $timeLeft = strtotime($row['otp_expires_at']) - time();
        if ($timeLeft > 540) { // Lebih dari 9 menit tersisa → baru saja kirim
            sendError('Tunggu sebentar sebelum mengirim ulang OTP (cooldown 1 menit).', 429);
        }
    }

    $otp       = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpExpiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    $stmt = $db->prepare("UPDATE tenants SET otp = ?, otp_expires_at = ? WHERE id = ?");
    $stmt->execute([$otp, $otpExpiry, $tenant['id']]);

    $emailSent = sendOTPEmail($tenant['email'], $tenant['name'], $otp, $tenant['name']);
    if (!$emailSent) {
        sendError('Gagal mengirim email. Periksa konfigurasi SMTP.', 500);
    }

    $maskedEmail = substr($tenant['email'], 0, 3) . '***@' . explode('@', $tenant['email'])[1];
    sendResponse([
        'success'      => true,
        'message'      => "OTP baru telah dikirim ke $maskedEmail. Berlaku 10 menit."
    ]);

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
