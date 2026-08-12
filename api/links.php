<?php
session_start();
header('Content-Type: application/json');

$dbFile = __DIR__ . '/../data/db.json';
$method = $_SERVER['REQUEST_METHOD'];

function readDB() {
    global $dbFile;
    if (!file_exists($dbFile)) {
        return ['products' => [], 'links' => ['bio' => '', 'links' => []], 'settings' => ['heroVideo' => '']];
    }
    return json_decode(file_get_contents($dbFile), true);
}

function writeDB($data) {
    global $dbFile;
    $dir = dirname($dbFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT));
}

function isAuth() {
    return isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
}

// GET - público
if ($method === 'GET') {
    $db = readDB();
    echo json_encode($db['links'] ?? ['bio' => '', 'links' => []]);
    exit;
}

// PUT - atualizar links (admin)
if ($method === 'PUT') {
    if (!isAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $db = readDB();
    $db['links'] = $input;
    writeDB($db);
    echo json_encode($db['links']);
    exit;
}
