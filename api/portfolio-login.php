<?php
session_start();
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Credenciais padrão (alterar em produção)
$validUsername = 'freshzito';
$validPassword = 'fresh2026';

if ($username === $validUsername && $password === $validPassword) {
    $_SESSION['portfolio_authenticated'] = true;
    $_SESSION['portfolio_user'] = $username;
    echo json_encode(['ok' => true]);
} else {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Usuário ou senha incorretos']);
}
