<?php
require_once __DIR__ . '/core.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$username    = $input['username']    ?? '';
$password    = $input['password']    ?? '';
$tenantSlug  = $input['tenant_code'] ?? '';

if (empty($username) || empty($password)) {
    sendError('Username dan password wajib diisi');
}
if (empty($tenantSlug)) {
    sendError('Kode Toko wajib diisi');
}

try {
    $db = getDB();

    // 1. Cari tenant berdasarkan slug
    $stmtTenant = $db->prepare("SELECT id, name, is_verified FROM tenants WHERE slug = ? AND is_active = 1");
    $stmtTenant->execute([strtolower(trim($tenantSlug))]);
    $tenant = $stmtTenant->fetch();

    if (!$tenant) {
        sendError('Kode Toko tidak ditemukan atau tidak aktif', 404);
    }

    // Tolak login jika email belum diverifikasi
    if (!$tenant['is_verified']) {
        http_response_code(403);
        echo json_encode([
            'error'       => 'Akun belum diverifikasi. Silakan cek email Anda untuk kode OTP.',
            'unverified'  => true,
            'tenant_slug' => strtolower(trim($tenantSlug))
        ]);
        exit;
    }

    // 2. Cari user hanya di dalam tenant yang cocok
    $stmt = $db->prepare("SELECT id, username, password, name, role FROM users WHERE username = ? AND tenant_id = ?");
    $stmt->execute([$username, $tenant['id']]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        unset($user['password']);
        $user['tenant_id']   = $tenant['id'];
        $user['tenant_name'] = $tenant['name'];
        $user['tenant_slug'] = strtolower(trim($tenantSlug));
        sendResponse(['user' => $user]);
    } else {
        sendError('Username atau password salah', 401);
    }
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
