<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Credenciais MP
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ══════════════════════════════════════════════════
// POST — Cria preferência de pagamento
// ══════════════════════════════════════════════════
if ($method === 'POST' && $action === 'criar') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['pedidoId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
        exit;
    }

    // Busca pedido
    $pedidosFile = __DIR__ . '/../data/pedidos.json';
    $pedidos = file_exists($pedidosFile) ? json_decode(file_get_contents($pedidosFile), true) : [];
    $pedido = null;
    foreach ($pedidos as $p) {
        if ($p['id'] === $input['pedidoId']) { $pedido = $p; break; }
    }
    if (!$pedido) { http_response_code(404); echo json_encode(['error' => 'Pedido não encontrado']); exit; }

    // Monta itens pro MP
    $items = [];
    foreach ($pedido['itens'] as $item) {
        $items[] = [
            'title' => $item['name'] . ($item['size'] ? ' (' . $item['size'] . ')' : ''),
            'quantity' => intval($item['qty']),
            'unit_price' => floatval($item['price']),
            'currency_id' => 'BRL'
        ];
    }

    // Aplica desconto como item negativo se houver
    if ($pedido['desconto'] > 0) {
        $items[] = [
            'title' => 'Desconto' . ($pedido['cupom'] ? ' (' . $pedido['cupom'] . ')' : ''),
            'quantity' => 1,
            'unit_price' => -floatval($pedido['desconto']),
            'currency_id' => 'BRL'
        ];
    }

    $siteUrl = 'https://' . $_SERVER['HTTP_HOST'];

    $preference = [
        'items' => $items,
        'payer' => [
            'name' => $pedido['cliente']['nome'],
            'email' => $pedido['cliente']['email'],
            'phone' => ['number' => $pedido['cliente']['telefone']]
        ],
        'external_reference' => $pedido['id'],
        'back_urls' => [
            'success' => $siteUrl . '/pages/sucesso.html?pedido=' . $pedido['numero'],
            'failure' => $siteUrl . '/pages/erro.html',
            'pending' => $siteUrl . '/pages/pendente.html?pedido=' . $pedido['numero']
        ],
        'auto_return' => 'approved',
        'notification_url' => $siteUrl . '/api/pagamento.php?action=webhook',
        'statement_descriptor' => 'VULTO CLUB',
        'payment_methods' => [
            'installments' => 6
        ]
    ];

    // Chama API do MP
    $ch = curl_init('https://api.mercadopago.com/checkout/preferences');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($preference),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $MP_ACCESS_TOKEN
        ],
        CURLOPT_RETURNTRANSFER => true
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $mpData = json_decode($response, true);

    if ($httpCode >= 200 && $httpCode < 300 && isset($mpData['id'])) {
        echo json_encode([
            'success' => true,
            'preferenceId' => $mpData['id'],
            'initPoint' => $mpData['init_point'],
            'sandboxInitPoint' => $mpData['sandbox_init_point'] ?? null
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar pagamento', 'mp_error' => $mpData]);
    }
    exit;
}

// ══════════════════════════════════════════════════
// POST — Webhook do Mercado Pago (notificação de pagamento)
// ══════════════════════════════════════════════════
if ($method === 'POST' && $action === 'webhook') {
    $input = json_decode(file_get_contents('php://input'), true);

    // MP manda tipo 'payment' quando pagamento é atualizado
    if (!$input || ($input['type'] ?? '') !== 'payment') {
        echo json_encode(['ok' => true]);
        exit;
    }

    $paymentId = $input['data']['id'] ?? null;
    if (!$paymentId) { echo json_encode(['ok' => true]); exit; }

    // Consulta o pagamento no MP
    $ch = curl_init('https://api.mercadopago.com/v1/payments/' . $paymentId);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $MP_ACCESS_TOKEN],
        CURLOPT_RETURNTRANSFER => true
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $payment = json_decode($response, true);

    if (!$payment || !isset($payment['status'])) {
        echo json_encode(['ok' => true]);
        exit;
    }

    $pedidoId = $payment['external_reference'] ?? null;
    $status = $payment['status']; // approved, pending, rejected

    if (!$pedidoId) { echo json_encode(['ok' => true]); exit; }

    // Atualiza pedido
    $pedidosFile = __DIR__ . '/../data/pedidos.json';
    $pedidos = file_exists($pedidosFile) ? json_decode(file_get_contents($pedidosFile), true) : [];

    foreach ($pedidos as &$p) {
        if ($p['id'] === $pedidoId) {
            if ($status === 'approved' && $p['status'] === 'novo') {
                $p['status'] = 'pago';
                $p['historico'][] = [
                    'status' => 'pago',
                    'data' => date('c'),
                    'nota' => 'Pagamento aprovado (MP #' . $paymentId . ')'
                ];
                $p['pagamento'] = [
                    'id' => $paymentId,
                    'status' => 'approved',
                    'metodo' => $payment['payment_method_id'] ?? '',
                    'valor' => $payment['transaction_amount'] ?? 0
                ];
                $p['atualizadoEm'] = date('c');

                // Envia email de confirmação
                enviarEmailConfirmacao($p);
            } elseif ($status === 'pending') {
                $p['historico'][] = [
                    'status' => $p['status'],
                    'data' => date('c'),
                    'nota' => 'Pagamento pendente (MP #' . $paymentId . ')'
                ];
            } elseif ($status === 'rejected') {
                $p['historico'][] = [
                    'status' => $p['status'],
                    'data' => date('c'),
                    'nota' => 'Pagamento recusado (MP #' . $paymentId . ')'
                ];
            }
            break;
        }
    }
    unset($p);

    file_put_contents($pedidosFile, json_encode($pedidos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true]);
    exit;
}

// ══════════════════════════════════════════════════
// GET — Retorna public key do MP (pro front carregar o brick)
// ══════════════════════════════════════════════════
if ($method === 'GET' && $action === 'key') {
    echo json_encode(['publicKey' => $MP_PUBLIC_KEY]);
    exit;
}

// ══════════════════════════════════════════════════
// Função de email de confirmação
// ══════════════════════════════════════════════════
function enviarEmailConfirmacao($pedido) {
    $to = $pedido['cliente']['email'];
    $subject = 'Pedido Confirmado - VULTO CLUB #' . $pedido['numero'];

    $itensHtml = '';
    foreach ($pedido['itens'] as $item) {
        $itensHtml .= '<tr><td style="padding:8px;border-bottom:1px solid #222">' . $item['name'] . (isset($item['size']) ? ' ('.$item['size'].')' : '') . '</td><td style="padding:8px;border-bottom:1px solid #222;text-align:right">x' . $item['qty'] . '</td><td style="padding:8px;border-bottom:1px solid #222;text-align:right">R$ ' . number_format($item['price'] * $item['qty'], 2, ',', '.') . '</td></tr>';
    }

    $html = '
    <div style="max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;font-family:Arial,sans-serif;padding:0">
      <div style="padding:2rem;text-align:center;border-bottom:1px solid #222">
        <h1 style="font-size:1.8rem;letter-spacing:3px;margin:0">VULTO CLUB</h1>
      </div>
      <div style="padding:2rem">
        <h2 style="font-size:1.2rem;margin-bottom:0.5rem">Pedido Confirmado!</h2>
        <p style="color:#888;font-size:0.9rem">Olá ' . htmlspecialchars($pedido['cliente']['nome']) . ', seu pagamento foi aprovado.</p>
        <div style="background:#111;border:1px solid #222;padding:1rem;margin:1.5rem 0">
          <p style="margin:0;font-size:0.8rem;color:#888">Número do pedido</p>
          <p style="margin:0.25rem 0 0;font-size:1.2rem;font-family:monospace;letter-spacing:2px">#' . $pedido['numero'] . '</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:1.5rem">' . $itensHtml . '
          <tr><td colspan="2" style="padding:8px;font-weight:bold">TOTAL</td><td style="padding:8px;text-align:right;font-weight:bold">R$ ' . number_format($pedido['total'], 2, ',', '.') . '</td></tr>
        </table>
        <div style="background:#111;border:1px solid #222;padding:1rem;margin-bottom:1.5rem">
          <p style="margin:0 0 0.5rem;font-size:0.75rem;color:#888;letter-spacing:1px">ENTREGA</p>
          <p style="margin:0;font-size:0.85rem">' . htmlspecialchars($pedido['entrega']['endereco']) . '</p>
          <p style="margin:0.25rem 0 0;font-size:0.85rem;color:#888">' . htmlspecialchars($pedido['entrega']['bairro']) . ' - ' . htmlspecialchars($pedido['entrega']['cidade']) . '/' . htmlspecialchars($pedido['entrega']['estado']) . ' - CEP ' . htmlspecialchars($pedido['entrega']['cep']) . '</p>
        </div>
        <p style="font-size:0.85rem;color:#888;line-height:1.6">Vamos te avisar quando sua peça entrar em produção e quando for enviada. Acompanhe pelo site:</p>
        <a href="https://vultoclub.com.br/meu-pedido?numero=' . $pedido['numero'] . '" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:0.75rem 1.5rem;font-size:0.75rem;font-weight:bold;letter-spacing:2px;margin-top:1rem">ACOMPANHAR PEDIDO</a>
      </div>
      <div style="padding:1.5rem 2rem;border-top:1px solid #222;text-align:center;font-size:0.7rem;color:#555">
        VULTO CLUB — vultoclub.com.br
      </div>
    </div>';

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: VULTO CLUB <noreply@vultoclub.com.br>\r\n";

    @mail($to, $subject, $html, $headers);
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
