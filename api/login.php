<?php
session_start();
header('Content-Type: application/json');

// Configuração
$SENHA_HASH = hash('sha256', getenv('VULTO_SENHA') ?: 'vulto2024');
$MAX_FAILS = 5;
$LOCK_SECONDS = 300; // 5 minutos

// Controle de tentativas por IP
$ip = $_SERVER['REMOTE_ADDR'];
$failFile = __DIR__ . '/../data/fails.json';
$fails = file_exists($failFile) ? json_decode(file_get_contents($failFile), true) : [];

if (!isset($fails[$ip])) {
    $fails[$ip] = ['count' => 0, 'lockUntil' => 0];
}

// Verifica bloqueio
if (time() < $fails[$ip]['lockUntil']) {
    $left = $fails[$ip]['lockUntil'] - time();
    http_response_code(429);
    echo json_encode(['error' => "Bloqueado. Aguarde {$left}s."]);
    exit;
}

// Valida senha
$input = json_decode(file_get_contents('php://input'), true);
$inputHash = hash('sha256', $input['senha'] ?? '');

if ($inputHash === $SENHA_HASH) {
    // Login bem-sucedido
    unset($fails[$ip]);
    file_put_contents($failFile, json_encode($fails));
    $_SESSION['vulto_auth'] = true;
    echo json_encode(['ok' => true]);
} else {
    // Senha incorreta
    $fails[$ip]['count']++;
    if ($fails[$ip]['count'] >= $MAX_FAILS) {
        $fails[$ip]['lockUntil'] = time() + $LOCK_SECONDS;
        $fails[$ip]['count'] = 0;
    }
    file_put_contents($failFile, json_encode($fails));
    $left = $MAX_FAILS - $fails[$ip]['count'];
    http_response_code(401);
    echo json_encode(['error' => "Senha incorreta. {$left} tentativa(s) restante(s)."]);
}
