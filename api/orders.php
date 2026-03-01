<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$tenantId = getTenantId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT o.*, c.phone as customer_phone 
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.tenant_id = ? 
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$tenantId]);
        $orders = $stmt->fetchAll();
        sendResponse($orders);
    } catch (PDOException $e) {
        sendError('Gagal mengambil data pesanan', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['customer_id']) || empty($input['service_id']) || empty($input['weight']) || empty($input['total'])) {
        sendError('Data pesanan tidak lengkap');
    }

    try {
        $db->beginTransaction();

        // Generate Order ID unik per tenant per hari
        $dateStr = date('Ymd');
        $stmt = $db->prepare("SELECT id FROM orders WHERE id LIKE ? ORDER BY id DESC LIMIT 1");
        $stmt->execute(["ORD-$dateStr-%"]);
        $lastOrder = $stmt->fetchColumn();
        
        $counter = 1;
        if ($lastOrder) {
            $parts   = explode('-', $lastOrder);
            $counter = intval(end($parts)) + 1;
        }
        
        $orderId = sprintf("ORD-%s-%03d", $dateStr, $counter);

        // Fetch Customer Name (pastikan milik tenant ini)
        $stmt = $db->prepare("SELECT name FROM customers WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$input['customer_id'], $tenantId]);
        $customerName = $stmt->fetchColumn();

        // Fetch Service Name (pastikan milik tenant ini)
        $stmt = $db->prepare("SELECT name FROM services WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$input['service_id'], $tenantId]);
        $serviceName = $stmt->fetchColumn();

        if (!$customerName || !$serviceName) {
            throw new Exception("Customer atau Service tidak valid");
        }

        $stmt = $db->prepare("INSERT INTO orders (id, tenant_id, customer_id, customer_name, service_id, service_name, weight, total, status, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Baru', ?, ?)");
        $stmt->execute([
            $orderId, $tenantId,
            $input['customer_id'], $customerName,
            $input['service_id'],  $serviceName,
            $input['weight'],      $input['total'],
            $input['payment_method'] ?? 'Tunai',
            $input['notes'] ?? ''
        ]);

        $db->commit();

        $input['id']            = $orderId;
        $input['status']        = 'Baru';
        $input['customer_name'] = $customerName;
        $input['service_name']  = $serviceName;
        $input['created_at']    = date('Y-m-d H:i:s');

        sendResponse($input, 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendError('Gagal membuat pesanan: ' . $e->getMessage(), 500);
    }
}

// Update order status
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id']) || empty($input['status'])) {
        sendError('ID Pesanan dan Status baru wajib disertakan');
    }

    $validStatuses = ['Baru', 'Diproses', 'Dicuci', 'Disetrika', 'Selesai', 'Diambil'];
    if (!in_array($input['status'], $validStatuses)) {
        sendError('Status tidak valid');
    }

    try {
        $query  = "UPDATE orders SET status = ?";
        $params = [$input['status']];

        if ($input['status'] === 'Diambil') {
            $query .= ", pickup_date = CURRENT_DATE";
        }

        $query   .= " WHERE id = ? AND tenant_id = ?";
        $params[] = $input['id'];
        $params[] = $tenantId;

        $stmt = $db->prepare($query);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            sendError('Pesanan tidak ditemukan', 404);
        }

        sendResponse(['message' => 'Status berhasil diupdate']);
    } catch (PDOException $e) {
        sendError('Gagal mengupdate status', 500);
    }
}
