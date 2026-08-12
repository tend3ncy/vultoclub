<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['portfolio_authenticated']) && $_SESSION['portfolio_authenticated'] === true) {
    echo json_encode(['authenticated' => true, 'user' => $_SESSION['portfolio_user'] ?? 'freshzito']);
} else {
    http_response_code(401);
    echo json_encode(['authenticated' => false]);
}
