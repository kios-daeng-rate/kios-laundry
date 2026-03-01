<?php
require_once __DIR__ . '/core.php';

// Public endpoint - no getTenantId() check here because it's for customers
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $orderId = $_GET['order_id'] ?? null;

    if (!$orderId) {
        sendError('Nomor order tidak valid');
    }

    try {
        // We need store name from settings and estimasi from services
        $stmt = $db->prepare("
            SELECT o.*, 
                   s.store_name, s.address as store_address, s.phone as store_phone,
                   sv.estimasi
            FROM orders o 
            LEFT JOIN settings s ON o.tenant_id = s.tenant_id 
            LEFT JOIN services sv ON o.service_id = sv.id
            WHERE o.id = ?
        ");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            sendError('Pesanan tidak ditemukan', 404);
        }

        // Return only what's necessary for the customer
        $response = [
            'id' => $order['id'],
            'customer_name' => $order['customer_name'],
            'service_name' => $order['service_name'],
            'weight' => $order['weight'],
            'total' => $order['total'],
            'status' => $order['status'],
            'created_at' => $order['created_at'],
            'pickup_date' => $order['pickup_date'],
            'estimasi' => $order['estimasi'], // New field
            'store_name' => $order['store_name'] ?: 'FreshClean Laundry',
            'store_address' => $order['store_address'],
            'store_phone' => $order['store_phone']
        ];

        sendResponse($response);
    } catch (PDOException $e) {
        sendError('Terjadi kesalahan sistem', 500);
    }
} else {
    sendError('Metode tidak diizinkan', 405);
}
