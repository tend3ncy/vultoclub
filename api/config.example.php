<?php
// EXEMPLO — Copie este arquivo para config.php e preencha suas credenciais
// NÃO commite o config.php no Git

$MP_MODE = 'production'; // 'test' ou 'production'

// Credenciais de TESTE
$MP_TEST_PUBLIC_KEY = 'TEST-sua-chave-publica-aqui';
$MP_TEST_ACCESS_TOKEN = 'TEST-seu-access-token-aqui';

// Credenciais de PRODUÇÃO
$MP_PROD_PUBLIC_KEY = 'APP_USR-sua-public-key';
$MP_PROD_ACCESS_TOKEN = 'APP_USR-seu-access-token';

// Seleciona as credenciais baseado no modo
if ($MP_MODE === 'test') {
  $MP_PUBLIC_KEY = $MP_TEST_PUBLIC_KEY;
  $MP_ACCESS_TOKEN = $MP_TEST_ACCESS_TOKEN;
} else {
  $MP_PUBLIC_KEY = $MP_PROD_PUBLIC_KEY;
  $MP_ACCESS_TOKEN = $MP_PROD_ACCESS_TOKEN;
}
