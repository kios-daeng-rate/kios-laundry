<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    if ($action === 'backup') {
        $targets = $input['targets'] ?? []; // ['customers', 'orders', 'users']
        $backupData = [];

        try {
            if (in_array('customers', $targets)) {
                $stmt = $db->query("SELECT * FROM customers");
                $backupData['customers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            if (in_array('orders', $targets)) {
                $stmt = $db->query("SELECT * FROM orders");
                $backupData['orders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            if (in_array('users', $targets)) {
                $stmt = $db->query("SELECT * FROM users WHERE role != 'admin'");
                $backupData['users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            sendResponse([
                'success' => true,
                'timestamp' => date('Y-m-d H:i:s'),
                'data' => $backupData
            ]);
        } catch (Exception $e) {
            sendError('Gagal membuat backup. ' . $e->getMessage(), 500);
        }
    } 
    elseif ($action === 'restore') {
        $data = $input['data'] ?? [];
        if (empty($data)) sendError('Data restore kosong', 400);

        try {
            $db->beginTransaction();

            // Restore Customers
            if (isset($data['customers']) && is_array($data['customers'])) {
                $stmt = $db->prepare("INSERT INTO customers (id, name, phone, address, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), address=VALUES(address)");
                foreach ($data['customers'] as $c) {
                    $stmt->execute([$c['id'], $c['name'], $c['phone'], $c['address'], $c['created_at']]);
                }
            }

            // Restore Orders
            if (isset($data['orders']) && is_array($data['orders'])) {
                 $stmt = $db->prepare("INSERT INTO orders (id, customer_id, customer_name, service_id, service_name, weight, total, status, payment_method, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status), total=VALUES(total)");
                 foreach ($data['orders'] as $o) {
                     $stmt->execute([
                         $o['id'], $o['customer_id'], $o['customer_name'], $o['service_id'], $o['service_name'], $o['weight'], $o['total'], $o['status'], $o['payment_method'], $o['notes'], $o['created_at']
                     ]);
                 }
            }

            // Restore Users (Karyawan)
            if (isset($data['users']) && is_array($data['users'])) {
                // Ensure only non-admins are restored to avoid overriding master admin
                $stmt = $db->prepare("INSERT INTO users (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=VALUES(username), name=VALUES(name), role=VALUES(role)");
                foreach ($data['users'] as $u) {
                    if ($u['role'] !== 'admin') {
                         $stmt->execute([$u['id'], $u['username'], $u['password'], $u['name'], $u['role'], $u['created_at']]);
                    }
                }
            }

            $db->commit();
            sendResponse(['success' => true, 'message' => 'Data berhasil dipulihkan']);
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Terjadi kesalahan saat memulihkan data: ' . $e->getMessage(), 500);
        }
    }
    elseif ($action === 'reset') {
        $adminId = $input['admin_id'] ?? null;
        $password = $input['password'] ?? '';

        if (!$adminId || !$password) {
            sendError('ID dan Password Administrator dibutuhkan untuk melakukan reset.', 400);
        }

        // Verify admin password
        $stmt = $db->prepare("SELECT password FROM users WHERE id = ? AND role = 'admin'");
        $stmt->execute([$adminId]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin || !password_verify($password, $admin['password'])) {
            sendError('Password Administrator salah. Reset dibatalkan.', 401);
        }

        try {
            $db->beginTransaction();
            // Delete all orders
            $db->exec("DELETE FROM orders");
            // Delete all customers
            $db->exec("DELETE FROM customers");
            // Delete employees (Keep settings and admins)
            $db->exec("DELETE FROM users WHERE role != 'admin'");
            $db->commit();

            sendResponse(['success' => true, 'message' => 'Sistem berhasil di-reset']);
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Gagal melakukan reset sistem: ' . $e->getMessage(), 500);
        }
    } else {
        sendError('Aksi tidak valid', 400);
    }
} else {
     sendError('Metode tidak didukung', 405);
}
