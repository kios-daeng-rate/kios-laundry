<?php
require_once __DIR__ . '/core.php';

$db = getDB();
$tenantId = getTenantId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stats = [
            'total_orders'   => 0, 'today_orders'   => 0,
            'today_revenue'  => 0, 'new_customers'  => 0,
            'status_counts'  => ['Baru'=>0,'Diproses'=>0,'Dicuci'=>0,'Disetrika'=>0,'Selesai'=>0,'Diambil'=>0],
            'recent_orders'  => [],
            'revenue_chart'  => []
        ];

        $stmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE tenant_id = ?");
        $stmt->execute([$tenantId]);
        $stats['total_orders'] = (int)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE tenant_id = ? AND DATE(created_at) = CURRENT_DATE");
        $stmt->execute([$tenantId]);
        $stats['today_orders'] = (int)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE tenant_id = ? AND DATE(created_at) = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)");
        $stmt->execute([$tenantId]);
        $stats['yesterday_orders'] = (int)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT SUM(total) FROM orders WHERE tenant_id = ? AND DATE(created_at) = CURRENT_DATE");
        $stmt->execute([$tenantId]);
        $stats['today_revenue'] = (float)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT SUM(total) FROM orders WHERE tenant_id = ? AND DATE(created_at) = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)");
        $stmt->execute([$tenantId]);
        $stats['yesterday_revenue'] = (float)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT COUNT(*) FROM customers WHERE tenant_id = ? AND DATE(created_at) = CURRENT_DATE");
        $stmt->execute([$tenantId]);
        $stats['new_customers'] = (int)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT COUNT(*) FROM customers WHERE tenant_id = ? AND DATE(created_at) = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)");
        $stmt->execute([$tenantId]);
        $stats['yesterday_customers'] = (int)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT status, COUNT(*) as count FROM orders WHERE tenant_id = ? GROUP BY status");
        $stmt->execute([$tenantId]);
        while ($row = $stmt->fetch()) {
            $stats['status_counts'][$row['status']] = (int)$row['count'];
        }

        $stmt = $db->prepare("SELECT id, customer_name, service_name, total, status, payment_method, created_at FROM orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$tenantId]);
        $stats['recent_orders'] = $stmt->fetchAll();

        $stmt = $db->prepare("
            SELECT DATE(created_at) as date, SUM(total) as revenue 
            FROM orders 
            WHERE tenant_id = ? AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        ");
        $stmt->execute([$tenantId]);
        $chartData = $stmt->fetchAll();
        
        $days        = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
        $chartResult = [];
        for ($i = 6; $i >= 0; $i--) {
            $date    = date('Y-m-d', strtotime("-$i days"));
            $dayName = $days[date('w', strtotime($date))];
            $revenue = 0;
            foreach ($chartData as $row) {
                if ($row['date'] === $date) { $revenue = (float)$row['revenue']; break; }
            }
            $chartResult[] = ['name' => $dayName, 'pendapatan' => $revenue];
        }
        $stats['revenue_chart'] = $chartResult;

        sendResponse($stats);
    } catch (PDOException $e) {
        sendError('Gagal mengambil data dashboard', 500);
    }
}
