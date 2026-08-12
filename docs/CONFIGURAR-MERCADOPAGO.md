# Como Configurar o Mercado Pago

## Passo 1: Obter suas credenciais

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" > "Credenciais"
3. Você verá duas abas: **Teste** e **Produção**

### Credenciais de TESTE (para desenvolvimento)
- Public Key: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Access Token: `TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx`

### Credenciais de PRODUÇÃO (para vender de verdade)
- Public Key: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Access Token: `APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx`

## Passo 2: Configurar no sistema

### Para o BACKEND (PHP):
Edite o arquivo `api/config.php`:

```php
$MP_MODE = 'test'; // Troque para 'production' quando for vender

// Cole suas credenciais de TESTE aqui:
$MP_TEST_PUBLIC_KEY = 'TEST-sua-chave-aqui';
$MP_TEST_ACCESS_TOKEN = 'TEST-seu-token-aqui';

// Cole suas credenciais de PRODUÇÃO aqui:
$MP_PROD_PUBLIC_KEY = 'APP_USR-sua-chave-aqui';
$MP_PROD_ACCESS_TOKEN = 'APP_USR-seu-token-aqui';
```

### Para o FRONTEND (JavaScript):
Edite o arquivo `mp-config.js`:

```javascript
const MP_CONFIG = {
  mode: 'test', // Troque para 'production' quando for vender
  
  test: {
    publicKey: 'TEST-sua-chave-aqui'
  },
  
  production: {
    publicKey: 'APP_USR-sua-chave-aqui'
  }
};
```

## Passo 3: Testar

### Modo TESTE:
- Use cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards
- Exemplo: Cartão `5031 4332 1540 6351` - CVV: 123 - Validade: qualquer data futura

### Modo PRODUÇÃO:
- Certifique-se que sua conta está ativada
- Use cartões reais
- Os pagamentos serão processados de verdade

## Trocar entre Teste e Produção

Basta mudar `$MP_MODE` em `api/config.php` e `mode` em `mp-config.js`:
- `'test'` = Ambiente de testes
- `'production'` = Ambiente real (vendas reais)

**IMPORTANTE:** Sempre teste no modo 'test' antes de ativar 'production'!
