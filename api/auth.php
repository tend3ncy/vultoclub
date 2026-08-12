<?php
session_start();
header('Content-Type: application/json');

$authenticated = isset($_SESSION['vulto_auth']) && $_SESSION['vulto_auth'] === true;
echo json_encode(['authenticated' => $authenticated]);
