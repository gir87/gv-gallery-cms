<?php
// Prevent PHP warnings/errors from breaking the JSON output
error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);

// headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

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

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Handle Preflight Requests
if ($method === 'OPTIONS') {
    exit(0);
}

// --- AUTHENTICATION ---
if (isset($_GET['action']) && $_GET['action'] === 'login') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Simple token generation (for production consider JWT)
        echo json_encode(['success' => true, 'token' => bin2hex(random_bytes(16))]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
    exit;
}

// --- PUBLIC DATA (GET) ---
if ($method === 'GET') {
    try {
        // Get Series
        $stmt = $pdo->query("SELECT * FROM series ORDER BY created_at DESC");
        $series = $stmt->fetchAll();
        
        // Get Photos
        $stmt = $pdo->query("SELECT * FROM photos ORDER BY created_at DESC");
        $photos = $stmt->fetchAll();

        // Format for frontend
        $formattedPhotos = array_map(function($p) {
            $p['url'] = 'uploads/' . $p['filename']; // Path relative to domain root
            $p['tags'] = json_decode($p['tags']) ?: [];
            $p['seriesId'] = $p['series_id']; // Convert snake_case to camelCase
            $p['createdAt'] = (int)$p['created_at'];
            $p['width'] = (int)$p['width'];
            $p['height'] = (int)$p['height'];
            
            // Remove raw DB columns not needed by frontend
            unset($p['series_id']);
            unset($p['created_at']);
            return $p;
        }, $photos);
        
        // Format Series
        $formattedSeries = array_map(function($s) {
             $s['coverPhotoId'] = $s['cover_photo_id'];
             $s['createdAt'] = (int)$s['created_at'];
             unset($s['cover_photo_id']);
             unset($s['created_at']);
             return $s;
        }, $series);

        echo json_encode(['photos' => $formattedPhotos, 'series' => $formattedSeries]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- ADMIN ACTIONS ---
// Note: In a real production app, you should verify the Authorization header token here.

if ($method === 'POST') {
    $action = $_GET['action'] ?? '';

    if ($action === 'upload_photo') {
        $data = $input;
        
        // Handle Base64 Image
        if (preg_match('/^data:image\/(\w+);base64,/', $data['url'], $type)) {
            $data['url'] = substr($data['url'], strpos($data['url'], ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif, etc.
            
            // Create filename
            $filename = $data['id'] . '.' . $type;
            $filepath = __DIR__ . '/uploads/' . $filename;
            
            if (file_put_contents($filepath, base64_decode($data['url']))) {
                $stmt = $pdo->prepare("INSERT INTO photos (id, filename, title, description, series_id, tags, created_at, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['id'], 
                    $filename, 
                    $data['title'], 
                    $data['description'], 
                    $data['seriesId'], 
                    json_encode($data['tags']), 
                    $data['createdAt'],
                    $data['width'],
                    $data['height']
                ]);
                echo json_encode(['success' => true]);
            } else {
                 http_response_code(500);
                 echo json_encode(['error' => 'Failed to write file to disk']);
            }
        }
    } 
    elseif ($action === 'update_photo') {
        $data = $input;
        $stmt = $pdo->prepare("UPDATE photos SET title=?, description=?, series_id=?, tags=? WHERE id=?");
        $stmt->execute([
            $data['title'], 
            $data['description'], 
            $data['seriesId'], 
            json_encode($data['tags']), 
            $data['id']
        ]);
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
        // Updates the user named 'admin'
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'");
        $stmt->execute([$hash]);
        echo json_encode(['success' => true]);
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $type = $_GET['type'] ?? '';

    if ($type === 'photo') {
        // Get filename to delete actual file
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
        // Update photos to remove series association (set to NULL)
        $pdo->prepare("UPDATE photos SET series_id = NULL WHERE series_id = ?")->execute([$id]);
    }
    echo json_encode(['success' => true]);
}
?>
