<?php
session_start();
$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$error = '';
$success = '';

// Check if already installed
if (file_exists('config.php')) {
    echo '<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplikasi Telah Terinstal</title>
    <meta http-equiv="refresh" content="3;url=../index.html">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #334155; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { color: #4f46e5; font-size: 1.5rem; margin-top: 0; margin-bottom: 0.5rem; }
        p { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Instalasi Ditemukan</h1>
        <p>Aplikasi sudah terinstal. Secara otomatis mengalihkan Anda ke halaman Login...</p>
        <div class="loader"></div>
    </div>
</body>
</html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($step === 2) {
        $db_host = $_POST['db_host'] ?? 'localhost';
        $db_user = $_POST['db_user'] ?? '';
        $db_pass = $_POST['db_pass'] ?? '';
        $db_name = $_POST['db_name'] ?? '';

        // Test connection and create DB if not exists
        try {
            $conn = new PDO("mysql:host=$db_host", $db_user, $db_pass);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create database
            $conn->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $conn->exec("USE `$db_name`");
            
            // Import database schema safely via Embedded SQL
            $sqlFile = <<<SQL
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('admin','karyawan') NOT NULL DEFAULT 'karyawan',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) NOT NULL,
  `open_time` time NOT NULL DEFAULT '08:00:00',
  `close_time` time NOT NULL DEFAULT '20:00:00',
  `operational_days` varchar(100) NOT NULL DEFAULT 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'kg',
  `estimasi` varchar(50) NOT NULL,
  `category` varchar(50) NOT NULL,
  `icon` varchar(20) DEFAULT '👕',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `service_id` int(11) NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `status` enum('Baru','Diproses','Dicuci','Disetrika','Selesai','Diambil') NOT NULL DEFAULT 'Baru',
  `payment_method` varchar(50) NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pickup_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_order_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

            $queries = explode(';', $sqlFile);
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    $conn->exec($query);
                }
            }

            // Save credentials to session for next step
            $_SESSION['db'] = [
                'host' => $db_host,
                'user' => $db_user,
                'pass' => $db_pass,
                'name' => $db_name
            ];

            header("Location: ?step=3");
            exit;
        } catch (Exception $e) {
            $error = "Gagal setup database: " . $e->getMessage();
        }
    }

    if ($step === 3) {
        $store_name = $_POST['store_name'] ?? '';
        $store_address = $_POST['store_address'] ?? '';
        $store_phone = $_POST['store_phone'] ?? '';
        
        $admin_user = $_POST['admin_user'] ?? '';
        $admin_pass = $_POST['admin_pass'] ?? '';

        if (empty($store_name) || empty($admin_user) || empty($admin_pass)) {
            $error = "Semua field yang ditandai bintang wajib diisi!";
        } else {
            try {
                $db = $_SESSION['db'];
                $conn = new PDO("mysql:host={$db['host']};dbname={$db['name']}", $db['user'], $db['pass']);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                // Insert Settings
                $stmt = $conn->prepare("INSERT INTO settings (store_name, address, phone) VALUES (?, ?, ?)");
                $stmt->execute([$store_name, $store_address, $store_phone]);

                // Insert Admin User
                $hashed_pass = password_hash($admin_pass, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, 'Administrator', 'admin')");
                $stmt->execute([$admin_user, $hashed_pass]);

                // Insert default services
                $services = [
                    // REGULAR
                    ['Cuci Kering', 7000, 'kg', '2 hari', 'Regular', '🧺'],
                    ['Cuci Setrika', 10000, 'kg', '3 hari', 'Regular', '👕'],
                    ['Setrika Saja', 5000, 'kg', '1 hari', 'Regular', '✨'],
                    ['Cuci Lipat', 6000, 'kg', '2 hari', 'Regular', '👔'],
                    // EXPRESS
                    ['Cuci Express', 15000, 'kg', '8 jam', 'Express', '⚡'],
                    ['Cuci Setrika Express', 20000, 'kg', '1 hari', 'Express', '🚀'],
                    // PREMIUM
                    ['Dry Clean', 25000, 'pcs', '3 hari', 'Premium', '✨'],
                    ['Cuci Jas', 30000, 'pcs', '3 hari', 'Premium', '🤵'],
                    // SPESIAL
                    ['Cuci Sepatu', 35000, 'pasang', '3 hari', 'Spesial', '👟'],
                    ['Cuci Karpet', 15000, 'kg', '4 hari', 'Spesial', '🧶'],
                    ['Cuci Bed Cover', 30000, 'pcs', '3 hari', 'Spesial', '🛏️']
                ];
                $stmt = $conn->prepare("INSERT INTO services (name, price, unit, estimasi, category, icon) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($services as $srv) {
                    $stmt->execute($srv);
                }

                // Generate config.php

                $configContent = "<?php\n\n" .
                "define('DB_HOST', '{$db['host']}');\n" .
                "define('DB_USER', '{$db['user']}');\n" .
                "define('DB_PASS', '{$db['pass']}');\n" .
                "define('DB_NAME', '{$db['name']}');\n\n" .
                "function getDB() {\n" .
                "    \$conn = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);\n" .
                "    \$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);\n" .
                "    \$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);\n" .
                "    return \$conn;\n" .
                "}\n";

                file_put_contents('config.php', $configContent);

                // Clear session
                session_destroy();

                header("Location: ?step=4");
                exit;

            } catch (PDOException $e) {
                $error = "Terjadi kesalahan saat menyimpan data: " . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalasi FreshClean POS</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #334155; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
        h1 { color: #4f46e5; margin-top: 0; font-size: 1.5rem; text-align: center; margin-bottom: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
        input[type="text"], input[type="password"] { width: 100%; box-sizing: border-box; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 1rem; }
        input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.2); }
        .btn { display: block; width: 100%; padding: 0.75rem; background: #4f46e5; color: white; border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: bold; cursor: pointer; text-align: center; text-decoration: none; box-sizing: border-box; }
        .btn:hover { background: #4338ca; }
        .alert-error { background: #fef2f2; color: #dc2626; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.875rem; border: 1px solid #fecaca; }
        .alert-success { background: #f0fdf4; color: #16a34a; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.875rem; border: 1px solid #bbf7d0; text-align: center; }
        .step-indicator { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; }
        .step-dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
        .step-dot.active { background: #4f46e5; outline: 3px solid rgba(79,70,229,0.2); }
        .desc { text-align: center; color: #64748b; margin-bottom: 2rem; font-size: 0.875rem; }
    </style>
</head>
<body>

<div class="container">
    <h1>FreshClean Setup</h1>
    
    <div class="step-indicator">
        <div class="step-dot <?php echo $step == 1 ? 'active' : ''; ?>"></div>
        <div class="step-dot <?php echo $step == 2 ? 'active' : ''; ?>"></div>
        <div class="step-dot <?php echo $step == 3 ? 'active' : ''; ?>"></div>
        <div class="step-dot <?php echo $step == 4 ? 'active' : ''; ?>"></div>
    </div>

    <?php if ($error): ?>
        <div class="alert-error"><?php echo $error; ?></div>
    <?php endif; ?>

    <?php if ($step === 1): ?>
        <p class="desc">Selamat datang di instalasi FreshClean POS! Setup ini akan membantu Anda mengonfigurasi database MySQL dan akun Admin untuk server Linux (STB B860H).</p>
        
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem;">
            <strong>Pengecekan Sistem:</strong><br>
            ✅ Versi PHP: <?php echo phpversion(); ?><br>
            ✅ PDO MySQL: <?php echo extension_loaded('pdo_mysql') ? 'Tersedia' : '❌ Tidak tersedia'; ?><br>
            ✅ Akses Tulis Tmp: <?php echo is_writable(dirname(__FILE__)) ? 'Tersedia' : '❌ Tidak bisa menulis file'; ?>
        </div>

        <?php if(version_compare(phpversion(), '7.4', '<') || !extension_loaded('pdo_mysql') || !is_writable(dirname(__FILE__))): ?>
            <div class="alert-error">Harap penuhi semua persyaratan sistem di atas sebelum melanjutkan.</div>
        <?php else: ?>
            <a href="?step=2" class="btn">Mulai Instalasi &rarr;</a>
        <?php endif; ?>

    <?php elseif ($step === 2): ?>
        <p class="desc">Masukkan informasi koneksi database MySQL/MariaDB. Database akan otomatis dibuat jika belum ada.</p>
        <form method="POST">
            <div class="form-group">
                <label>Database Host</label>
                <input type="text" name="db_host" value="localhost" required>
            </div>
            <div class="form-group">
                <label>Database User</label>
                <input type="text" name="db_user" value="root" required>
            </div>
            <div class="form-group">
                <label>Database Password</label>
                <input type="password" name="db_pass">
            </div>
            <div class="form-group">
                <label>Nama Database</label>
                <input type="text" name="db_name" value="freshclean_db" required>
            </div>
            <button type="submit" class="btn">Koneksikan Database &rarr;</button>
        </form>

    <?php elseif ($step === 3): ?>
        <p class="desc">Database berhasil terhubung! 🎉<br>Sekarang, konfigurasikan profil toko dan akun Admin.</p>
        <form method="POST">
            <h3 style="margin-top: 0; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">Profil Toko</h3>
            <div class="form-group">
                <label>Nama Laundry *</label>
                <input type="text" name="store_name" value="FreshClean Laundry" required>
            </div>
            <div class="form-group">
                <label>Alamat Toko</label>
                <input type="text" name="store_address" placeholder="Jl. Raya No. 123...">
            </div>
            <div class="form-group">
                <label>No. Telepon / WhatsApp</label>
                <input type="text" name="store_phone" placeholder="0812...">
            </div>

            <h3 style="margin-top: 1.5rem; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">Akun Administrator Utama</h3>
            <div class="form-group">
                <label>Username *</label>
                <input type="text" name="admin_user" value="admin" required>
            </div>
            <div class="form-group">
                <label>Password *</label>
                <input type="password" name="admin_pass" required>
            </div>
            
            <button type="submit" class="btn">Simpan & Selesaikan Instalasi</button>
        </form>

    <?php elseif ($step === 4): ?>
        <div class="alert-success">
            <h2>Instalasi Selesai! 🚀</h2>
            <p>Aplikasi FreshClean POS telah berhasil diinstal dan siap digunakan.</p>
        </div>
        <p class="desc" style="color:#ef4444; font-weight:bold;">SANGAT PENTING: Segera hapus file <code>install.php</code> demi keamanan server Anda!</p>
        <a href="../index.html" class="btn">Buka Aplikasi POS</a>
    <?php endif; ?>

</div>

</body>
</html>
