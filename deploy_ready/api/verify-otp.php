<?php
require_once __DIR__ . '/core.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input       = json_decode(file_get_contents('php://input'), true);
$tenantSlug  = trim($input['tenant_slug'] ?? '');
$otp         = trim($input['otp'] ?? '');

if (empty($tenantSlug) || empty($otp)) {
    sendError('Kode Toko dan OTP wajib diisi', 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT id, otp, otp_expires_at, is_verified FROM tenants WHERE slug = ?");
    $stmt->execute([$tenantSlug]);
    $tenant = $stmt->fetch();

    if (!$tenant) {
        sendError('Toko tidak ditemukan', 404);
    }

    if ($tenant['is_verified']) {
        sendError('Email sudah diverifikasi sebelumnya. Silakan login.', 400);
    }

    // Cek waktu kadaluarsa
    if (strtotime($tenant['otp_expires_at']) < time()) {
        sendError('Kode OTP sudah kadaluarsa. Silakan kirim ulang OTP.', 400);
    }

    // Cocokkan OTP
    if ($tenant['otp'] !== $otp) {
        sendError('Kode OTP tidak sesuai. Coba lagi.', 401);
    }

    // Verifikasi berhasil
    $stmt = $db->prepare("UPDATE tenants SET is_verified = 1, otp = NULL, otp_expires_at = NULL WHERE id = ?");
    $stmt->execute([$tenant['id']]);

    sendResponse([
        'success' => true,
        'message' => 'Email berhasil diverifikasi! Silakan login dengan kode toko Anda.'
    ]);

} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
