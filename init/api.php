<?php
// -------------------------------------------------------------------------
// CONFIGURATION & HEADERS
// -------------------------------------------------------------------------

// Prevent PHP warnings/errors from breaking the JSON output
error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);

// CORS & JSON Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// -------------------------------------------------------------------------
// DATABASE CONNECTION
// -------------------------------------------------------------------------

$host = 'localhost';
$db   = 'YOUR_DB_NAME';      // <--- UPDATE THIS
$user = 'YOUR_DB_USER';      // <--- UPDATE THIS
$pass = 'YOUR_DB_PASSWORD';  // <--- UPDATE THIS
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// -------------------------------------------------------------------------
// HELPERS & SECURITY
// -------------------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Handle Preflight OPTIONS
if ($method === 'OPTIONS') {
    exit(0);
}

// 1. Secure Image Saver (Allow-list validation)
function saveBase64Image($base64String, $prefix = '') {
    // Check regex
    if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
        $data = substr($base64String, strpos($base64String, ',') + 1);
        $ext = strtolower($type[1]);
        
        // SECURITY: ALLOW LIST
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($ext, $allowed)) {
            return false;
        }
        
        $filename = $prefix . uniqid() . '.' . $ext;
        $filepath = __DIR__ . '/uploads/' . $filename;
        
        if (file_put_contents($filepath, base64_decode($data))) {
            return 'uploads/' . $filename;
        }
    }
    return false;
}

// 2. Authentication Check (Bearer Token)
function authenticateUser($pdo) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $stmt = $pdo->prepare("SELECT id FROM users WHERE auth_token = ?");
        $stmt->execute([$token]);
        if ($stmt->fetch()) {
            return true;
        }
    }
    return false;
}

// -------------------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------------------

// --- LOGIN (Public) ---
if (isset($_GET['action']) && $_GET['action'] === 'login') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Generate Secure Token
        $token = bin2hex(random_bytes(32));
        
        // Save token to DB
        $update = $pdo->prepare("UPDATE users SET auth_token = ? WHERE id = ?");
        $update->execute([$token, $user['id']]);
        
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
    exit;
}

// --- GET DATA (Public) ---
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_settings') {
        $stmt = $pdo->query("SELECT * FROM app_settings");
        $rows = $stmt->fetchAll();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        echo json_encode($settings);
        exit;
    }

    // Default: Fetch Content
    try {
        $series = $pdo->query("SELECT * FROM series ORDER BY created_at DESC")->fetchAll();
        // Sort by Order Index ASC
        $photos = $pdo->query("SELECT * FROM photos ORDER BY order_index ASC, created_at DESC")->fetchAll();

        // Format
        $fmtPhotos = array_map(function($p) {
            return [
                'id' => $p['id'],
                'url' => 'uploads/' . $p['filename'],
                'title' => $p['title'],
                'description' => $p['description'],
                'tags' => json_decode($p['tags']) ?: [],
                'seriesId' => $p['series_id'],
                'createdAt' => (int)$p['created_at'],
                'width' => (int)$p['width'],
                'height' => (int)$p['height'],
                'isHomepage' => (bool)$p['is_homepage'],
                'orderIndex' => (int)$p['order_index']
            ];
        }, $photos);
        
        $fmtSeries = array_map(function($s) {
             return [
                'id' => $s['id'],
                'title' => $s['title'],
                'description' => $s['description'],
                'coverPhotoId' => $s['cover_photo_id'],
                'createdAt' => (int)$s['created_at']
             ];
        }, $series);

        echo json_encode(['photos' => $fmtPhotos, 'series' => $fmtSeries]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- POST & DELETE (Protected) ---
if ($method === 'POST' || $method === 'DELETE') {
    
    // Check Auth
    if (!authenticateUser($pdo)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    // POST Actions
    if ($method === 'POST') {
        $action = $_GET['action'] ?? '';

        if ($action === 'upload_photo') {
            $data = $input;
            $path = saveBase64Image($data['url'], $data['id'] . '_'); // Uses ID in filename
            
            if ($path) {
                $filename = basename($path);
                $stmt = $pdo->prepare("INSERT INTO photos (id, filename, title, description, series_id, tags, created_at, width, height, is_homepage, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['id'], $filename, $data['title'], $data['description'], $data['seriesId'], 
                    json_encode($data['tags']), $data['createdAt'], $data['width'], $data['height'],
                    isset($data['isHomepage']) && $data['isHomepage'] ? 1 : 0, 9999
                ]);
                echo json_encode(['success' => true]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid image data or type']);
            }
        } 
        elseif ($action === 'update_photo') {
            $data = $input;
            $stmt = $pdo->prepare("UPDATE photos SET title=?, description=?, series_id=?, tags=?, is_homepage=? WHERE id=?");
            $stmt->execute([
                $data['title'], $data['description'], $data['seriesId'], 
                json_encode($data['tags']), isset($data['isHomepage']) && $data['isHomepage'] ? 1 : 0, $data['id']
            ]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'reorder_photos') {
            $list = $input['orderList'] ?? [];
            $stmt = $pdo->prepare("UPDATE photos SET order_index = ? WHERE id = ?");
            foreach ($list as $idx => $id) {
                $stmt->execute([$idx, $id]);
            }
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'save_series') {
            $s = $input;
            $stmt = $pdo->prepare("INSERT INTO series (id, title, description, cover_photo_id, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, description=?");
            $stmt->execute([$s['id'], $s['title'], $s['description'], $s['coverPhotoId'], $s['createdAt'], $s['title'], $s['description']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'change_password') {
            $newPass = $input['newPassword'] ?? '';
            if (strlen($newPass) < 6) {
                echo json_encode(['success' => false, 'error' => 'Password too short']);
                exit;
            }
            $hash = password_hash($newPass, PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'")->execute([$hash]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'save_settings') {
            $settings = $input;
            $stmt = $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?");
            foreach ($settings as $k => $v) $stmt->execute([$k, $v, $v]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'upload_asset') {
            $path = saveBase64Image($input['image'], ($input['name'] ?? 'asset') . '_');
            if ($path) echo json_encode(['success' => true, 'url' => $path]);
            else { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Invalid image']); }
        }
    }

    // DELETE Actions
    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? '';
        $type = $_GET['type'] ?? '';

        if ($type === 'photo') {
            $stmt = $pdo->prepare("SELECT filename FROM photos WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if ($row) {
                $file = __DIR__ . '/uploads/' . $row['filename'];
                if (file_exists($file)) unlink($file);
                $pdo->prepare("DELETE FROM photos WHERE id = ?")->execute([$id]);
            }
        } elseif ($type === 'series') {
            $pdo->prepare("DELETE FROM series WHERE id = ?")->execute([$id]);
            $pdo->prepare("UPDATE photos SET series_id = NULL WHERE series_id = ?")->execute([$id]);
        }
        echo json_encode(['success' => true]);
    }
    exit;
}
?>
