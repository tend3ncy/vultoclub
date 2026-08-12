# VULTO - Versão PHP

## Como hospedar na HostGator (Plano P)

### 1. Fazer upload via FTP
- Conecte no FTP da HostGator (use FileZilla ou o gerenciador de arquivos do cPanel)
- Faça upload de **todos os arquivos** para a pasta `public_html` (ou subpasta se quiser)

### 2. Estrutura de pastas necessária
```
public_html/
├── api/
│   ├── auth.php
│   ├── login.php
│   ├── logout.php
│   ├── products.php
│   ├── links.php
│   └── settings.php
├── data/          (será criada automaticamente)
├── .htaccess
├── index.html
├── login.html
├── admin.html
├── admin-links.html
├── links.html
├── style.css
├── admin.css
├── app.js
├── admin.js
└── (outros arquivos)
```

### 3. Permissões
Certifique-se que a pasta `data/` tem permissão de escrita (755 ou 777).
No cPanel: Gerenciador de Arquivos → Clique com botão direito na pasta `data` → Permissões → 755

### 4. Trocar a senha
Edite o arquivo `api/login.php` e mude a linha:
```php
$SENHA_HASH = hash('sha256', getenv('VULTO_SENHA') ?: 'vulto2024');
```
Para:
```php
$SENHA_HASH = hash('sha256', 'suasenha123');
```

Ou defina a variável de ambiente `VULTO_SENHA` no cPanel.

### 5. Acessar
- Loja: `https://seudominio.com`
- Admin: `https://seudominio.com/login.html`
- Links: `https://seudominio.com/links.html`

Senha padrão: `vulto2024`

## Diferenças da versão Node.js
- Usa sessões PHP em vez de cookies HttpOnly
- Dados salvos em `data/db.json` e `data/fails.json`
- Funcionalidades idênticas

## Requisitos
- PHP 7.4+ (já vem no Plano P)
- Módulo mod_rewrite ativado (já vem ativado)
