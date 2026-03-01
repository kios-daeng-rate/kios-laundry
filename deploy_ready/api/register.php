<?php
require_once __DIR__ . '/core.php';
require_once __DIR__ . '/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

// Validasi field wajib
$required = ['store_name', 'store_slug', 'admin_name', 'admin_username', 'password', 'email'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendError('Semua field wajib diisi termasuk Email', 400);
    }
}

// Validasi format email
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    sendError('Format email tidak valid', 400);
}

// Bersihkan slug: huruf kecil, hanya huruf/angka/strip
$slug = strtolower(trim($input['store_slug']));
$slug = preg_replace('/[^a-z0-9\-]/', '-', $slug);
$slug = preg_replace('/-+/', '-', $slug);
$slug = trim($slug, '-');

if (strlen($slug) < 3) {
    sendError('Kode Toko minimal 3 karakter (huruf, angka, atau tanda hubung)', 400);
}

try {
    $db = getDB();

    // Cek apakah slug sudah dipakai
    $stmt = $db->prepare("SELECT id, is_verified FROM tenants WHERE slug = ?");
    $stmt->execute([$slug]);
    $existingTenant = $stmt->fetch();

    if ($existingTenant) {
        if ($existingTenant['is_verified']) {
            sendError('Kode Toko sudah digunakan, silakan pilih yang lain', 409);
        } else {
            // Tenant sudah ada tapi belum diverifikasi — hapus dan daftarkan ulang
            $db->prepare("DELETE FROM users WHERE tenant_id = ?")->execute([$existingTenant['id']]);
            $db->prepare("DELETE FROM settings WHERE tenant_id = ?")->execute([$existingTenant['id']]);
            $db->prepare("DELETE FROM services WHERE tenant_id = ?")->execute([$existingTenant['id']]);
            $db->prepare("DELETE FROM tenants WHERE id = ?")->execute([$existingTenant['id']]);
        }
    }

    $db->beginTransaction();

    // Generate OTP 6 digit
    $otp       = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpExpiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // 1. Buat tenant baru (belum terverifikasi)
    $stmt = $db->prepare("INSERT INTO tenants (name, slug, email, otp, otp_expires_at, is_verified) VALUES (?, ?, ?, ?, ?, 0)");
    $stmt->execute([trim($input['store_name']), $slug, $input['email'], $otp, $otpExpiry]);
    $tenantId = $db->lastInsertId();

    // 2. Buat user admin
    $hashedPass = password_hash($input['password'], PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (tenant_id, username, password, name, role) VALUES (?, ?, ?, ?, 'admin')");
    $stmt->execute([$tenantId, $input['admin_username'], $hashedPass, $input['admin_name']]);

    // 3. Settings default
    $stmt = $db->prepare("INSERT INTO settings (tenant_id, store_name, address, phone) VALUES (?, ?, '', '')");
    $stmt->execute([$tenantId, trim($input['store_name'])]);

    // 4. Layanan default lengkap
    $defaultServices = [
        ['Cuci Kering',          7000,  'kg',    '2 hari', 'Regular', '🧺'],
        ['Cuci Setrika',         10000, 'kg',    '3 hari', 'Regular', '👕'],
        ['Setrika Saja',         5000,  'kg',    '1 hari', 'Regular', '✨'],
        ['Cuci Lipat',           6000,  'kg',    '2 hari', 'Regular', '👔'],
        ['Cuci Express',         15000, 'kg',    '8 jam',  'Express', '⚡'],
        ['Cuci Setrika Express', 20000, 'kg',    '1 hari', 'Express', '🚀'],
        ['Dry Clean',            25000, 'pcs',   '3 hari', 'Premium', '✨'],
        ['Cuci Jas',             30000, 'pcs',   '3 hari', 'Premium', '🤵'],
        ['Cuci Sepatu',          35000, 'pasang','3 hari', 'Spesial', '👟'],
        ['Cuci Karpet',          15000, 'kg',    '4 hari', 'Spesial', '🧶'],
        ['Cuci Bed Cover',       30000, 'pcs',   '3 hari', 'Spesial', '🛏️'],
    ];
    $stmt = $db->prepare("INSERT INTO services (tenant_id, name, price, unit, estimasi, category, icon) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($defaultServices as $srv) {
        $stmt->execute(array_merge([$tenantId], $srv));
    }

    $db->commit();

    // Kirim email OTP
    $emailSent = sendOTPEmail($input['email'], $input['admin_name'], $otp, trim($input['store_name']));
    if (!$emailSent) {
        // Rollback jika email gagal dikirim
        $db->prepare("DELETE FROM users WHERE tenant_id = ?")->execute([$tenantId]);
        $db->prepare("DELETE FROM settings WHERE tenant_id = ?")->execute([$tenantId]);
        $db->prepare("DELETE FROM services WHERE tenant_id = ?")->execute([$tenantId]);
        $db->prepare("DELETE FROM tenants WHERE id = ?")->execute([$tenantId]);
        sendError('Gagal mengirim email verifikasi. Periksa konfigurasi SMTP di email_config.php', 500);
    }

    sendResponse([
        'success'      => true,
        'message'      => 'Kode OTP telah dikirim ke email Anda. Berlaku 10 menit.',
        'tenant_slug'  => $slug,
        'tenant_name'  => trim($input['store_name']),
        'email_masked' => substr($input['email'], 0, 3) . '***@' . explode('@', $input['email'])[1]
    ], 201);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    sendError('Gagal mendaftarkan toko: ' . $e->getMessage(), 500);
}
