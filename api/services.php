<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$tenantId = getTenantId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT * FROM services WHERE tenant_id = ? ORDER BY category, name");
        $stmt->execute([$tenantId]);
        sendResponse($stmt->fetchAll());
    } catch (PDOException $e) {
        sendError('Gagal mengambil data layanan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['name']) || empty($input['price']) || empty($input['unit']) || empty($input['estimasi']) || empty($input['category'])) {
        sendError('Semua field harus diisi');
    }

    try {
        $stmt = $db->prepare("INSERT INTO services (tenant_id, name, price, unit, estimasi, category, icon) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tenantId, $input['name'], $input['price'], $input['unit'], $input['estimasi'], $input['category'], $input['icon'] ?? '👕']);
        
        $input['id'] = $db->lastInsertId();
        sendResponse($input, 201);
    } catch (PDOException $e) {
        sendError('Gagal menambahkan layanan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id']) || empty($input['name']) || empty($input['price']) || empty($input['unit']) || empty($input['estimasi']) || empty($input['category'])) {
        sendError('ID dan semua field wajib diisi');
    }

    try {
        $stmt = $db->prepare("UPDATE services SET name = ?, price = ?, unit = ?, estimasi = ?, category = ?, icon = ? WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$input['name'], $input['price'], $input['unit'], $input['estimasi'], $input['category'], $input['icon'] ?? '👕', $input['id'], $tenantId]);
        
        sendResponse($input);
    } catch (PDOException $e) {
        sendError('Gagal mengupdate layanan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('ID layanan tidak ditemukan');
    }

    try {
        $stmt_check = $db->prepare("SELECT COUNT(*) FROM orders WHERE service_id = ? AND tenant_id = ?");
        $stmt_check->execute([$id, $tenantId]);
        if ($stmt_check->fetchColumn() > 0) {
            sendError('Tidak dapat menghapus layanan ini karena sudah memiliki riwayat pesanan aktif.');
        }

        $stmt = $db->prepare("DELETE FROM services WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);
        
        sendResponse(['success' => true]);
    } catch (PDOException $e) {
        sendError('Gagal menghapus layanan', 500);
    }
}
