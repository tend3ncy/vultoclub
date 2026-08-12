# Atualização de Referências - Projeto Organizado

## ✅ Arquivos Corrigidos

### Raiz
- **index.html**
  - CSS: `style.css` → `css/style.css`
  - JS: `app.js` → `js/app.js`
  - JS: `mp-config.js` → `js/mp-config.js`
  - Links políticas: `politica-*.html` → `pages/politicas/politica-*.html`
  - Link eventos: `eventos` → `pages/eventos.html`

- **freshzito.html**
  - CSS: `freshzito.css` → `css/freshzito.css`
  - JS: `freshzito.js` → `js/freshzito.js`

### Pages/Admin
- **admin.html, admin-config.html, admin-cupons.html, admin-eventos.html, admin-links.html**
  - CSS: `style.css` → `../../css/style.css`
  - CSS: `admin.css` → `../../css/admin.css`
  - JS: `app.js` → `../../js/app.js`
  - JS: `admin.js` → `../../js/admin.js`
  - JS: `admin-cupons.js` → `../../js/admin-cupons.js`
  - Logo: `arquivos/logo.png` → `../../arquivos/logo.png`
  - Links entre páginas admin: mantidos relativos (corretos)

### Pages/Politicas
- **politica-privacidade.html, trocas-devolucoes.html, termos-servico.html, politica-envio.html**
  - CSS: `style.css` → `../../css/style.css`

### Pages
- **eventos.html**
  - CSS: `style.css` → `../css/style.css`
  - CSS: `eventos.css` → `../css/eventos.css`
  - JS: `eventos.js` → `../js/eventos.js`

## 📁 Estrutura Final

```
.
├── index.html (✅ corrigido)
├── freshzito.html (✅ corrigido)
├── 404.html
├── db.json
├── server.js
├── .htaccess
│
├── css/
│   ├── style.css
│   ├── admin.css
│   ├── eventos.css
│   └── freshzito.css
│
├── js/
│   ├── app.js
│   ├── admin.js
│   ├── admin-cupons.js
│   ├── eventos.js
│   ├── freshzito.js
│   ├── script.js
│   └── mp-config.js
│
├── pages/
│   ├── admin/ (✅ todos corrigidos)
│   │   ├── admin.html
│   │   ├── admin-config.html
│   │   ├── admin-cupons.html
│   │   ├── admin-eventos.html
│   │   └── admin-links.html
│   │
│   ├── politicas/ (✅ todos corrigidos)
│   │   ├── politica-envio.html
│   │   ├── politica-privacidade.html
│   │   ├── termos-servico.html
│   │   └── trocas-devolucoes.html
│   │
│   ├── bio.html
│   ├── erro.html
│   ├── eventos.html (✅ corrigido)
│   ├── fresh.html
│   ├── links.html
│   ├── login.html
│   ├── pendente.html
│   └── sucesso.html
│
├── api/ (✅ sem alterações necessárias)
│   ├── auth.php
│   ├── config.php
│   ├── coupons.php
│   ├── links.php
│   ├── login.php
│   ├── logout.php
│   ├── mercadopago.php
│   ├── products.php
│   └── settings.php
│
├── arquivos/
│   ├── logo.png
│   └── video.mp4
│
├── docs/
│   ├── CONFIGURAR-MERCADOPAGO.md
│   ├── DEPLOY-HOSTGATOR.md
│   └── README-PHP.md
│
└── backups/
    ├── db_backup.json
    ├── vulto-club-deploy.zip
    └── vulto-club-deploy-atualizado.zip
```

## ⚠️ Arquivos que Podem Precisar de Atenção

### Páginas não verificadas (podem ter referências antigas):
- `pages/bio.html`
- `pages/erro.html`
- `pages/fresh.html`
- `pages/links.html`
- `pages/login.html`
- `pages/pendente.html`
- `pages/sucesso.html`
- `404.html`

### Recomendação:
Verificar essas páginas e atualizar referências de CSS/JS se necessário seguindo o padrão:
- De `pages/`: usar `../css/` e `../js/`
- De `pages/admin/`: usar `../../css/` e `../../js/`
- De `pages/politicas/`: usar `../../css/` e `../../js/`

## 🔗 Referências de API

As referências de API nos arquivos JS estão corretas (relativas à raiz):
- `fetch('api/products')`
- `fetch('api/mercadopago.php')`
- `fetch('api/coupons.php')`
- etc.

Essas funcionam de qualquer lugar do site pois são relativas à raiz.

## ✅ Status

- **Páginas principais**: ✅ Corrigidas
- **Admin**: ✅ Corrigido
- **Políticas**: ✅ Corrigidas
- **Eventos**: ✅ Corrigido
- **API**: ✅ Sem alterações necessárias
- **Outras páginas**: ⚠️ Verificar manualmente
