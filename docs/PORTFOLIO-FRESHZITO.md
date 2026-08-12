# Sistema de Portfolio - Freshzito

## Acesso ao Admin

**URL de Login:** `/portfolio/login` ou `seusite.com/portfolio/login`

**Credenciais Padrão:**
- Usuário: `freshzito`
- Senha: `fresh2026`

⚠️ **IMPORTANTE:** Altere essas credenciais em produção editando o arquivo `api/portfolio-login.php`

## URLs do Sistema

- **Portfolio Público:** `/freshzito` ou `seusite.com/freshzito`
- **Login Admin:** `/portfolio/login`
- **Painel Admin:** `/portfolio/admin`
- **Configurações:** `/portfolio/config`

### APIs
- `POST /api/portfolio/login` - Fazer login
- `GET /api/portfolio/auth` - Verificar autenticação
- `GET /api/portfolio/logout` - Fazer logout
- `GET /api/portfolio/projects` - Listar projetos
- `POST /api/portfolio/projects` - Criar projeto
- `PUT /api/portfolio/projects/{id}` - Atualizar projeto
- `DELETE /api/portfolio/projects/{id}` - Deletar projeto
- `POST /api/portfolio/upload` - Upload de imagem

### Estrutura do Banco (db.json)

```json
{
  "portfolio": {
    "projects": [
      {
        "id": "proj_xxxxx",
        "title": "Nome do Projeto",
        "category": "Categoria",
        "description": "Descrição opcional",
        "image": "/uploads/portfolio/imagem.jpg",
        "link": "https://behance.net/...",
        "createdAt": "2026-05-07 12:00:00"
      }
    ]
  }
}
```

## Como Usar

1. Acesse `/pages/portfolio/login.html`
2. Faça login com as credenciais
3. Gerencie seus projetos no painel admin
4. Faça upload de imagens ou use URLs externas
5. Os projetos aparecem automaticamente em `freshzito.html`

## Upload de Imagens

As imagens são salvas em `/uploads/portfolio/` e ficam acessíveis via URL:
`/uploads/portfolio/portfolio_xxxxx.jpg`

## Segurança

- Todas as rotas de modificação (POST, PUT, DELETE) requerem autenticação
- A sessão é gerenciada via PHP sessions
- Altere as credenciais padrão em produção!
