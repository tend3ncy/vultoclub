<?php
session_start();
header('Content-Type: application/json');

// Verifica autenticação
if (!isset($_SESSION['portfolio_authenticated']) || $_SESSION['portfolio_authenticated'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhuma imagem enviada']);
    exit;
}

$file = $_FILES['image'];
$uploadDir = __DIR__ . '/../uploads/portfolio/';

// Cria diretório se não existir
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Validações
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo muito grande. Máximo 5MB']);
    exit;
}

// Gera nome único
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('portfolio_') . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move arquivo
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    $url = '/uploads/portfolio/' . $filename;
    echo json_encode(['ok' => true, 'url' => $url]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao fazer upload']);
}
