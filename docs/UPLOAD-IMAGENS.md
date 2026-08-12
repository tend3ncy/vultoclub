# 📸 Guia de Upload de Imagens - Portfolio Freshzito

## 🚀 Como Funciona

O sistema permite fazer **upload direto** de imagens para o servidor, sem precisar usar serviços externos como Imgur ou Cloudinary.

## 📁 Onde as Imagens Ficam

```
uploads/
└── portfolio/
    ├── 1234567890-abc123def456.jpg
    ├── 1234567891-xyz789ghi012.png
    └── ...
```

- Pasta: `uploads/portfolio/`
- Nomes gerados automaticamente (timestamp + hash)
- URLs: `/uploads/portfolio/nome-arquivo.jpg`

## 🎨 Como Fazer Upload

### Método 1: Arrastar e Soltar (Drag & Drop)
1. Abra o formulário de projeto
2. Arraste a imagem para a área de upload
3. Aguarde o upload completar
4. Pronto! A imagem está salva

### Método 2: Clicar e Selecionar
1. Clique na área de upload
2. Selecione a imagem no seu computador
3. Aguarde o upload completar
4. Pronto!

### Método 3: URL Externa (opcional)
1. Cole a URL de uma imagem já hospedada
2. A imagem será carregada do servidor externo

## ✅ Formatos Aceitos

- **JPG/JPEG** - Fotos e imagens complexas
- **PNG** - Imagens com transparência
- **GIF** - Animações
- **WEBP** - Formato moderno e otimizado

## 📏 Limites

- **Tamanho máximo:** 5MB por imagem
- **Dimensões:** Sem limite (mas recomendado max 2000px)
- **Quantidade:** Ilimitada

## 🔄 Gerenciar Imagens

### Trocar Imagem
1. Edite o projeto
2. Clique no **X** na imagem atual
3. Faça upload de uma nova imagem
4. Salve

### Remover Imagem
1. Edite o projeto
2. Clique no **X** na imagem
3. Deixe sem imagem ou adicione outra
4. Salve

### Excluir Projeto
- Ao excluir um projeto, a imagem **permanece** no servidor
- Para limpar espaço, delete manualmente em `uploads/portfolio/`

## 💡 Dicas

### Otimização de Imagens
Antes de fazer upload, otimize suas imagens:

1. **Redimensione:**
   - Largura ideal: 1200-1600px
   - Altura proporcional

2. **Comprima:**
   - Use ferramentas online: TinyPNG, Squoosh
   - Reduza qualidade para 80-85%

3. **Formato:**
   - Fotos: JPG (menor tamanho)
   - Logos/ícones: PNG (transparência)
   - Moderno: WEBP (melhor compressão)

### Organização
- Use nomes descritivos ao salvar localmente
- Mantenha backup das imagens originais
- Organize por projeto/categoria

## 🔒 Segurança

- ✅ Apenas usuários autenticados podem fazer upload
- ✅ Validação de tipo de arquivo (apenas imagens)
- ✅ Validação de tamanho (máx. 5MB)
- ✅ Nomes únicos (evita sobrescrever)

## 🚨 Troubleshooting

### "Erro ao fazer upload"
- Verifique se está logado
- Verifique o tamanho do arquivo (máx. 5MB)
- Verifique o formato (JPG, PNG, GIF, WEBP)
- Tente novamente

### "Imagem não aparece"
- Aguarde o upload completar (barra de progresso)
- Verifique se salvou o projeto
- Recarregue a página

### "Upload muito lento"
- Imagem muito grande (comprima antes)
- Conexão lenta (aguarde)
- Tente redimensionar a imagem

## 📦 Backup

### Fazer Backup das Imagens
```bash
# Copiar pasta uploads
cp -r uploads/portfolio/ backup-portfolio-$(date +%Y%m%d)/
```

### Restaurar Backup
```bash
# Restaurar pasta uploads
cp -r backup-portfolio-20260507/ uploads/portfolio/
```

## 🌐 Deploy

Ao fazer deploy do site:

1. **Copie a pasta uploads:**
   ```bash
   scp -r uploads/ usuario@servidor:/caminho/site/
   ```

2. **Configure permissões:**
   ```bash
   chmod 755 uploads/
   chmod 755 uploads/portfolio/
   chmod 644 uploads/portfolio/*
   ```

3. **Verifique .htaccess:**
   - Certifique-se que permite acesso a `/uploads/`

## 📊 Monitoramento

### Ver Espaço Usado
```bash
# Windows PowerShell
Get-ChildItem uploads/portfolio -Recurse | Measure-Object -Property Length -Sum

# Linux/Mac
du -sh uploads/portfolio/
```

### Listar Imagens
```bash
# Windows PowerShell
Get-ChildItem uploads/portfolio

# Linux/Mac
ls -lh uploads/portfolio/
```

### Limpar Imagens Antigas
```bash
# Cuidado! Isso remove todas as imagens
rm uploads/portfolio/*
```

## 🎯 Boas Práticas

1. **Otimize antes de fazer upload**
   - Redimensione para web
   - Comprima para reduzir tamanho

2. **Use nomes descritivos localmente**
   - Facilita encontrar depois
   - Organize por projeto

3. **Faça backup regularmente**
   - Copie pasta `uploads/` periodicamente
   - Guarde em local seguro

4. **Monitore espaço em disco**
   - Verifique tamanho da pasta
   - Limpe imagens não usadas

5. **Teste antes de publicar**
   - Verifique se imagem carregou
   - Teste em diferentes dispositivos
   - Confirme que está visível

## 📞 Suporte

Para mais informações:
- **Documentação:** docs/PORTFOLIO-ADMIN.md
- **Servidor:** server.js (rota `/api/portfolio/upload`)
- **Frontend:** js/portfolio-admin.js (função `handleFileUpload`)
