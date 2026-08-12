<?php
session_start();
header('Content-Type: application/json');

unset($_SESSION['portfolio_authenticated']);
unset($_SESSION['portfolio_user']);
session_destroy();

echo json_encode(['ok' => true]);
