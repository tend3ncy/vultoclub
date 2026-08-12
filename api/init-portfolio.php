<?php
// Script para inicializar a estrutura do portfolio no db.json

$dbFile = __DIR__ . '/../db.json';

// Ler o db.json atual
$db = [];
if (file_exists($dbFile)) {
    $content = file_get_contents($dbFile);
    $db = json_decode($content, true) ?: [];
}

// Adicionar estrutura do portfolio se não existir
if (!isset($db['portfolio'])) {
    $db['portfolio'] = [
        'projects' => []
    ];
    
    // Salvar
    file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true, 'message' => 'Estrutura do portfolio inicializada']);
} else {
    echo json_encode(['ok' => true, 'message' => 'Estrutura do portfolio já existe']);
}
