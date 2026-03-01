<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$tenantId = getTenantId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Auto-migrate: add brand_logo column if not exists
        try { $db->exec("ALTER TABLE settings ADD COLUMN IF NOT EXISTS brand_logo LONGTEXT NULL"); } catch (Exception $e) {}

        $stmt = $db->prepare("SELECT * FROM settings WHERE tenant_id = ? LIMIT 1");
        $stmt->execute([$tenantId]);
        $settings = $stmt->fetch();
        sendResponse($settings ?: new stdClass());
    } catch (PDOException $e) {
        sendError('Gagal mengambil pengaturan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $stmt    = $db->prepare("SELECT id FROM settings WHERE tenant_id = ? LIMIT 1");
        $stmt->execute([$tenantId]);
        $existing = $stmt->fetchColumn();

        if ($existing) {
            $stmt = $db->prepare("UPDATE settings SET store_name = ?, address = ?, phone = ?, open_time = ?, close_time = ?, operational_days = ?, brand_logo = ? WHERE id = ? AND tenant_id = ?");
            $stmt->execute([
                $input['store_name'],
                $input['address'],
                $input['phone'],
                $input['open_time']['open']  ?? '08:00',
                $input['open_time']['close'] ?? '20:00',
                implode(',', $input['operational_days'] ?? []),
                $input['brand_logo'] ?? null,
                $existing,
                $tenantId
            ]);
        } else {
            $stmt = $db->prepare("INSERT INTO settings (tenant_id, store_name, address, phone, open_time, close_time, operational_days, brand_logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $tenantId,
                $input['store_name'],
                $input['address'],
                $input['phone'],
                $input['open_time']['open']  ?? '08:00',
                $input['open_time']['close'] ?? '20:00',
                implode(',', $input['operational_days'] ?? []),
                $input['brand_logo'] ?? null
            ]);
        }

        sendResponse(['message' => 'Pengaturan berhasil disimpan']);
    } catch (PDOException $e) {
        sendError('Gagal menyimpan pengaturan', 500);
    }
}
