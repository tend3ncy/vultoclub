# 🎨 Guia de Componentes UI

## Como Usar

### 1. Incluir os arquivos

Adicione no `<head>` das suas páginas:

```html
<link rel="stylesheet" href="/css/ui-components.css">
<script src="/js/ui-components.js"></script>
```

---

## 📢 Toast Notifications

Substitua `alert()` por toasts elegantes:

### Exemplos:

```javascript
// Sucesso
Toast.success('Produto salvo com sucesso!');

// Erro
Toast.error('Erro ao salvar produto');

// Aviso
Toast.warning('Preencha todos os campos obrigatórios');

// Informação
Toast.info('Carregando dados...');

// Personalizado
Toast.show('Mensagem personalizada', 'Título', 'success');
```

### Antes e Depois:

```javascript
// ❌ ANTES
alert('Produto salvo!');

// ✅ DEPOIS
Toast.success('Produto salvo com sucesso!');
```

---

## ⏳ Loading States

### Loading Overlay (tela cheia):

```javascript
// Mostrar
Loading.show('Salvando produto...');

// Esconder
Loading.hide();

// Exemplo completo
async function salvarProduto() {
    Loading.show('Salvando...');
    try {
        await fetch('/api/products', { method: 'POST', ... });
        Toast.success('Produto salvo!');
    } catch (error) {
        Toast.error('Erro ao salvar');
    } finally {
        Loading.hide();
    }
}
```

### Loading em Botões:

```javascript
const btn = document.getElementById('meu-botao');

// Ativar loading
setButtonLoading(btn, true);

// Desativar loading
setButtonLoading(btn, false);

// Exemplo completo
async function handleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    
    setButtonLoading(btn, true);
    try {
        await salvarDados();
        Toast.success('Salvo!');
    } finally {
        setButtonLoading(btn, false);
    }
}
```

---

## ✅ Confirmações Elegantes

Substitua `confirm()` por diálogos bonitos:

### Confirmação Simples:

```javascript
const confirmed = await Confirm.show({
    title: 'Confirmar ação',
    message: 'Tem certeza que deseja continuar?',
    confirmText: 'Sim',
    cancelText: 'Não'
});

if (confirmed) {
    // Usuário confirmou
}
```

### Confirmação de Exclusão:

```javascript
const confirmed = await Confirm.delete('este produto');

if (confirmed) {
    // Excluir produto
}
```

### Tipos de Confirmação:

```javascript
// Perigo (vermelho) - padrão para exclusões
await Confirm.show({
    type: 'danger',
    title: 'Excluir item',
    message: 'Esta ação não pode ser desfeita'
});

// Aviso (amarelo)
await Confirm.show({
    type: 'warning',
    title: 'Atenção',
    message: 'Você tem alterações não salvas'
});

// Informação (azul)
await Confirm.show({
    type: 'info',
    title: 'Informação',
    message: 'Deseja continuar?',
    confirmClass: 'primary' // Botão azul em vez de vermelho
});
```

### Antes e Depois:

```javascript
// ❌ ANTES
if (confirm('Excluir produto?')) {
    deletarProduto();
}

// ✅ DEPOIS
const confirmed = await Confirm.delete('este produto');
if (confirmed) {
    deletarProduto();
}
```

---

## 🖼️ Preview de Imagens

```javascript
const fileInput = document.getElementById('imagem');
const previewContainer = document.getElementById('preview');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            await createImagePreview(file, previewContainer);
        } catch (error) {
            Toast.error('Erro ao carregar imagem');
        }
    }
});
```

---

## 📝 Exemplo Completo

```javascript
// Formulário de produto
const form = document.getElementById('product-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const title = document.getElementById('title').value;
    
    // Validação
    if (!title) {
        Toast.warning('Preencha o título do produto');
        return;
    }
    
    // Loading no botão
    setButtonLoading(submitBtn, true);
    
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        
        if (res.ok) {
            Toast.success('Produto criado com sucesso!');
            form.reset();
        } else {
            Toast.error('Erro ao criar produto');
        }
    } catch (error) {
        Toast.error('Erro de conexão');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Botão de excluir
async function handleDelete(productId, productName) {
    const confirmed = await Confirm.delete(productName);
    
    if (confirmed) {
        Loading.show('Excluindo...');
        
        try {
            await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            Toast.success('Produto excluído!');
            recarregarLista();
        } catch (error) {
            Toast.error('Erro ao excluir');
        } finally {
            Loading.hide();
        }
    }
}
```

---

## 🎯 Dicas

1. **Sempre use Toast em vez de alert()**
2. **Use Loading.show() para operações assíncronas**
3. **Use Confirm para ações destrutivas**
4. **Use setButtonLoading() para feedback visual em botões**
5. **Sempre use try/finally para garantir que Loading.hide() seja chamado**

---

## 🎨 Personalização

Os componentes usam CSS moderno e podem ser personalizados editando `css/ui-components.css`.

Cores principais:
- Sucesso: `#10b981` (verde)
- Erro: `#ef4444` (vermelho)
- Aviso: `#f59e0b` (amarelo)
- Info: `#3b82f6` (azul)
