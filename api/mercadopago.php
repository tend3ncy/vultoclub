<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Carrega configurações
require_once 'config.php';

function createPreference($items, $payer) {
  global $MP_ACCESS_TOKEN;
  
  $preference = [
    'items' => $items,
    'payer' => $payer,
    'back_urls' => [
      'success' => 'https://vultoclub.com.br/sucesso',
      'failure' => 'https://vultoclub.com.br/erro',
      'pending' => 'https://vultoclub.com.br/pendente'
    ],
    'auto_return' => 'approved',
    'statement_descriptor' => 'VULTO CLUB',
    'external_reference' => 'VULTO-' . time()
  ];
  
  $ch = curl_init('https://api.mercadopago.com/checkout/preferences');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preference));
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $MP_ACCESS_TOKEN
  ]);
  
  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  
  if ($httpCode !== 201) {
    return ['error' => 'Erro ao criar preferência', 'details' => json_decode($response)];
  }
  
  return json_decode($response, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  if (!isset($data['items']) || !is_array($data['items'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Items inválidos']);
    exit;
  }
  
  // Calcula subtotal
  $subtotal = 0;
  foreach ($data['items'] as $item) {
    $subtotal += $item['price'] * $item['qty'];
  }
  
  // Aplica desconto do cupom
  $discount = 0;
  if (isset($data['coupon']) && $data['coupon']) {
    $coupon = $data['coupon'];
    if ($coupon['type'] === 'percentage') {
      $discount = $subtotal * ($coupon['value'] / 100);
    } else {
      $discount = $coupon['value'];
    }
  }
  
  $total = $subtotal - $discount;
  
  // Formata items para Mercado Pago
  // Se houver desconto, adiciona como item negativo
  $items = array_map(function($item) {
    return [
      'title' => $item['name'] . (isset($item['size']) && $item['size'] ? ' - Tamanho ' . $item['size'] : ''),
      'quantity' => (int)$item['qty'],
      'unit_price' => (float)$item['price'],
      'currency_id' => 'BRL'
    ];
  }, $data['items']);
  
  // Adiciona desconto como item se houver cupom
  if ($discount > 0 && isset($data['coupon'])) {
    $items[] = [
      'title' => 'Desconto - Cupom ' . $data['coupon']['code'],
      'quantity' => 1,
      'unit_price' => -1 * (float)$discount,
      'currency_id' => 'BRL'
    ];
  }
  
  $payer = [
    'name' => $data['payer']['name'] ?? '',
    'email' => $data['payer']['email'] ?? '',
    'phone' => [
      'number' => $data['payer']['phone'] ?? ''
    ]
  ];
  
  $result = createPreference($items, $payer);
  
  if (isset($result['error'])) {
    http_response_code(500);
    echo json_encode($result);
  } else {
    echo json_encode([
      'id' => $result['id'],
      'init_point' => $result['init_point']
    ]);
  }
} else {
  http_response_code(405);
  echo json_encode(['error' => 'Método não permitido']);
}
