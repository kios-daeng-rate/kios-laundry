1. install.php 
<?php
// backend/api/install.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Metode tidak valid']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$host = $input['dbHost'] ?? 'localhost';
$rootUser = $input['rootUser'] ?? 'root';
$rootPass = $input['rootPass'] ?? '';
$db   = $input['dbName'] ?? 'resto_db';
$dbUser = $input['dbUser'] ?? 'resto_user';
$dbPass = $input['dbPass'] ?? '';

$restoName = $input['restoName'] ?? 'RESTO QR';
$restoLogo = $input['restoLogo'] ?? '';
$restoAddr = $input['restoAddress'] ?? '';
$restoPhone= $input['restoPhone'] ?? '';

$adminPass = $input['adminPassword'] ?? '';

if (empty($db) || empty($restoName) || empty($adminPass)) {
    echo json_encode(['success' => false, 'error' => 'Data konfigurasi inti (DB, Nama Resto, Password Admin) wajib diisi.']);
    exit();
}

try {
    // 1. Koneksi menggunakan Root / Admin Server MySQL untuk membuat User dan Database
    $dsnSetup = "mysql:host={$host};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 5 
    ];
    $pdoSetup = new PDO($dsnSetup, $rootUser, $rootPass, $options);
    
    // 2. Buat database baru
    $pdoSetup->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // 3. Buat User Eksekutif untuk Aplikasi & Berikan Hak Akses ke Database tersebut
    try {
        $pdoSetup->exec("CREATE USER '{$dbUser}'@'%' IDENTIFIED BY '{$dbPass}'");
    } catch (PDOException $e) {
        // Jika user sudah ada, perbarui passwordnya saja
        $pdoSetup->exec("ALTER USER '{$dbUser}'@'%' IDENTIFIED BY '{$dbPass}'");
    }
    // Berikan izin penuh pada database khusus aplikasi ini
    $pdoSetup->exec("GRANT ALL PRIVILEGES ON `$db`.* TO '{$dbUser}'@'%'");
    $pdoSetup->exec("FLUSH PRIVILEGES");
    
    // 4. Generate file config.php baru secara penuh
    $configFile = __DIR__ . '/config.php';
    $escapedPass = str_replace("'", "\\'", $dbPass);
    
    $configContent = <<<PHP
<?php
// backend/api/config.php
// File ini dibuat otomatis oleh Installer.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if (\$_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

\$db_host = '{$host}';
\$db_name = '{$db}';
\$db_user = '{$dbUser}';
\$db_pass = '{$escapedPass}';

try {
    \$dsn = "mysql:host={\$db_host};dbname={\$db_name};charset=utf8mb4";
    \$options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    \$pdo = new PDO(\$dsn, \$db_user, \$db_pass, \$options);
} catch (PDOException \$e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Koneksi database gagal: ' . \$e->getMessage()]);
    exit();
}

function jsonResponse(\$data, \$statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code(\$statusCode);
    echo json_encode(\$data);
    exit();
}
?>
PHP;

    if (@file_put_contents($configFile, trim($configContent)) === false) {
        throw new Exception("Gagal membuat/menulis file konfigurasi config.php. Tolong set CHMOD 777 atau 666 terlebih dahulu pada folder backend/api/.");
    }

    // 5. Koneksikan PDO ulang, kali ini langsung menggunakan akun khusus Aplikasi yang barusan dibuat
    $dsnApp = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    $pdoApp = new PDO($dsnApp, $dbUser, $dbPass, $options);
    
    // 5. Injeksi Skema DDL Lengkap Resto QR
    $schema = <<<SQL
-- Table users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('Kasir','Dapur','Admin') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `is_available` boolean DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table tables
CREATE TABLE IF NOT EXISTS `tables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(20) DEFAULT NULL,
  `cashier_id` int(11) DEFAULT NULL,
  `cashier_name` varchar(100) DEFAULT 'Unknown',
  `table_id` int(11) DEFAULT NULL,
  `table_number` varchar(50) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `order_type` varchar(50) DEFAULT 'dine-in',
  `status` varchar(50) DEFAULT 'pending',
  `payment_status` enum('unpaid','paid') DEFAULT 'unpaid',
  `payment_method` varchar(50) DEFAULT 'cash',
  `subtotal` decimal(10,2) DEFAULT 0,
  `tax` decimal(10,2) DEFAULT 0,
  `total` decimal(10,2) DEFAULT 0,
  `total_amount` decimal(10,2) DEFAULT 0,
  `amount_paid` decimal(10,2) DEFAULT 0,
  `change_amount` decimal(10,2) DEFAULT 0,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `note` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table settings
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table banners
CREATE TABLE IF NOT EXISTS `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image` longtext NOT NULL,
  `badge` varchar(50) DEFAULT 'PROMO TERBATAS',
  `color` varchar(50) DEFAULT 'bg-primary-600',
  `is_active` boolean DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

    // Eksekusi skema pembuatan tabel
    $pdoApp->exec($schema);

    // --- LOGIKA MIGRASI / PERBAIKAN TABEL (Untuk Update dari Versi Lama) ---
    // Pastikan kolom-kolom baru tersedia jika tabel sudah ada sebelumnya
    $alterations = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS stock int(11) DEFAULT 0 AFTER price",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS description text DEFAULT NULL AFTER stock",
        "ALTER TABLE products MODIFY COLUMN image longtext DEFAULT NULL",
        "ALTER TABLE banners MODIFY COLUMN image longtext NOT NULL",
        "ALTER TABLE banners ADD COLUMN IF NOT EXISTS description text DEFAULT NULL AFTER title",
        "ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge varchar(50) DEFAULT 'PROMO TERBATAS' AFTER description",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_number varchar(20) DEFAULT NULL AFTER id",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashier_name varchar(100) DEFAULT 'Unknown' AFTER cashier_id",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type varchar(50) DEFAULT 'dine-in' AFTER customer_name",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number varchar(50) DEFAULT NULL AFTER table_id",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount decimal(10,2) DEFAULT 0 AFTER total",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid decimal(10,2) DEFAULT 0 AFTER total_amount",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_amount decimal(10,2) DEFAULT 0 AFTER amount_paid",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS note text DEFAULT NULL AFTER change_amount",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS note text DEFAULT NULL AFTER subtotal"
    ];

    foreach ($alterations as $sql) {
        try {
            $pdoApp->exec($sql);
        } catch (Exception $e) {
            // Abaikan jika error (misalnya MariaDB versi lama tidak support IF NOT EXISTS pada ALTER)
            // Kita lakukan fallback manual jika perlu, tapi biasanya cukup diamkan
        }
    }
    
    // Bersihkan isi Database yang baru ditarik dengan Truncate demi kebersihan (Cegah Duplicate di Fresh Install)
    $pdoApp->exec("SET FOREIGN_KEY_CHECKS=0;");
    $pdoApp->exec("TRUNCATE TABLE users;");
    $pdoApp->exec("TRUNCATE TABLE settings;");
    $pdoApp->exec("TRUNCATE TABLE tables;");
    $pdoApp->exec("TRUNCATE TABLE banners;");
    $pdoApp->exec("TRUNCATE TABLE categories;");
    $pdoApp->exec("TRUNCATE TABLE products;");
    $pdoApp->exec("TRUNCATE TABLE orders;");
    $pdoApp->exec("TRUNCATE TABLE order_items;");
    $pdoApp->exec("SET FOREIGN_KEY_CHECKS=1;");

    // 6. Suntikkan Akun Admin Pertama
    $stmtUser = $pdoApp->prepare("INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, 'Admin', 'active')");
    $stmtUser->execute(['admin', $adminPass, 'Super Administrator']);
    
    // 7. Suntikkan Kasir dan Dapur Default
    $stmtUser = $pdoApp->prepare("INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, 'active')");
    $stmtUser->execute(['kasir1', 'kasir123', 'Kasir 1', 'Kasir']);
    $stmtUser->execute(['dapur1', 'dapur123', 'Dapur Utama', 'Dapur']);

    // 8. Suntikkan Profil Settings
    $stmtSet = $pdoApp->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
    $stmtSet->execute(['resto_name', $restoName]);
    $stmtSet->execute(['logo_url', $restoLogo]);
    $stmtSet->execute(['address', $restoAddr]);
    $stmtSet->execute(['phone', $restoPhone]);

    // 9. Data Dummy Starter Meja
    for ($i = 1; $i <= 5; $i++) {
        $pdoApp->exec("INSERT INTO tables (name) VALUES ('Meja $i')");
    }
    
    // 10. Starter Categories
    $pdoApp->exec("INSERT INTO categories (name, icon) VALUES ('Makanan', 'Utensils'), ('Minuman', 'Coffee')");

    // 11. Buat file .htaccess otomatis di root directory (untuk keperluan React Router di Apache)
    // Direktori root aplikasi (contoh: /var/www/html/resto_app) adalah 2 tingkat di atas file install.php ini
    $htaccessPath = dirname(dirname(__DIR__)) . '/.htaccess';
    $htaccessContent = <<<HTACCESS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
HTACCESS;
    
    // Kita coba tulis secara diam-diam (jika server support dan folder writable)
    @file_put_contents($htaccessPath, trim($htaccessContent));

    echo json_encode(['success' => true, 'message' => 'Instalasi Web Aplikasi Resto QR Berhasil! Anda sekarang dapat masuk.']);
} catch (Exception $e) {
    // Apapun kegagalannya, kita output error-nya 
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>




2. check_install.php
<?php
// backend/api/check_install.php

// Izinkan akses dari domain manapun (CORS) 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

// Nilai default jika config.php belum ada
$db_host = 'localhost';
$db_name = 'resto_db';      
$db_user = 'root';          
$db_pass = '';              

// Muat config.php hanya jika filenya benar-benar ada
if (file_exists('config.php')) {
    include 'config.php';
}

// Variabel di atas akan ditimpa oleh config.php jika include berhasil

try {
    $dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    // Tes koneksi ringan dengan timeout singkat agar tak ngehang lama jika server salah
    $options[PDO::ATTR_TIMEOUT] = 3; 

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    
    // Cek keberadaan tabel 'users' sebagai penanda utama instalasi
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'users'");
    $stmt->execute();
    
    if ($stmt->fetch()) {
        // Cek jika minimal ada 1 akun admin
        $stmtAdmin = $pdo->prepare("SELECT id FROM users LIMIT 1");
        $stmtAdmin->execute();
        if ($stmtAdmin->fetch()) {
            echo json_encode(['installed' => true, 'message' => 'Sistem sudah dikonfigurasi']);
            exit();
        }
    }
    
    echo json_encode(['installed' => false, 'message' => 'Database ada, tetapi tabel inti belum terinstal.']);
    exit();

} catch (PDOException $e) {
    // Apapun tipe errornya (DB tak ada, Akses Ditolak), anggap belum terinstal
    http_response_code(200); // Harus 200 agar JS API tenang memproses JSON respons-nya
    echo json_encode(['installed' => false, 'message' => 'Koneksi database belum di-setup.', 'detail' => $e->getMessage()]);
    exit();
}
?>
