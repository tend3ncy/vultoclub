<?php
session_start();
header('Content-Type: application/json');

$dbFile = __DIR__ . '/../data/db.json';
$method = $_SERVER['REQUEST_METHOD'];

// Helpers
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
    echo json_encode($db['products']);
    exit;
}

// POST - criar produto (admin)
if ($method === 'POST') {
    if (!isAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $input['id'] = (string)(time() * 1000);
    $db = readDB();
    $db['products'][] = $input;
    writeDB($db);
    http_response_code(201);
    echo json_encode($input);
    exit;
}

// PUT - atualizar produto (admin)
if ($method === 'PUT') {
    if (!isAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    $id = basename($_SERVER['REQUEST_URI']);
    $input = json_decode(file_get_contents('php://input'), true);
    $db = readDB();
    foreach ($db['products'] as $i => $p) {
        if ($p['id'] === $id) {
            $db['products'][$i] = array_merge($p, $input);
            writeDB($db);
            echo json_encode($db['products'][$i]);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['error' => 'Não encontrado']);
    exit;
}

// DELETE - remover produto (admin)
if ($method === 'DELETE') {
    if (!isAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    $id = basename($_SERVER['REQUEST_URI']);
    $db = readDB();
    $db['products'] = array_values(array_filter($db['products'], fn($p) => $p['id'] !== $id));
    writeDB($db);
    echo json_encode(['ok' => true]);
    exit;
}
