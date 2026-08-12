# 🚀 Como colocar o VULTO no ar (HostGator Plano P)

## Passo 1: Acessar o cPanel
1. Entre no painel da HostGator
2. Clique em **Gerenciador de Arquivos**

## Passo 2: Fazer upload dos arquivos
1. Navegue até a pasta `public_html`
2. Clique em **Upload** (canto superior direito)
3. Arraste TODOS os arquivos do projeto:
   - `index.html`
   - `login.html`
   - `admin.html`
   - `admin-links.html`
   - `links.html`
   - `style.css`
   - `admin.css`
   - `app.js`
   - `admin.js`
   - `.htaccess`
   - Pasta `api/` completa (com todos os .php dentro)

## Passo 3: Criar a pasta data
1. No Gerenciador de Arquivos, clique em **+ Pasta**
2. Nome: `data`
3. Clique com botão direito na pasta `data` → **Permissões**
4. Marque: `755` ou `777` (para permitir escrita)

## Passo 4: Testar
Acesse: `https://seudominio.com`

- **Loja pública**: `https://seudominio.com`
- **Página de links**: `https://seudominio.com/links.html`
- **Login admin**: `https://seudominio.com/login.html`
- **Senha padrão**: `vulto2024`

## Passo 5: Trocar a senha (IMPORTANTE!)
1. No Gerenciador de Arquivos, abra: `api/login.php`
2. Encontre a linha:
   ```php
   $SENHA_HASH = hash('sha256', getenv('VULTO_SENHA') ?: 'vulto2024');
   ```
3. Troque por:
   ```php
   $SENHA_HASH = hash('sha256', 'suanovaSENHA123');
   ```
4. Salve o arquivo

## ✅ Pronto!
Seu site está no ar. Todos os dados (produtos, links, configurações) ficam salvos em `data/db.json`.

## 🔧 Troubleshooting

**Erro 500 ao acessar /api/***
- Verifique se a pasta `data/` tem permissão 755 ou 777

**Não consigo fazer login**
- Limpe os cookies do navegador
- Verifique se mudou a senha corretamente no `api/login.php`

**Produtos não aparecem**
- Verifique se o arquivo `data/db.json` existe e tem permissão de escrita
- Se não existir, será criado automaticamente no primeiro cadastro

## 📱 Testando no Radmin VPN
Se quiser testar localmente antes de fazer upload:
1. Instale o PHP: https://windows.php.net/download/
2. No terminal, dentro da pasta do projeto:
   ```bash
   php -S localhost:3000
   ```
3. Acesse: `http://localhost:3000`
