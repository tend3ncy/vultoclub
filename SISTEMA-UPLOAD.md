# 📸 Sistema de Upload de Imagens - Portfolio Freshzito

## ✅ O que foi criado

### 1. Pasta de Uploads
```
uploads/
├── portfolio/          # Imagens do portfolio
│   ├── .gitkeep       # Mantém pasta no git
│   └── *.jpg/png/gif  # Suas imagens
├── .gitignore         # Não versiona imagens
└── README.md          # Documentação da pasta
```

### 2. Interface de Upload
- **Drag & Drop:** Arraste imagens para fazer upload
- **Click to Upload:** Clique para selecionar arquivo
- **Preview:** Visualize a imagem antes de salvar
- **Progress Bar:** Acompanhe o progresso do upload
- **URL Externa:** Opção de usar URL de imagem externa

### 3. API de Upload
- **Endpoint:** `POST /api/portfolio/upload`
- **Autenticação:** Requer login do portfolio
- **Validação:** Tipo e tamanho de arquivo
- **Resposta:** URL da imagem salva

### 4. Documentação
- `docs/PORTFOLIO-ADMIN.md` - Guia completo do admin
- `docs/UPLOAD-IMAGENS.md` - Guia específico de upload
- `uploads/README.md` - Documentação da pasta

## 🚀 Como Usar

### 1. Inicie o servidor
```bash
node server.js
```

### 2. Faça login no admin
- Acesse: http://localhost:3000/pages/portfolio/login.html
- Usuário: `freshzito`
- Senha: `fresh2024`

### 3. Adicione um projeto
1. Clique em "Novo Projeto"
2. Preencha título e categoria
3. **Faça upload da imagem:**
   - Arraste a imagem para a área de upload
   - Ou clique e selecione o arquivo
   - Aguarde o upload completar
4. Salve o projeto

### 4. A imagem está salva!
- Localização: `uploads/portfolio/1234567890-abc123.jpg`
- URL pública: `/uploads/portfolio/1234567890-abc123.jpg`
- Acessível em: http://localhost:3000/uploads/portfolio/1234567890-abc123.jpg

## 📋 Especificações

### Formatos Aceitos
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WEBP

### Limites
- **Tamanho máximo:** 5MB por arquivo
- **Dimensões:** Sem limite
- **Quantidade:** Ilimitada

### Segurança
- ✅ Apenas usuários autenticados podem fazer upload
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho
- ✅ Nomes únicos (timestamp + hash)
- ✅ Proteção contra path traversal

## 🎨 Funcionalidades

### Upload
- [x] Drag & Drop
- [x] Click to select
- [x] Progress bar
- [x] Preview da imagem
- [x] Validação de tipo
- [x] Validação de tamanho
- [x] Nomes únicos
- [x] URL externa (opcional)

### Gerenciamento
- [x] Visualizar imagem no card
- [x] Editar projeto (trocar imagem)
- [x] Remover imagem
- [x] Preview ao editar

### API
- [x] POST /api/portfolio/upload
- [x] Autenticação obrigatória
- [x] Multipart/form-data
- [x] Resposta com URL

## 📁 Estrutura de Arquivos

### Frontend
```
pages/portfolio/
└── admin.html              # Interface de upload

css/
└── admin.css               # Estilos do upload

js/
└── portfolio-admin.js      # Lógica de upload
```

### Backend
```
server.js                   # Rota de upload
uploads/
└── portfolio/              # Imagens salvas
```

## 🔧 Código Importante

### Upload (Frontend)
```javascript
// js/portfolio-admin.js
async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/portfolio/upload');
    xhr.send(formData);
}
```

### Upload (Backend)
```javascript
// server.js
if (pathname === '/api/portfolio/upload' && req.method === 'POST') {
    const parts = await parseMultipart(req, boundary);
    const imagePart = parts.find(p => p.name === 'image');
    
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    fs.writeFileSync(filepath, imagePart.data);
    
    return json(res, 200, { url: `/uploads/portfolio/${filename}` });
}
```

## 🌐 Deploy

### 1. Copiar pasta uploads
```bash
scp -r uploads/ usuario@servidor:/caminho/site/
```

### 2. Configurar permissões
```bash
chmod 755 uploads/
chmod 755 uploads/portfolio/
chmod 644 uploads/portfolio/*
```

### 3. Verificar .htaccess
Certifique-se que permite acesso a `/uploads/`:
```apache
# Permitir acesso a uploads
<Directory "/caminho/site/uploads">
    Options -Indexes
    AllowOverride None
    Require all granted
</Directory>
```

## 📦 Backup

### Fazer Backup
```bash
# Windows PowerShell
Compress-Archive -Path uploads/portfolio -DestinationPath backup-portfolio.zip

# Linux/Mac
tar -czf backup-portfolio.tar.gz uploads/portfolio/
```

### Restaurar Backup
```bash
# Windows PowerShell
Expand-Archive -Path backup-portfolio.zip -DestinationPath uploads/

# Linux/Mac
tar -xzf backup-portfolio.tar.gz
```

## 💡 Dicas

### Otimização de Imagens
Antes de fazer upload:
1. Redimensione para 1200-1600px de largura
2. Comprima com TinyPNG ou Squoosh
3. Use JPG para fotos, PNG para transparência

### Organização
1. Mantenha backup das imagens originais
2. Faça backup regular da pasta `uploads/`
3. Monitore espaço em disco
4. Limpe imagens não utilizadas

### Performance
1. Use WEBP quando possível (menor tamanho)
2. Comprima imagens antes do upload
3. Considere CDN para muitas imagens
4. Implemente lazy loading no frontend

## 🎯 Próximos Passos

### Melhorias Futuras (opcional)
- [ ] Redimensionamento automático no servidor
- [ ] Compressão automática
- [ ] Conversão para WEBP
- [ ] Galeria de imagens já enviadas
- [ ] Busca de imagens
- [ ] Tags/categorias para imagens
- [ ] Integração com CDN
- [ ] Limpeza automática de imagens não usadas

## 📞 Suporte

**Documentação:**
- `docs/PORTFOLIO-ADMIN.md` - Guia completo
- `docs/UPLOAD-IMAGENS.md` - Guia de upload
- `uploads/README.md` - Info da pasta

**Código:**
- `server.js` - Rota de upload (linha ~200)
- `js/portfolio-admin.js` - Lógica frontend
- `pages/portfolio/admin.html` - Interface

**Troubleshooting:**
- Verifique console do navegador (F12)
- Verifique logs do servidor
- Teste permissões da pasta uploads/
- Verifique tamanho e formato do arquivo

## ✅ Status

- ✅ Sistema de upload funcionando
- ✅ Drag & Drop implementado
- ✅ Progress bar funcionando
- ✅ Preview de imagens
- ✅ Validação de arquivos
- ✅ API protegida
- ✅ Documentação completa
- ✅ Pasta uploads criada
- ✅ .gitignore configurado

**Tudo pronto para uso!** 🎉
