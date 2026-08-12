# ✅ Teste de Referências - Projeto Organizado

## URLs para Testar

### Páginas Principais
- http://localhost:3000/ (index.html)
- http://localhost:3000/freshzito.html
- http://localhost:3000/404.html

### Páginas Públicas
- http://localhost:3000/pages/eventos.html
- http://localhost:3000/pages/bio.html
- http://localhost:3000/pages/links.html
- http://localhost:3000/pages/fresh.html
- http://localhost:3000/pages/login.html
- http://localhost:3000/pages/sucesso.html
- http://localhost:3000/pages/pendente.html
- http://localhost:3000/pages/erro.html

### Páginas de Políticas
- http://localhost:3000/pages/politicas/politica-privacidade.html
- http://localhost:3000/pages/politicas/trocas-devolucoes.html
- http://localhost:3000/pages/politicas/politica-envio.html
- http://localhost:3000/pages/politicas/termos-servico.html

### Admin (requer login)
- http://localhost:3000/admin (redireciona para /pages/admin/admin.html)
- http://localhost:3000/pages/admin/admin.html
- http://localhost:3000/pages/admin/admin-links.html
- http://localhost:3000/pages/admin/admin-eventos.html
- http://localhost:3000/pages/admin/admin-cupons.html
- http://localhost:3000/pages/admin/admin-config.html

## Checklist de Verificação

### ✅ CSS Carregando
- [ ] index.html - css/style.css
- [ ] freshzito.html - css/freshzito.css
- [ ] pages/eventos.html - ../css/style.css e ../css/eventos.css
- [ ] pages/admin/*.html - ../../css/style.css e ../../css/admin.css
- [ ] pages/politicas/*.html - ../../css/style.css

### ✅ JavaScript Carregando
- [ ] index.html - js/app.js e js/mp-config.js
- [ ] freshzito.html - js/freshzito.js
- [ ] pages/eventos.html - ../js/eventos.js
- [ ] pages/admin/admin.html - ../../js/app.js e ../../js/admin.js
- [ ] pages/admin/admin-cupons.html - ../../js/app.js e ../../js/admin-cupons.js

### ✅ Imagens Carregando
- [ ] Logo no header (arquivos/logo.png)
- [ ] Vídeo hero (arquivos/video.mp4)

### ✅ Links Funcionando
- [ ] Links de navegação no index.html
- [ ] Links para políticas no footer
- [ ] Links entre páginas admin
- [ ] Redirecionamento /admin → /pages/admin/admin.html
- [ ] Redirecionamento /login → /pages/login.html

### ✅ API Funcionando
- [ ] GET /api/products
- [ ] GET /api/eventos
- [ ] GET /api/links
- [ ] GET /api/settings
- [ ] POST /api/login
- [ ] Proteção de rotas admin

## Como Testar

1. Inicie o servidor:
```bash
node server.js
```

2. Abra o navegador em http://localhost:3000

3. Verifique:
   - CSS está carregando (página com estilo)
   - JavaScript está funcionando (console sem erros)
   - Imagens aparecem
   - Links funcionam
   - Menu mobile funciona
   - Admin redireciona para login

4. Abra o DevTools (F12) e verifique:
   - Aba Network: todos os arquivos carregam com status 200
   - Aba Console: sem erros de "404 Not Found"

## Correções Aplicadas

✅ index.html - CSS, JS e links atualizados
✅ freshzito.html - CSS e JS atualizados  
✅ pages/eventos.html - CSS e JS atualizados
✅ pages/fresh.html - CSS e JS atualizados
✅ pages/admin/*.html - CSS, JS e assets atualizados
✅ pages/politicas/*.html - CSS atualizado
✅ server.js - Rotas de proteção atualizadas

## Estrutura de Caminhos

### Da raiz (index.html, freshzito.html):
- CSS: `css/style.css`
- JS: `js/app.js`
- Assets: `arquivos/logo.png`
- API: `api/products` (relativo à raiz)

### De pages/ (eventos.html, bio.html, etc):
- CSS: `../css/style.css`
- JS: `../js/script.js`
- Assets: `../arquivos/logo.png`

### De pages/admin/:
- CSS: `../../css/style.css`
- JS: `../../js/admin.js`
- Assets: `../../arquivos/logo.png`

### De pages/politicas/:
- CSS: `../../css/style.css`
- Assets: `../../arquivos/logo.png`
