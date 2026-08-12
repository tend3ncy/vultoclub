# 🎨 Sistema de Admin do Portfolio Freshzito

## Visão Geral

Sistema de administração **completamente separado** do Vulto Club, permitindo gerenciar o portfolio Freshzito de forma independente.

## 🔐 Credenciais Padrão

### Portfolio Admin
- **Usuário:** `freshzito`
- **Senha:** `fresh2024`

### Vulto Club Admin (separado)
- **Senha:** `vulto2024`

## 📁 Estrutura

```
pages/portfolio/
├── login.html          # Login do portfolio
├── admin.html          # Gerenciar projetos
└── admin-config.html   # Configurações do portfolio

js/
└── portfolio-admin.js  # Lógica do admin

api/portfolio/
├── /login             # Autenticação
├── /logout            # Sair
├── /auth              # Verificar sessão
├── /projects          # CRUD de projetos
└── /config            # Configurações
```

## 🚀 Como Usar

### 1. Acessar o Admin

**Opção 1:** Pelo footer do portfolio
- Acesse http://localhost:3000/freshzito.html
- Clique em "Admin" no footer (link discreto)

**Opção 2:** URL direta
- http://localhost:3000/pages/portfolio/login.html

### 2. Fazer Login

- Usuário: `freshzito`
- Senha: `fresh2024`

### 3. Gerenciar Projetos

**Adicionar Projeto:**
1. Clique em "Novo Projeto"
2. Preencha:
   - Título (ex: "Freshzito Branding")
   - Categoria (ex: "Branding & Identity")
   - Descrição (opcional)
   - **Imagem:** Escolha uma opção:
     - **Upload:** Clique na área de upload ou arraste uma imagem (JPG, PNG, GIF, WEBP - máx. 5MB)
     - **URL Externa:** Cole a URL de uma imagem hospedada online
   - Link do Projeto (opcional)
3. Clique em "Salvar Projeto"

**Editar Projeto:**
- Clique no ícone de lápis no card do projeto
- Modifique os campos
- Para trocar a imagem, clique no X e faça novo upload
- Salve

**Excluir Projeto:**
- Clique no ícone de lixeira
- Confirme a exclusão

### 4. Configurações

Acesse "Configurações" no menu lateral para editar:

**Informações Pessoais:**
- Nome
- Título/Cargo
- Subtítulo
- Bio

**Estatísticas:**
- Anos de experiência
- Projetos realizados
- Seguidores

**Contato:**
- Instagram
- Email
- WhatsApp

**Segurança:**
- Alterar senha

## 🔒 Segurança

### Sessões Independentes
- Portfolio usa cookie `portfolio_session`
- Vulto Club usa cookie `vulto_session`
- Não há interferência entre os sistemas

### Proteção de Rotas
- `/pages/portfolio/admin*.html` - Requer autenticação portfolio
- `/pages/admin/*.html` - Requer autenticação Vulto Club

### Timeout
- Sessões expiram após 4 horas de inatividade

## 🎨 Upload de Imagens

Você tem **duas opções** para adicionar imagens aos projetos:

### Opção 1: Upload Direto (Recomendado)
- Clique na área de upload ou arraste a imagem
- Formatos aceitos: JPG, PNG, GIF, WEBP
- Tamanho máximo: 5MB
- As imagens ficam salvas em `uploads/portfolio/`
- URLs geradas automaticamente: `/uploads/portfolio/nome-arquivo.jpg`

### Opção 2: URL Externa
- Cole a URL de uma imagem hospedada online
- Útil para imagens já hospedadas em outros serviços

### Serviços Externos (opcional):

### Gratuitas:
1. **Imgur** - https://imgur.com
   - Upload simples
   - Copie o link direto da imagem

2. **ImgBB** - https://imgbb.com
   - Sem necessidade de conta
   - Link direto disponível

3. **Cloudinary** - https://cloudinary.com
   - Plano gratuito generoso
   - Otimização automática

### Pagas/Profissionais:
1. **AWS S3** - Armazenamento escalável
2. **Cloudflare R2** - Sem taxas de saída
3. **DigitalOcean Spaces** - Simples e barato

### Como usar:
1. **Upload Direto (Recomendado):**
   - Arraste a imagem para a área de upload
   - Ou clique e selecione o arquivo
   - Aguarde o upload completar
   - Pronto! A URL é gerada automaticamente

2. **URL Externa:**
   - Faça upload da imagem no serviço escolhido
   - Copie a URL direta da imagem
   - Cole no campo "URL Externa"

## � Estrutura de Arquivos

```
uploads/
└── portfolio/          # Imagens do portfolio
    ├── .gitkeep       # Mantém pasta no git
    └── *.jpg/png/gif  # Suas imagens (não versionadas)
```

**Importante:**
- As imagens em `uploads/portfolio/` **não são versionadas** no git
- Faça backup manual das imagens importantes
- Ao fazer deploy, copie a pasta `uploads/` para o servidor

Os dados do portfolio são salvos em `db.json`:

```json
{
  "portfolio": {
    "projects": [
      {
        "id": "1234567890",
        "title": "Freshzito",
        "category": "Branding & Identity",
        "description": "Projeto de branding...",
        "image": "https://exemplo.com/imagem.jpg",
        "link": "https://behance.net/..."
      }
    ],
    "config": {
      "name": "Freshzito",
      "title": "Creative Director & Visual Artist",
      "subtitle": "...",
      "bio": "...",
      "stats": {
        "years": "5+",
        "projects": "50+",
        "followers": "2.2k"
      },
      "contact": {
        "instagram": "https://instagram.com/freshzito__",
        "email": "contato@freshzito.com",
        "whatsapp": ""
      }
    }
  }
}
```

## 🔧 Variáveis de Ambiente

Para alterar as credenciais padrão:

```bash
# Portfolio
PORTFOLIO_USER=seu_usuario PORTFOLIO_PASS=sua_senha node server.js

# Vulto Club (separado)
VULTO_SENHA=sua_senha node server.js

# Ambos
PORTFOLIO_USER=usuario PORTFOLIO_PASS=senha VULTO_SENHA=vulto node server.js
```

## 🌐 URLs Importantes

### Portfolio Público
- http://localhost:3000/freshzito.html

### Portfolio Admin
- http://localhost:3000/pages/portfolio/login.html
- http://localhost:3000/pages/portfolio/admin.html
- http://localhost:3000/pages/portfolio/admin-config.html

### Vulto Club Admin (separado)
- http://localhost:3000/pages/login.html
- http://localhost:3000/pages/admin/admin.html

## 🎯 Próximos Passos

1. **Testar o sistema:**
   ```bash
   node server.js
   ```

2. **Fazer login:**
   - Acesse http://localhost:3000/pages/portfolio/login.html
   - Use: freshzito / fresh2024

3. **Adicionar projetos:**
   - Hospede suas imagens online
   - Adicione os projetos no admin

4. **Personalizar:**
   - Configure suas informações em "Configurações"
   - Altere a senha padrão

## ⚠️ Importante

- **Sistemas Separados:** Portfolio e Vulto Club são completamente independentes
- **Credenciais Diferentes:** Cada sistema tem suas próprias credenciais
- **Dados Separados:** Projetos do portfolio não aparecem no Vulto Club
- **Sessões Independentes:** Você pode estar logado em um e não no outro

## 🆘 Troubleshooting

**Não consigo fazer login:**
- Verifique se está usando as credenciais corretas
- Usuário: `freshzito` (não `admin`)
- Senha: `fresh2024` (não `vulto2024`)

**Imagens não aparecem:**
- Verifique se a URL da imagem está correta
- Teste a URL no navegador
- Use URLs diretas (terminam em .jpg, .png, etc)

**Erro ao salvar:**
- Verifique se está logado
- Verifique a conexão com o servidor
- Veja o console do navegador (F12)

## 📞 Suporte

Para mais informações, consulte:
- README.md - Documentação geral
- TESTE-REFERENCIAS.md - Guia de testes
- server.js - Código do servidor
