# Projeto Vulto Club

Plataforma de vendas de ingressos e gerenciamento de eventos com integração Mercado Pago.

## 📁 Estrutura do Projeto

```
.
├── api/                    # Backend PHP
│   ├── auth.php           # Autenticação
│   ├── config.php         # Configurações
│   ├── coupons.php        # Cupons de desconto
│   ├── links.php          # Links bio
│   ├── login.php          # Login
│   ├── logout.php         # Logout
│   ├── mercadopago.php    # Integração MP
│   ├── products.php       # Produtos/Eventos
│   └── settings.php       # Configurações gerais
│
├── css/                   # Estilos
│   ├── admin.css         # Admin panel
│   ├── eventos.css       # Página de eventos
│   ├── freshzito.css     # Portfolio Freshzito
│   └── style.css         # Estilos globais
│
├── js/                    # Scripts
│   ├── admin.js          # Admin panel
│   ├── admin-cupons.js   # Gestão de cupons
│   ├── app.js            # App principal
│   ├── eventos.js        # Eventos
│   ├── freshzito.js      # Portfolio
│   ├── mp-config.js      # Config Mercado Pago
│   └── script.js         # Scripts globais
│
├── pages/                 # Páginas HTML
│   ├── admin/            # Painel administrativo
│   │   ├── admin.html
│   │   ├── admin-config.html
│   │   ├── admin-cupons.html
│   │   ├── admin-eventos.html
│   │   └── admin-links.html
│   │
│   ├── politicas/        # Políticas e termos
│   │   ├── politica-envio.html
│   │   ├── politica-privacidade.html
│   │   ├── termos-servico.html
│   │   └── trocas-devolucoes.html
│   │
│   ├── bio.html          # Página bio
│   ├── erro.html         # Página de erro
│   ├── eventos.html      # Lista de eventos
│   ├── fresh.html        # Página fresh
│   ├── links.html        # Links
│   ├── login.html        # Login
│   ├── pendente.html     # Pagamento pendente
│   └── sucesso.html      # Pagamento sucesso
│
├── arquivos/              # Assets
│   ├── logo.png
│   └── video.mp4
│
├── docs/                  # Documentação
│   ├── CONFIGURAR-MERCADOPAGO.md
│   ├── DEPLOY-HOSTGATOR.md
│   └── README-PHP.md
│
├── backups/               # Backups
│   ├── db_backup.json
│   ├── vulto-club-deploy.zip
│   └── vulto-club-deploy-atualizado.zip
│
├── .htaccess             # Configuração Apache
├── 404.html              # Página 404
├── db.json               # Banco de dados JSON
├── freshzito.html        # Portfolio Freshzito
├── index.html            # Página inicial
└── server.js             # Servidor Node.js

```

## 🚀 Como usar

### Desenvolvimento Local

```bash
# Instalar dependências (se necessário)
npm install

# Iniciar servidor
node server.js
```

### Deploy

Consulte `docs/DEPLOY-HOSTGATOR.md` para instruções de deploy.

## 🔧 Configuração

### Mercado Pago

Consulte `docs/CONFIGURAR-MERCADOPAGO.md` para configurar a integração.

### Banco de Dados

O projeto usa `db.json` como banco de dados. Backup em `backups/db_backup.json`.

## 📄 Páginas Principais

- **/** - Página inicial (Vulto Club)
- **/freshzito.html** - Portfolio Freshzito
- **/pages/eventos.html** - Lista de eventos
- **/pages/bio.html** - Página bio
- **/pages/links.html** - Links
- **/pages/admin/admin.html** - Painel administrativo

## 🔐 Admin

Acesse `/pages/admin/admin.html` para gerenciar:
- Eventos
- Cupons de desconto
- Links bio
- Configurações

## 📱 Projetos

### Vulto Club
Plataforma principal de venda de ingressos

### Freshzito
Portfolio profissional minimalista para designer/fotógrafo

## 🛠️ Tecnologias

- HTML5, CSS3, JavaScript
- PHP (Backend)
- Node.js (Servidor dev)
- Mercado Pago API
- JSON Database

## 📝 Licença

© 2026 Vulto Club. Todos os direitos reservados.
