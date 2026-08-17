<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$dbFile = __DIR__ . '/../data/vouchers.json';
$MAX_EXPOSICAO = 100;
$MAX_BATALHA = 16;

function loadVouchers() {
    global $dbFile;
    if (!file_exists($dbFile)) return [];
    return json_decode(file_get_contents($dbFile), true) ?: [];
}

function saveVouchers($data) {
    global $dbFile;
    $dir = dirname($dbFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function isAdmin() {
    return isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
}

function gerarCodigo($tipo) {
    $prefix = $tipo === 'batalha' ? 'BTL' : 'EXP';
    return $prefix . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 6));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET — público: retorna vagas disponíveis
if ($method === 'GET' && $action === 'vagas') {
    $vouchers = loadVouchers();
    $exposicao = count(array_filter($vouchers, fn($v) => $v['tipo'] === 'exposicao'));
    $batalha = count(array_filter($vouchers, fn($v) => $v['tipo'] === 'batalha'));
    echo json_encode([
        'exposicao' => ['total' => $GLOBALS['MAX_EXPOSICAO'], 'usadas' => $exposicao, 'disponiveis' => $GLOBALS['MAX_EXPOSICAO'] - $exposicao],
        'batalha' => ['total' => $GLOBALS['MAX_BATALHA'], 'usadas' => $batalha, 'disponiveis' => $GLOBALS['MAX_BATALHA'] - $batalha]
    ]);
    exit;
}

// GET — admin: lista todos os vouchers
if ($method === 'GET' && $action === '') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    echo json_encode(loadVouchers());
    exit;
}

// GET — público: consulta voucher por código
if ($method === 'GET' && $action === 'consultar') {
    $codigo = $_GET['codigo'] ?? '';
    if (!$codigo) { http_response_code(400); echo json_encode(['error' => 'Código obrigatório']); exit; }
    $vouchers = loadVouchers();
    $found = null;
    foreach ($vouchers as $v) { if ($v['codigo'] === strtoupper($codigo)) { $found = $v; break; } }
    if (!$found) { http_response_code(404); echo json_encode(['error' => 'Voucher não encontrado']); exit; }
    echo json_encode($found);
    exit;
}

// POST — público: inscrição (gera voucher)
if ($method === 'POST' && $action === '') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['nome']) || empty($input['tipo'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nome e tipo obrigatórios']);
        exit;
    }

    $tipo = $input['tipo']; // 'exposicao' ou 'batalha'
    if (!in_array($tipo, ['exposicao', 'batalha'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo inválido']);
        exit;
    }

    $vouchers = loadVouchers();

    // Verifica vagas
    $count = count(array_filter($vouchers, fn($v) => $v['tipo'] === $tipo));
    $max = $tipo === 'batalha' ? $MAX_BATALHA : $MAX_EXPOSICAO;
    if ($count >= $max) {
        http_response_code(409);
        echo json_encode(['error' => 'Vagas esgotadas para ' . ($tipo === 'batalha' ? 'Batalha de Ronco' : 'Exposição')]);
        exit;
    }

    // Verifica placa duplicada
    $placa = strtoupper($input['placa'] ?? '');
    if ($placa) {
        foreach ($vouchers as $v) {
            if ($v['placa'] === $placa) {
                http_response_code(409);
                echo json_encode(['error' => 'Essa placa já está cadastrada!']);
                exit;
            }
        }
    }

    $voucher = [
        'id' => uniqid('vch_'),
        'codigo' => gerarCodigo($tipo),
        'tipo' => $tipo,
        'nome' => $input['nome'],
        'carro' => $input['carro'] ?? '',
        'placa' => strtoupper($input['placa'] ?? ''),
        'instagram' => $input['instagram'] ?? '',
        'telefone' => $input['telefone'] ?? '',
        'checkin' => false,
        'criadoEm' => date('c')
    ];

    $vouchers[] = $voucher;
    saveVouchers($vouchers);
    echo json_encode(['success' => true, 'voucher' => $voucher]);
    exit;
}

// PUT — admin: check-in (valida voucher)
if ($method === 'PUT' && $action === 'checkin') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $codigo = strtoupper($input['codigo'] ?? '');
    if (!$codigo) { http_response_code(400); echo json_encode(['error' => 'Código obrigatório']); exit; }

    $vouchers = loadVouchers();
    $found = false;
    foreach ($vouchers as &$v) {
        if ($v['codigo'] === $codigo) {
            if ($v['checkin']) {
                echo json_encode(['error' => 'Já utilizado', 'voucher' => $v]);
                exit;
            }
            $v['checkin'] = true;
            $v['checkinEm'] = date('c');
            $found = true;
            saveVouchers($vouchers);
            echo json_encode(['success' => true, 'voucher' => $v]);
            exit;
        }
    }
    unset($v);

    http_response_code(404);
    echo json_encode(['error' => 'Voucher não encontrado']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
