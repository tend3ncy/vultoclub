<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Método não permitido']); exit; }

// Config
$ME_TOKEN = 'Vulto Club279734b2z34kc4AYDK9dspc5ZSff1aAz9VQr5i3LVofrk';
$CEP_ORIGEM = '07050330';

// Pacote padrão por peça: 300g, 30x20x5cm
$PESO_POR_ITEM = 0.3; // kg
$LARGURA = 30; // cm
$ALTURA = 5;  // cm
$COMPRIMENTO = 20; // cm

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['cep_destino'])) {
    http_response_code(400);
    echo json_encode(['error' => 'CEP de destino obrigatório']);
    exit;
}

$cepDestino = preg_replace('/\D/', '', $input['cep_destino']);
$quantidade = intval($input['quantidade'] ?? 1);

// Calcula peso e dimensões baseado na quantidade
$peso = $PESO_POR_ITEM * $quantidade;
$altura = $ALTURA + (($quantidade - 1) * 2); // cada peça extra +2cm de altura

$payload = [
    'from' => ['postal_code' => $CEP_ORIGEM],
    'to' => ['postal_code' => $cepDestino],
    'products' => [
        [
            'id' => '1',
            'width' => $LARGURA,
            'height' => $altura,
            'length' => $COMPRIMENTO,
            'weight' => $peso,
            'insurance_value' => floatval($input['valor'] ?? 100),
            'quantity' => 1
        ]
    ]
];

$ch = curl_init('https://melhorenvio.com.br/api/v2/me/shipment/calculate');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $ME_TOKEN,
        'User-Agent: VultoClub (contato@vultoclub.com.br)'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao calcular frete', 'status' => $httpCode]);
    exit;
}

$data = json_decode($response, true);

if (!$data || !is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Resposta inválida do Melhor Envio']);
    exit;
}

// Filtra só opções válidas (sem erro) e formata
$opcoes = [];
foreach ($data as $item) {
    if (isset($item['error'])) continue;
    if (empty($item['price']) || floatval($item['price']) <= 0) continue;

    $opcoes[] = [
        'id' => $item['id'] ?? '',
        'nome' => $item['name'] ?? '',
        'empresa' => $item['company']['name'] ?? '',
        'preco' => floatval($item['price']),
        'prazo' => intval($item['delivery_time'] ?? 0),
        'precoFormatado' => 'R$ ' . number_format(floatval($item['price']), 2, ',', '.')
    ];
}

// Ordena por preço
usort($opcoes, function($a, $b) { return $a['preco'] - $b['preco']; });

echo json_encode(['success' => true, 'opcoes' => $opcoes]);
