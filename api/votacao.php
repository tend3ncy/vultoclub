<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$dbFile = __DIR__ . '/../data/votacao.json';
$configFile = __DIR__ . '/../data/votacao-config.json';

function loadVotes() {
    global $dbFile;
    if (!file_exists($dbFile)) return ['modelo1' => 0, 'modelo2' => 0, 'votos' => []];
    return json_decode(file_get_contents($dbFile), true) ?: ['modelo1' => 0, 'modelo2' => 0, 'votos' => []];
}

function saveVotes($data) {
    global $dbFile;
    $dir = dirname($dbFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT));
}

function loadConfig() {
    global $configFile;
    if (!file_exists($configFile)) return ['active' => true, 'name1' => 'MODELO 1', 'name2' => 'MODELO 2', 'image' => '/arquivos/escolha.png'];
    return json_decode(file_get_contents($configFile), true) ?: ['active' => true, 'name1' => 'MODELO 1', 'name2' => 'MODELO 2', 'image' => '/arquivos/escolha.png'];
}

function saveConfig($data) {
    global $configFile;
    $dir = dirname($configFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($configFile, json_encode($data, JSON_PRETTY_PRINT));
}

function isAdmin() {
    return isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/votacao.php — retorna votos
if ($method === 'GET' && $action === '') {
    $data = loadVotes();
    echo json_encode(['modelo1' => $data['modelo1'], 'modelo2' => $data['modelo2']]);
    exit;
}

// GET /api/votacao.php?action=config — retorna config
if ($method === 'GET' && $action === 'config') {
    echo json_encode(loadConfig());
    exit;
}

// POST /api/votacao.php — registra voto
if ($method === 'POST' && $action === '') {
    $input = json_decode(file_get_contents('php://input'), true);
    $modelo = intval($input['modelo'] ?? 0);
    if ($modelo !== 1 && $modelo !== 2) {
        http_response_code(400);
        echo json_encode(['error' => 'Modelo inválido']);
        exit;
    }

    $ip = $_SERVER['REMOTE_ADDR'];
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $visitorId = md5($ip . $ua);
    $data = loadVotes();
    if (!isset($data['votos'])) $data['votos'] = [];

    if (isset($data['votos'][$visitorId])) {
        http_response_code(409);
        echo json_encode(['error' => 'Você já votou!', 'votou' => $data['votos'][$visitorId]]);
        exit;
    }

    $data['modelo' . $modelo]++;
    $data['votos'][$visitorId] = $modelo;
    saveVotes($data);
    echo json_encode(['success' => true, 'modelo1' => $data['modelo1'], 'modelo2' => $data['modelo2']]);
    exit;
}

// POST /api/votacao.php?action=reset — reseta votos (admin)
if ($method === 'POST' && $action === 'reset') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    saveVotes(['modelo1' => 0, 'modelo2' => 0, 'votos' => []]);
    echo json_encode(['success' => true]);
    exit;
}

// PUT /api/votacao.php?action=config — atualiza config (admin)
if ($method === 'PUT' && $action === 'config') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $cfg = loadConfig();

    if (isset($input['active'])) $cfg['active'] = $input['active'];
    if (isset($input['name1'])) $cfg['name1'] = $input['name1'];
    if (isset($input['name2'])) $cfg['name2'] = $input['name2'];
    if (isset($input['image'])) {
        if ($input['image'] && strpos($input['image'], 'data:image') === 0) {
            $uploadsDir = __DIR__ . '/../uploads';
            if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
            $ext = strpos($input['image'], 'png') !== false ? '.png' : '.jpg';
            $filename = 'votacao-' . time() . $ext;
            $base64 = explode(',', $input['image'])[1];
            file_put_contents($uploadsDir . '/' . $filename, base64_decode($base64));
            $cfg['image'] = '/uploads/' . $filename;
        } else {
            $cfg['image'] = $input['image'];
        }
    }

    saveConfig($cfg);
    echo json_encode($cfg);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
