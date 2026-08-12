<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$dbFile = __DIR__ . '/../data/parcerias.json';

function loadParcerias() {
    global $dbFile;
    if (!file_exists($dbFile)) return [];
    return json_decode(file_get_contents($dbFile), true) ?: [];
}

function saveParcerias($data) {
    global $dbFile;
    $dir = dirname($dbFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function isAdmin() {
    return isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — público: lista parceiros
if ($method === 'GET') {
    echo json_encode(loadParcerias());
    exit;
}

// POST — admin: adiciona parceiro
if ($method === 'POST') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['nome'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nome obrigatório']);
        exit;
    }

    $parcerias = loadParcerias();
    $parceiro = [
        'id' => uniqid('parc_'),
        'nome' => $input['nome'],
        'logo' => $input['logo'] ?? '',
        'instagram' => $input['instagram'] ?? '',
        'contato' => $input['contato'] ?? '',
        'desconto' => intval($input['desconto'] ?? 10),
        'cupom' => strtoupper($input['cupom'] ?? ''),
        'ativo' => true,
        'criadoEm' => date('c')
    ];

    // Se mandou logo em base64, salva como arquivo
    if ($parceiro['logo'] && strpos($parceiro['logo'], 'data:image') === 0) {
        $uploadsDir = __DIR__ . '/../uploads/parcerias';
        if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
        $ext = strpos($parceiro['logo'], 'png') !== false ? '.png' : '.jpg';
        $filename = $parceiro['id'] . $ext;
        $base64 = explode(',', $parceiro['logo'])[1];
        file_put_contents($uploadsDir . '/' . $filename, base64_decode($base64));
        $parceiro['logo'] = '/uploads/parcerias/' . $filename;
    }

    $parcerias[] = $parceiro;
    saveParcerias($parcerias);
    echo json_encode(['success' => true, 'parceiro' => $parceiro]);
    exit;
}

// PUT — admin: atualiza parceiro
if ($method === 'PUT') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID obrigatório']);
        exit;
    }

    $parcerias = loadParcerias();
    $found = false;
    foreach ($parcerias as &$p) {
        if ($p['id'] === $input['id']) {
            if (isset($input['nome'])) $p['nome'] = $input['nome'];
            if (isset($input['instagram'])) $p['instagram'] = $input['instagram'];
            if (isset($input['contato'])) $p['contato'] = $input['contato'];
            if (isset($input['desconto'])) $p['desconto'] = intval($input['desconto']);
            if (isset($input['cupom'])) $p['cupom'] = strtoupper($input['cupom']);
            if (isset($input['ativo'])) $p['ativo'] = $input['ativo'];
            if (isset($input['logo'])) {
                if ($input['logo'] && strpos($input['logo'], 'data:image') === 0) {
                    $uploadsDir = __DIR__ . '/../uploads/parcerias';
                    if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
                    $ext = strpos($input['logo'], 'png') !== false ? '.png' : '.jpg';
                    $filename = $p['id'] . '-' . time() . $ext;
                    $base64 = explode(',', $input['logo'])[1];
                    file_put_contents($uploadsDir . '/' . $filename, base64_decode($base64));
                    $p['logo'] = '/uploads/parcerias/' . $filename;
                } else {
                    $p['logo'] = $input['logo'];
                }
            }
            $found = true;
            break;
        }
    }
    unset($p);

    if (!$found) { http_response_code(404); echo json_encode(['error' => 'Parceiro não encontrado']); exit; }
    saveParcerias($parcerias);
    echo json_encode(['success' => true]);
    exit;
}

// DELETE — admin: remove parceiro
if ($method === 'DELETE') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID obrigatório']);
        exit;
    }

    $parcerias = loadParcerias();
    $parcerias = array_values(array_filter($parcerias, function($p) use ($input) {
        return $p['id'] !== $input['id'];
    }));
    saveParcerias($parcerias);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
