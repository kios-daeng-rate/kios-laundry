<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$tenantId = getTenantId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT id, username, name, role, created_at FROM users WHERE tenant_id = ? ORDER BY created_at DESC");
        $stmt->execute([$tenantId]);
        sendResponse($stmt->fetchAll());
    } catch (PDOException $e) {
        sendError('Gagal memuat pengguna', 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['username']) || empty($input['password']) || empty($input['name'])) {
        sendError('Username, Password, dan Nama wajib diisi');
    }

    try {
        $stmt_check = $db->prepare("SELECT id FROM users WHERE username = ? AND tenant_id = ?");
        $stmt_check->execute([$input['username'], $tenantId]);
        if ($stmt_check->fetch()) {
            sendError('Username sudah digunakan');
        }

        $hashed_pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $role = $input['role'] ?? 'karyawan';

        $stmt = $db->prepare("INSERT INTO users (tenant_id, username, password, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$tenantId, $input['username'], $hashed_pass, $input['name'], $role]);
        
        $input['id'] = $db->lastInsertId();
        unset($input['password']);
        
        sendResponse($input, 201);
    } catch (Exception $e) {
        sendError('Gagal SQL: ' . $e->getMessage(), 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id']) || empty($input['username']) || empty($input['name'])) {
        sendError('ID, Username, dan Nama wajib diisi');
    }

    try {
        $stmt_check = $db->prepare("SELECT id FROM users WHERE username = ? AND tenant_id = ? AND id != ?");
        $stmt_check->execute([$input['username'], $tenantId, $input['id']]);
        if ($stmt_check->fetch()) {
            sendError('Username sudah digunakan pengguna lain');
        }

        $role = $input['role'] ?? 'karyawan';
        
        if (!empty($input['password'])) {
            $hashed_pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET username = ?, password = ?, name = ?, role = ? WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$input['username'], $hashed_pass, $input['name'], $role, $input['id'], $tenantId]);
        } else {
            $stmt = $db->prepare("UPDATE users SET username = ?, name = ?, role = ? WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$input['username'], $input['name'], $role, $input['id'], $tenantId]);
        }
        
        unset($input['password']);
        sendResponse($input);
    } catch (Exception $e) {
        sendError('Gagal SQL: ' . $e->getMessage(), 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('ID pengguna tidak ditemukan');
    }

    try {
        $stmt_check = $db->prepare("SELECT role FROM users WHERE id = ? AND tenant_id = ?");
        $stmt_check->execute([$id, $tenantId]);
        $user = $stmt_check->fetch();
        
        if ($user && $user['role'] === 'admin') {
            $stmt_admin = $db->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin' AND tenant_id = ?");
            $stmt_admin->execute([$tenantId]);
            if ($stmt_admin->fetchColumn() <= 1) {
                sendError('Tidak bisa menghapus satu-satunya administrator.');
            }
        }

        $stmt = $db->prepare("DELETE FROM users WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);
        
        sendResponse(['success' => true]);
    } catch (Exception $e) {
        sendError('Gagal SQL: ' . $e->getMessage(), 500);
    }
}
