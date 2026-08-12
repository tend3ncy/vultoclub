<?php
session_start();
header('Content-Type: application/json');

$dbFile = __DIR__ . '/../db.json';
$method = $_SERVER['REQUEST_METHOD'];

// Função para ler o banco
function readDB() {
    global $dbFile;
    if (!file_exists($dbFile)) {
        return ['portfolio' => ['projects' => []]];
    }
    $content = file_get_contents($dbFile);
    return json_decode($content, true) ?: ['portfolio' => ['projects' => []]];
}

// Função para salvar no banco
function writeDB($data) {
    global $dbFile;
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Verifica autenticação para métodos que modificam
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!isset($_SESSION['portfolio_authenticated']) || $_SESSION['portfolio_authenticated'] !== true) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
}

// GET - Listar projetos
if ($method === 'GET') {
    $db = readDB();
    $projects = $db['portfolio']['projects'] ?? [];
    echo json_encode($projects);
    exit;
}

// POST - Criar projeto
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['category']) || empty($input['image'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Campos obrigatórios: title, category, image']);
        exit;
    }
    
    $db = readDB();
    if (!isset($db['portfolio'])) $db['portfolio'] = [];
    if (!isset($db['portfolio']['projects'])) $db['portfolio']['projects'] = [];
    
    $newProject = [
        'id' => uniqid('proj_'),
        'title' => $input['title'],
        'category' => $input['category'],
        'description' => $input['description'] ?? '',
        'image' => $input['image'],
        'link' => $input['link'] ?? '',
        'createdAt' => date('Y-m-d H:i:s')
    ];
    
    $db['portfolio']['projects'][] = $newProject;
    writeDB($db);
    
    echo json_encode($newProject);
    exit;
}

// PUT - Atualizar projeto
if ($method === 'PUT') {
    $uri = $_SERVER['REQUEST_URI'];
    preg_match('/\/api\/portfolio\/projects\/([^\/\?]+)/', $uri, $matches);
    $id = $matches[1] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID não fornecido']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $db = readDB();
    
    $found = false;
    foreach ($db['portfolio']['projects'] as &$project) {
        if ($project['id'] === $id) {
            $project['title'] = $input['title'] ?? $project['title'];
            $project['category'] = $input['category'] ?? $project['category'];
            $project['description'] = $input['description'] ?? $project['description'];
            $project['image'] = $input['image'] ?? $project['image'];
            $project['link'] = $input['link'] ?? $project['link'];
            $project['updatedAt'] = date('Y-m-d H:i:s');
            $found = true;
            echo json_encode($project);
            break;
        }
    }
    
    if ($found) {
        writeDB($db);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Projeto não encontrado']);
    }
    exit;
}

// DELETE - Remover projeto
if ($method === 'DELETE') {
    $uri = $_SERVER['REQUEST_URI'];
    preg_match('/\/api\/portfolio\/projects\/([^\/\?]+)/', $uri, $matches);
    $id = $matches[1] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID não fornecido']);
        exit;
    }
    
    $db = readDB();
    $initialCount = count($db['portfolio']['projects']);
    $db['portfolio']['projects'] = array_values(array_filter($db['portfolio']['projects'], function($p) use ($id) {
        return $p['id'] !== $id;
    }));
    
    if (count($db['portfolio']['projects']) < $initialCount) {
        writeDB($db);
        echo json_encode(['ok' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Projeto não encontrado']);
    }
    exit;
}
