<?php
/**
 * API — Pedidos de Mockup Personalizado
 * 
 * POST /api/mockup-orders.php — Criar pedido
 * GET /api/mockup-orders.php — Listar pedidos (admin)
 * PUT /api/mockup-orders.php — Atualizar status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$ordersFile = __DIR__ . '/../data/mockup-orders.json';

// Ensure data directory and file exist
if (!file_exists(dirname($ordersFile))) {
    mkdir(dirname($ordersFile), 0755, true);
}
if (!file_exists($ordersFile)) {
    file_put_contents($ordersFile, json_encode([]));
}

function getOrders() {
    global $ordersFile;
    $data = file_get_contents($ordersFile);
    return json_decode($data, true) ?: [];
}

function saveOrders($orders) {
    global $ordersFile;
    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ============ ROUTES ============

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // List all orders
        $orders = getOrders();
        
        // Filter by status if provided
        if (isset($_GET['status']) && $_GET['status'] !== 'all') {
            $status = $_GET['status'];
            $orders = array_filter($orders, function($o) use ($status) {
                return $o['status'] === $status;
            });
            $orders = array_values($orders);
        }
        
        // Sort by date (newest first)
        usort($orders, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
        
        echo json_encode([
            'success' => true,
            'orders' => $orders,
            'total' => count($orders)
        ]);
        break;

    case 'POST':
        // Create new order
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
            exit;
        }

        // Save screenshot separately if present
        $screenshotPath = null;
        if (isset($input['screenshot']) && strpos($input['screenshot'], 'data:image') === 0) {
            $screenshotDir = __DIR__ . '/../uploads/mockups';
            if (!file_exists($screenshotDir)) {
                mkdir($screenshotDir, 0755, true);
            }
            
            $screenshotData = explode(',', $input['screenshot'])[1];
            $screenshotPath = 'uploads/mockups/' . $input['id'] . '.png';
            file_put_contents(__DIR__ . '/../' . $screenshotPath, base64_decode($screenshotData));
            $input['screenshotFile'] = $screenshotPath;
            
            // Don't store base64 in JSON (too large)
            unset($input['screenshot']);
        }

        $orders = getOrders();
        $orders[] = $input;
        saveOrders($orders);

        echo json_encode([
            'success' => true,
            'order' => $input,
            'message' => 'Pedido salvo com sucesso'
        ]);
        break;

    case 'PUT':
        // Update order status
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID e status são obrigatórios']);
            exit;
        }

        $validStatuses = ['novo', 'producao', 'enviado', 'cancelado'];
        if (!in_array($input['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Status inválido']);
            exit;
        }

        $orders = getOrders();
        $found = false;
        
        foreach ($orders as &$order) {
            if ($order['id'] === $input['id']) {
                $order['status'] = $input['status'];
                $order['updatedAt'] = date('c');
                $found = true;
                break;
            }
        }
        unset($order);

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Pedido não encontrado']);
            exit;
        }

        saveOrders($orders);
        echo json_encode(['success' => true, 'message' => 'Status atualizado']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método não permitido']);
}
