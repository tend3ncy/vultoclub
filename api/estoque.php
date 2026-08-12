<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$dbFile = __DIR__ . '/../data/estoque.json';

function loadEstoque() {
    global $dbFile;
    if (!file_exists($dbFile)) return [];
    return json_decode(file_get_contents($dbFile), true) ?: [];
}

function saveEstoque($data) {
    global $dbFile;
    $dir = dirname($dbFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT));
}

function isAdmin() {
    return isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/estoque.php — retorna estoque (público)
if ($method === 'GET') {
    echo json_encode(loadEstoque());
    exit;
}

// PUT /api/estoque.php — atualiza item (admin)
if ($method === 'PUT') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID obrigatório']);
        exit;
    }

    $estoque = loadEstoque();
    $estoque[$input['id']] = [
        'quantidade' => intval($input['quantidade'] ?? 0),
        'tipo' => $input['tipo'] ?? 'normal',
        'label' => $input['label'] ?? '',
        'updatedAt' => date('c')
    ];
    saveEstoque($estoque);
    echo json_encode(['success' => true, 'estoque' => $estoque[$input['id']]]);
    exit;
}

// POST /api/estoque.php?action=compra — decrementa 1 (público)
if ($method === 'POST' && $action === 'compra') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID obrigatório']);
        exit;
    }

    $estoque = loadEstoque();
    if (!isset($estoque[$input['id']])) {
        http_response_code(404);
        echo json_encode(['error' => 'Produto não encontrado']);
        exit;
    }

    if ($estoque[$input['id']]['quantidade'] <= 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Sem estoque']);
        exit;
    }

    $estoque[$input['id']]['quantidade']--;
    $estoque[$input['id']]['updatedAt'] = date('c');
    saveEstoque($estoque);
    echo json_encode(['success' => true, 'restante' => $estoque[$input['id']]['quantidade']]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
