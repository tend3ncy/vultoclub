<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$dbFile = '../db.json';

// GET - Buscar configurações
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!file_exists($dbFile)) {
    echo json_encode(['whatsappGroup' => '']);
    exit;
  }
  
  $db = json_decode(file_get_contents($dbFile), true);
  
  $settings = isset($db['settings']) ? $db['settings'] : ['whatsappGroup' => ''];
  
  echo json_encode($settings);
  exit;
}

// POST - Salvar configurações
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  session_start();
  if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
  }
  
  $input = json_decode(file_get_contents('php://input'), true);
  
  if (!file_exists($dbFile)) {
    $db = ['products' => [], 'coupons' => [], 'settings' => []];
  } else {
    $db = json_decode(file_get_contents($dbFile), true);
  }
  
  if (!isset($db['settings'])) {
    $db['settings'] = [];
  }
  
  $db['settings']['whatsappGroup'] = isset($input['whatsappGroup']) ? $input['whatsappGroup'] : '';
  
  file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT));
  
  echo json_encode(['success' => true]);
  exit;
}

echo json_encode(['error' => 'Método não suportado']);
