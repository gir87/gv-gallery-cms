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
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// -------------------------------------------------------------------------
// DATABASE CONNECTION
// -------------------------------------------------------------------------

// Database Connection
$host = 'localhost';
$db   = 'YOUR_DB_NAME';      // <-- CHANGE THIS
$user = 'YOUR_DB_USER';      // <-- CHANGE THIS
$pass = 'YOUR_DB_PASSWORD';  // <-- CHANGE THIS
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
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// -------------------------------------------------------------------------
// REQUEST HANDLING
// -------------------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Handle Preflight OPTIONS request for CORS
if ($method === 'OPTIONS') {
    exit(0);
}

// -------------------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------------------

function saveBase64Image($base64String, $prefix = '') {
    // Check if valid base64 image string
    if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
        $data = substr($base64String, strpos($base64String, ',') + 1);
        $extension = strtolower($type[1]);
        
        // Generate unique filename
        $filename = $prefix . uniqid() . '.' . $extension;
        $filepath = __DIR__ . '/uploads/' . $filename;
        
        // Save file
        if (file_put_contents($filepath, base64_decode($data))) {
            return 'uploads/' . $filename;
        }
    }
    return false;
}

// -------------------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------------------

if (isset($_GET['action']) && $_GET['action'] === 'login') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Return success token (simple implementation)
        echo json_encode(['success' => true, 'token' => bin2hex(random_bytes(16))]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
    exit;
}

// -------------------------------------------------------------------------
// GET ACTIONS (Fetch Data)
// -------------------------------------------------------------------------

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    // 1. Get App Settings (About Page)
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

    // 2. Default: Get All Photos and Series
    try {
        // Fetch Series
        $stmt = $pdo->query("SELECT * FROM series ORDER BY created_at DESC");
        $series = $stmt->fetchAll();
        
        // Fetch Photos (Sorted by Custom Order, then Date)
        // 'order_index' logic: 0 is first.
        $stmt = $pdo->query("SELECT * FROM photos ORDER BY order_index ASC, created_at DESC");
        $photos = $stmt->fetchAll();

        // Format Photos for Frontend (CamelCase)
        $formattedPhotos = array_map(function($p) {
            $p['url'] = 'uploads/' . $p['filename'];
            $p['tags'] = json_decode($p['tags']) ?: [];
            $p['seriesId'] = $p['series_id']; 
            $p['createdAt'] = (int)$p['created_at'];
            $p['width'] = (int)$p['width'];
            $p['height'] = (int)$p['height'];
            $p['isHomepage'] = (bool)$p['is_homepage'];
            $p['orderIndex'] = (int)$p['order_index'];
            
            // Clean up raw DB columns
            unset($p['series_id'], $p['created_at'], $p['is_homepage'], $p['order_index']);
            return $p;
        }, $photos);
        
        // Format Series for Frontend (CamelCase)
        $formattedSeries = array_map(function($s) {
             $s['coverPhotoId'] = $s['cover_photo_id'];
             $s['createdAt'] = (int)$s['created_at'];
             unset($s['cover_photo_id'], $s['created_at']);
             return $s;
        }, $series);

        echo json_encode(['photos' => $formattedPhotos, 'series' => $formattedSeries]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// -------------------------------------------------------------------------
// POST ACTIONS (Create / Update)
// -------------------------------------------------------------------------

if ($method === 'POST') {
    $action = $_GET['action'] ?? '';

    // 1. Upload New Photo
    if ($action === 'upload_photo') {
        $data = $input;
        
        if (preg_match('/^data:image\/(\w+);base64,/', $data['url'], $type)) {
            $imgData = substr($data['url'], strpos($data['url'], ',') + 1);
            $ext = strtolower($type[1]);
            
            $filename = $data['id'] . '.' . $ext;
            $filepath = __DIR__ . '/uploads/' . $filename;
            
            if (file_put_contents($filepath, base64_decode($imgData))) {
                $stmt = $pdo->prepare("INSERT INTO photos (id, filename, title, description, series_id, tags, created_at, width, height, is_homepage, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['id'], 
                    $filename, 
                    $data['title'], 
                    $data['description'], 
                    $data['seriesId'], 
                    json_encode($data['tags']), 
                    $data['createdAt'],
                    $data['width'],
                    $data['height'],
                    isset($data['isHomepage']) && $data['isHomepage'] ? 1 : 0,
                    9999 // Default order index (end of list)
                ]);
                echo json_encode(['success' => true]);
            } else {
                 http_response_code(500);
                 echo json_encode(['error' => 'Failed to write file']);
            }
        }
    } 
    // 2. Update Existing Photo
    elseif ($action === 'update_photo') {
        $data = $input;
        $stmt = $pdo->prepare("UPDATE photos SET title=?, description=?, series_id=?, tags=?, is_homepage=? WHERE id=?");
        $stmt->execute([
            $data['title'], 
            $data['description'], 
            $data['seriesId'], 
            json_encode($data['tags']), 
            isset($data['isHomepage']) && $data['isHomepage'] ? 1 : 0,
            $data['id']
        ]);
        echo json_encode(['success' => true]);
    }
    // 3. Reorder Photos (Drag and Drop)
    elseif ($action === 'reorder_photos') {
        $orderList = $input['orderList'] ?? [];
        if (!empty($orderList)) {
            // Update each photo's order_index based on array position
            $sql = "UPDATE photos SET order_index = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            foreach ($orderList as $index => $id) {
                $stmt->execute([$index, $id]);
            }
        }
        echo json_encode(['success' => true]);
    }
    // 4. Save/Create Series
    elseif ($action === 'save_series') {
        $s = $input;
        $stmt = $pdo->prepare("INSERT INTO series (id, title, description, cover_photo_id, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, description=?");
        $stmt->execute([$s['id'], $s['title'], $s['description'], $s['coverPhotoId'], $s['createdAt'], $s['title'], $s['description']]);
        echo json_encode(['success' => true]);
    }
    // 5. Change Admin Password
    elseif ($action === 'change_password') {
        $newPass = $input['newPassword'] ?? '';
        if (strlen($newPass) < 6) {
            echo json_encode(['success' => false, 'error' => 'Password too short']);
            exit;
        }
        $hash = password_hash($newPass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'");
        $stmt->execute([$hash]);
        echo json_encode(['success' => true]);
    }
    // 6. Save App Settings (About Page)
    elseif ($action === 'save_settings') {
        $settings = $input;
        $stmt = $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?");
        foreach ($settings as $key => $value) {
            $stmt->execute([$key, $value, $value]);
        }
        echo json_encode(['success' => true]);
    }
    // 7. Upload Generic Asset (e.g. Author Photo)
    elseif ($action === 'upload_asset') {
        $base64 = $input['image'] ?? '';
        $namePrefix = $input['name'] ?? 'asset';
        
        $path = saveBase64Image($base64, $namePrefix . '_');
        
        if ($path) {
            echo json_encode(['success' => true, 'url' => $path]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Upload failed']);
        }
    }
}

// -------------------------------------------------------------------------
// DELETE ACTIONS
// -------------------------------------------------------------------------

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $type = $_GET['type'] ?? '';

    if ($type === 'photo') {
        $stmt = $pdo->prepare("SELECT filename FROM photos WHERE id = ?");
        $stmt->execute([$id]);
        $photo = $stmt->fetch();
        
        if ($photo) {
            $file = __DIR__ . '/uploads/' . $photo['filename'];
            if (file_exists($file)) unlink($file);
            
            $pdo->prepare("DELETE FROM photos WHERE id = ?")->execute([$id]);
        }
    } elseif ($type === 'series') {
        $pdo->prepare("DELETE FROM series WHERE id = ?")->execute([$id]);
        // Decouple photos from this series
        $pdo->prepare("UPDATE photos SET series_id = NULL WHERE series_id = ?")->execute([$id]);
    }
    echo json_encode(['success' => true]);
}
?>
