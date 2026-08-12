<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$dbFile = __DIR__ . '/../data/pedidos.json';

function loadPedidos() {
    global $dbFile;
    if (!file_exists($dbFile)) return [];
    return json_decode(file_get_contents($dbFile), true) ?: [];
}

function savePedidos($data) {
    global $dbFile;
    $dir = dirname($dbFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function isAdmin() {
    return isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
}

function gerarNumeroPedido() {
    return 'VLT-' . strtoupper(substr(md5(uniqid()), 0, 6));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ══════════════════════════════════════════════════
// GET — admin: lista pedidos (com filtro por status)
// ══════════════════════════════════════════════════
if ($method === 'GET' && $action === '') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $pedidos = loadPedidos();
    $status = $_GET['status'] ?? '';
    if ($status && $status !== 'todos') {
        $pedidos = array_values(array_filter($pedidos, function($p) use ($status) {
            return $p['status'] === $status;
        }));
    }
    // Mais recentes primeiro
    usort($pedidos, function($a, $b) { return strtotime($b['criadoEm']) - strtotime($a['criadoEm']); });
    echo json_encode($pedidos);
    exit;
}

// GET — público: consulta pedido por número (pra cliente acompanhar)
if ($method === 'GET' && $action === 'consultar') {
    $numero = $_GET['numero'] ?? '';
    if (!$numero) { http_response_code(400); echo json_encode(['error' => 'Número obrigatório']); exit; }
    $pedidos = loadPedidos();
    $found = null;
    foreach ($pedidos as $p) {
        if ($p['numero'] === $numero) { $found = $p; break; }
    }
    if (!$found) { http_response_code(404); echo json_encode(['error' => 'Pedido não encontrado']); exit; }
    // Retorna só dados públicos
    echo json_encode([
        'numero' => $found['numero'],
        'status' => $found['status'],
        'produto' => $found['itens'] ?? [],
        'rastreio' => $found['rastreio'] ?? null,
        'historico' => $found['historico'] ?? []
    ]);
    exit;
}

// ══════════════════════════════════════════════════
// POST — público: cria novo pedido (checkout)
// ══════════════════════════════════════════════════
if ($method === 'POST' && $action === '') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { http_response_code(400); echo json_encode(['error' => 'Dados inválidos']); exit; }

    // Validação básica
    $required = ['nome', 'email', 'telefone'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Campo '$field' é obrigatório"]);
            exit;
        }
    }

    $tipoEntrega = $input['tipoEntrega'] ?? 'envio';
    if ($tipoEntrega === 'envio' && (empty($input['cep']) || empty($input['endereco']))) {
        http_response_code(400);
        echo json_encode(['error' => 'CEP e endereço são obrigatórios para envio']);
        exit;
    }
    if ($tipoEntrega === 'evento' && empty($input['placa'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Placa do carro é obrigatória para retirada no evento']);
        exit;
    }

    if (empty($input['itens']) || !is_array($input['itens'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Carrinho vazio']);
        exit;
    }

    $numero = gerarNumeroPedido();
    $pedido = [
        'id' => uniqid('ped_'),
        'numero' => $numero,
        'status' => 'novo',
        'cliente' => [
            'nome' => $input['nome'],
            'email' => $input['email'],
            'telefone' => $input['telefone']
        ],
        'entrega' => [
            'tipo' => $tipoEntrega,
            'cep' => $input['cep'] ?? '',
            'endereco' => $input['endereco'] ?? '',
            'complemento' => $input['complemento'] ?? '',
            'bairro' => $input['bairro'] ?? '',
            'cidade' => $input['cidade'] ?? '',
            'estado' => $input['estado'] ?? '',
            'placa' => $input['placa'] ?? '',
            'modeloCarro' => $input['modeloCarro'] ?? ''
        ],
        'itens' => $input['itens'],
        'subtotal' => floatval($input['subtotal'] ?? 0),
        'desconto' => floatval($input['desconto'] ?? 0),
        'total' => floatval($input['total'] ?? 0),
        'cupom' => $input['cupom'] ?? null,
        'observacao' => $input['observacao'] ?? '',
        'rastreio' => null,
        'historico' => [
            ['status' => 'novo', 'data' => date('c'), 'nota' => 'Pedido criado']
        ],
        'criadoEm' => date('c'),
        'atualizadoEm' => date('c')
    ];

    $pedidos = loadPedidos();
    $pedidos[] = $pedido;
    savePedidos($pedidos);

    echo json_encode(['success' => true, 'numero' => $numero, 'pedido' => $pedido]);
    exit;
}

// ══════════════════════════════════════════════════
// PUT — admin: atualiza pedido (status, rastreio, notas)
// ══════════════════════════════════════════════════
if ($method === 'PUT') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID obrigatório']);
        exit;
    }

    $pedidos = loadPedidos();
    $found = false;
    foreach ($pedidos as &$p) {
        if ($p['id'] === $input['id']) {
            // Atualiza status
            if (isset($input['status']) && $input['status'] !== $p['status']) {
                $p['status'] = $input['status'];
                $p['historico'][] = [
                    'status' => $input['status'],
                    'data' => date('c'),
                    'nota' => $input['nota'] ?? 'Status atualizado'
                ];
            }
            // Atualiza rastreio
            if (isset($input['rastreio'])) {
                $p['rastreio'] = $input['rastreio'];
                if ($input['rastreio'] && $p['status'] !== 'enviado') {
                    $p['status'] = 'enviado';
                    $p['historico'][] = [
                        'status' => 'enviado',
                        'data' => date('c'),
                        'nota' => 'Rastreio: ' . $input['rastreio']
                    ];
                }
            }
            // Nota manual
            if (isset($input['nota']) && !isset($input['status'])) {
                $p['historico'][] = [
                    'status' => $p['status'],
                    'data' => date('c'),
                    'nota' => $input['nota']
                ];
            }
            $p['atualizadoEm'] = date('c');
            $found = true;
            break;
        }
    }
    unset($p);

    if (!$found) { http_response_code(404); echo json_encode(['error' => 'Pedido não encontrado']); exit; }
    savePedidos($pedidos);
    echo json_encode(['success' => true]);
    exit;
}

// ══════════════════════════════════════════════════
// DELETE — admin: remove pedido
// ══════════════════════════════════════════════════
if ($method === 'DELETE') {
    if (!isAdmin()) { http_response_code(401); echo json_encode(['error' => 'Não autorizado']); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID obrigatório']);
        exit;
    }
    $pedidos = loadPedidos();
    $pedidos = array_values(array_filter($pedidos, function($p) use ($input) {
        return $p['id'] !== $input['id'];
    }));
    savePedidos($pedidos);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
