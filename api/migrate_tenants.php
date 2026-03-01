<?php
/**
 * migrate_tenants.php
 * 
 * Skrip migrasi untuk pengguna yang sudah menginstal aplikasi sebelumnya.
 * Jalankan SEKALI untuk menambahkan fitur multi-tenant ke database yang ada.
 * 
 * Cara penggunaan: Akses URL: https://domain-anda.com/api/migrate_tenants.php
 * Setelah berhasil, HAPUS file ini dari server!
 */

require_once __DIR__ . '/core.php';

$db = getDB();
$log = [];
$errors = [];

function runQuery($db, $sql, &$log, &$errors, $label) {
    try {
        $db->exec($sql);
        $log[] = "✅ " . $label;
    } catch (PDOException $e) {
        // Abaikan error "already exists"
        if (strpos($e->getMessage(), 'Duplicate') !== false || 
            strpos($e->getMessage(), 'already exists') !== false) {
            $log[] = "⏩ " . $label . " (sudah ada, dilewati)";
        } else {
            $errors[] = "❌ " . $label . ": " . $e->getMessage();
        }
    }
}

// 1. Buat tabel tenants
runQuery($db, "
    CREATE TABLE IF NOT EXISTS `tenants` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(100) NOT NULL,
        `slug` varchar(50) NOT NULL,
        `is_active` tinyint(1) NOT NULL DEFAULT 1,
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `slug` (`slug`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
", $log, $errors, "Buat tabel tenants");

// 2. Masukkan tenant default (untuk data yang sudah ada)
try {
    $stmt = $db->query("SELECT COUNT(*) FROM tenants");
    if ($stmt->fetchColumn() == 0) {
        // Ambil nama toko dari settings
        $nameStmt = $db->query("SELECT store_name FROM settings LIMIT 1");
        $existingName = $nameStmt ? ($nameStmt->fetchColumn() ?: 'Toko Pertama') : 'Toko Pertama';
        $db->prepare("INSERT INTO tenants (id, name, slug, is_verified) VALUES (1, ?, 'toko-utama', 1)")
           ->execute([$existingName]);
        $log[] = "✅ Buat tenant default (ID=1, slug='toko-utama')";
    } else {
        $log[] = "⏩ Tenant default sudah ada, dilewati";
    }
} catch (PDOException $e) {
    $errors[] = "❌ Buat tenant default: " . $e->getMessage();
}

// 2b. Tambah kolom OTP dan verifikasi ke tabel tenants (jika belum ada)
$newCols = [
    'email'           => "ALTER TABLE `tenants` ADD COLUMN `email` varchar(100) NULL AFTER `slug`",
    'otp'             => "ALTER TABLE `tenants` ADD COLUMN `otp` varchar(6) NULL AFTER `email`",
    'otp_expires_at'  => "ALTER TABLE `tenants` ADD COLUMN `otp_expires_at` datetime NULL AFTER `otp`",
    'is_verified'     => "ALTER TABLE `tenants` ADD COLUMN `is_verified` tinyint(1) NOT NULL DEFAULT 0 AFTER `otp_expires_at`",
];
foreach ($newCols as $col => $sql) {
    try {
        $check = $db->query("SHOW COLUMNS FROM `tenants` LIKE '$col'")->fetch();
        if (!$check) {
            $db->exec($sql);
            $log[] = "✅ Tambah kolom $col ke tabel tenants";
        } else {
            $log[] = "⏩ Kolom $col di tenants sudah ada, dilewati";
        }
    } catch (PDOException $e) {
        $errors[] = "❌ Tambah kolom $col: " . $e->getMessage();
    }
}

// Set is_verified = 1 untuk tenant lama (data sebelum fitur OTP)
try {
    $db->exec("UPDATE `tenants` SET is_verified = 1 WHERE is_verified = 0 AND otp IS NULL");
    $log[] = "✅ Set is_verified=1 untuk tenant lama";
} catch (PDOException $e) {
    $errors[] = "❌ Update is_verified tenant lama: " . $e->getMessage();
}

// 3. Tambah kolom tenant_id ke tabel yang ada
$tables = ['users', 'customers', 'services', 'orders', 'settings'];
foreach ($tables as $table) {
    // Cek apakah kolom sudah ada
    try {
        $check = $db->query("SHOW COLUMNS FROM `$table` LIKE 'tenant_id'")->fetch();
        if (!$check) {
            $db->exec("ALTER TABLE `$table` ADD COLUMN `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`");
            $log[] = "✅ Tambah kolom tenant_id ke tabel $table";
        } else {
            $log[] = "⏩ Kolom tenant_id di $table sudah ada, dilewati";
        }
    } catch (PDOException $e) {
        $errors[] = "❌ Tambah tenant_id ke $table: " . $e->getMessage();
    }
}

// 4. Isi tenant_id = 1 untuk semua data lama
foreach ($tables as $table) {
    try {
        $db->exec("UPDATE `$table` SET tenant_id = 1 WHERE tenant_id = 0 OR tenant_id IS NULL");
        $log[] = "✅ Isi tenant_id=1 untuk data lama di tabel $table";
    } catch (PDOException $e) {
        $errors[] = "❌ Update tenant_id di $table: " . $e->getMessage();
    }
}

$status = empty($errors) ? 'success' : 'partial';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migrasi Multi-Tenant</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 600px; }
        h1 { color: #4f46e5; margin-top: 0; }
        .log-item { padding: 0.5rem; border-radius: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; font-family: monospace; }
        .success-bg { background: #f0fdf4; }
        .error-bg { background: #fef2f2; color: #dc2626; }
        .warning { background: #fef9c3; color: #854d0e; padding: 1rem; border-radius: 0.5rem; margin-top: 1.5rem; font-size: 0.875rem; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: bold; }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-error { background: #fee2e2; color: #dc2626; }
    </style>
</head>
<body>
<div class="card">
    <h1>🔄 Migrasi Multi-Tenant</h1>
    <span class="badge <?= $status === 'success' ? 'badge-success' : 'badge-error' ?>">
        <?= $status === 'success' ? '✅ Berhasil' : '⚠️ Sebagian Berhasil' ?>
    </span>
    <div style="margin-top: 1.5rem;">
        <?php foreach ($log as $item): ?>
            <div class="log-item success-bg"><?= htmlspecialchars($item) ?></div>
        <?php endforeach; ?>
        <?php foreach ($errors as $error): ?>
            <div class="log-item error-bg"><?= htmlspecialchars($error) ?></div>
        <?php endforeach; ?>
    </div>
    <?php if (empty($errors)): ?>
        <div class="warning">
            ⚠️ <strong>PENTING:</strong> Migrasi selesai! Segera <strong>hapus file <code>migrate_tenants.php</code></strong> dari server Anda demi keamanan.
            Kode toko default Anda adalah: <strong>toko-utama</strong>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
