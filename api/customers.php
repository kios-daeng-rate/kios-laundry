<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$tenantId = getTenantId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT c.*, 
                   COUNT(o.id) as total_orders, 
                   COALESCE(SUM(o.total), 0) as total_spent 
            FROM customers c 
            LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
            WHERE c.tenant_id = ?
            GROUP BY c.id 
            ORDER BY c.name
        ");
        $stmt->execute([$tenantId, $tenantId]);
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($customers as &$customer) {
            $customer['total_orders'] = (int)$customer['total_orders'];
            $customer['total_spent']  = (float)$customer['total_spent'];
        }
        
        sendResponse($customers);
    } catch (PDOException $e) {
        sendError('Gagal mengambil data pelanggan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['name']) || empty($input['phone'])) {
        sendError('Nama dan nomor HP pelanggan wajib diisi');
    }

    try {
        $stmt = $db->prepare("INSERT INTO customers (tenant_id, name, phone, address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$tenantId, $input['name'], $input['phone'], $input['address'] ?? '']);
        
        $input['id'] = $db->lastInsertId();
        sendResponse($input, 201);
    } catch (PDOException $e) {
        sendError('Gagal menambahkan pelanggan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id']) || empty($input['name']) || empty($input['phone'])) {
        sendError('ID, Nama, dan nomor HP pelanggan wajib diisi');
    }

    try {
        $stmt = $db->prepare("UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$input['name'], $input['phone'], $input['address'] ?? '', $input['id'], $tenantId]);
        
        sendResponse($input);
    } catch (PDOException $e) {
        sendError('Gagal mengupdate pelanggan', 500);
    }
}
