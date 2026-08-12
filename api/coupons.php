<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dbFile = '../db.json';

// GET - Validar cupom
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!isset($_GET['code'])) {
    echo json_encode(['error' => 'Código do cupom não fornecido']);
    exit;
  }
  
  $code = strtoupper(trim($_GET['code']));
  
  if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'Cupom inválido']);
    exit;
  }
  
  $db = json_decode(file_get_contents($dbFile), true);
  
  if (!isset($db['coupons']) || !is_array($db['coupons'])) {
    echo json_encode(['error' => 'Cupom inválido']);
    exit;
  }
  
  $coupon = null;
  foreach ($db['coupons'] as $c) {
    if (strtoupper($c['code']) === $code) {
      $coupon = $c;
      break;
    }
  }
  
  if (!$coupon) {
    echo json_encode(['error' => 'Cupom inválido']);
    exit;
  }
  
  // Verifica se está ativo
  if (!$coupon['active']) {
    echo json_encode(['error' => 'Cupom inativo']);
    exit;
  }
  
  // Verifica validade
  if (isset($coupon['expiry']) && $coupon['expiry']) {
    $expiry = strtotime($coupon['expiry']);
    if ($expiry && $expiry < time()) {
      echo json_encode(['error' => 'Cupom expirado']);
      exit;
    }
  }
  
  // Verifica limite de uso
  if (isset($coupon['usageLimit']) && $coupon['usageLimit'] > 0) {
    $used = isset($coupon['usageCount']) ? $coupon['usageCount'] : 0;
    if ($used >= $coupon['usageLimit']) {
      echo json_encode(['error' => 'Cupom esgotado']);
      exit;
    }
  }
  
  echo json_encode([
    'code' => $coupon['code'],
    'type' => $coupon['type'],
    'value' => floatval($coupon['value'])
  ]);
  exit;
}

// POST - Criar cupom
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  session_start();
  if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
  }
  
  $input = json_decode(file_get_contents('php://input'), true);
  
  if (!isset($input['code']) || !isset($input['type']) || !isset($input['value'])) {
    echo json_encode(['error' => 'Dados incompletos']);
    exit;
  }
  
  $db = file_exists($dbFile) ? json_decode(file_get_contents($dbFile), true) : [];
  
  if (!isset($db['coupons'])) {
    $db['coupons'] = [];
  }
  
  $newCoupon = [
    'id' => uniqid(),
    'code' => strtoupper(trim($input['code'])),
    'type' => $input['type'], // 'percentage' ou 'fixed'
    'value' => floatval($input['value']),
    'active' => isset($input['active']) ? $input['active'] : true,
    'expiry' => isset($input['expiry']) ? $input['expiry'] : null,
    'usageLimit' => isset($input['usageLimit']) ? intval($input['usageLimit']) : 0,
    'usageCount' => 0
  ];
  
  $db['coupons'][] = $newCoupon;
  
  file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT));
  
  echo json_encode($newCoupon);
  exit;
}

// PUT - Atualizar cupom
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  session_start();
  if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
  }
  
  $input = json_decode(file_get_contents('php://input'), true);
  
  if (!isset($input['id'])) {
    echo json_encode(['error' => 'ID não fornecido']);
    exit;
  }
  
  if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'Cupom não encontrado']);
    exit;
  }
  
  $db = json_decode(file_get_contents($dbFile), true);
  
  if (!isset($db['coupons'])) {
    echo json_encode(['error' => 'Cupom não encontrado']);
    exit;
  }
  
  $found = false;
  foreach ($db['coupons'] as &$coupon) {
    if ($coupon['id'] === $input['id']) {
      if (isset($input['code'])) $coupon['code'] = strtoupper(trim($input['code']));
      if (isset($input['type'])) $coupon['type'] = $input['type'];
      if (isset($input['value'])) $coupon['value'] = floatval($input['value']);
      if (isset($input['active'])) $coupon['active'] = $input['active'];
      if (isset($input['expiry'])) $coupon['expiry'] = $input['expiry'];
      if (isset($input['usageLimit'])) $coupon['usageLimit'] = intval($input['usageLimit']);
      $found = true;
      break;
    }
  }
  
  if (!$found) {
    echo json_encode(['error' => 'Cupom não encontrado']);
    exit;
  }
  
  file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT));
  
  echo json_encode(['success' => true]);
  exit;
}

// DELETE - Remover cupom
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  session_start();
  if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
  }
  
  $id = isset($_GET['id']) ? $_GET['id'] : null;
  
  if (!$id) {
    echo json_encode(['error' => 'ID não fornecido']);
    exit;
  }
  
  if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'Cupom não encontrado']);
    exit;
  }
  
  $db = json_decode(file_get_contents($dbFile), true);
  
  if (!isset($db['coupons'])) {
    echo json_encode(['error' => 'Cupom não encontrado']);
    exit;
  }
  
  $db['coupons'] = array_values(array_filter($db['coupons'], function($c) use ($id) {
    return $c['id'] !== $id;
  }));
  
  file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT));
  
  echo json_encode(['success' => true]);
  exit;
}

echo json_encode(['error' => 'Método não suportado']);
 