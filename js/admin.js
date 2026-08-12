// ─── ADMIN RENDER ────────────────────────────────────────────────────────────
async function renderAdmin() {
  const tbody = document.getElementById('admin-tbody');
  const empty = document.getElementById('admin-empty');
  const products = await getProducts();

  const stats = document.getElementById('sidebar-stats');
  if (stats) {
    stats.innerHTML = `
      <div class="stat-item"><span>${products.length}</span>Produtos</div>
      <div class="stat-item"><span>${getCategories(products).length}</span>Categorias</div>
    `;
  }

  if (products.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = products.map(p => {
    const mainImg = p.images && p.images.length > 0 ? p.images[0] : (p.image || '');
    return `
    <tr>
      <td>
        <div class="table-img">
          ${mainImg ? `<img src="${escHtml(mainImg)}" alt="${escHtml(p.name)}" />` : `<span>—</span>`}
        </div>
      </td>
      <td class="td-name">${escHtml(p.name)}</td>
      <td><span class="td-cat">${escHtml(p.category || '—')}</span></td>
      <td>${formatPrice(p.price)}</td>
      <td>
        ${p.isNew ? '<span class="badge-new">NOVO</span>' : ''}
        ${p.isFeatured ? '<span class="badge-feat">DESTAQUE</span>' : ''}
        ${!p.isNew && !p.isFeatured ? '—' : ''}
      </td>
      <td>
        <div class="td-actions">
          <button class="btn-edit" onclick="openForm('${escHtml(p.id)}')">Editar</button>
          <button class="btn-del" onclick="confirmDelete('${escHtml(p.id)}')">Remover</button>
        </div>
      </td>
    </tr>
  `}).join('');

  updateCatDatalist(products);
}

async function updateCatDatalist(products) {
  if (!products) products = await getProducts();
  const dl = document.getElementById('cat-datalist');
  if (!dl) return;
  dl.innerHTML = getCategories(products).map(c => `<option value="${escHtml(c)}">`).join('');
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
let currentImages = [];

async function openForm(id = null) {
  const form = document.getElementById('product-form');
  form.reset();
  currentImages = [];
  renderImagesGrid();
  document.getElementById('form-title').textContent = id ? 'Editar Produto' : 'Novo Produto';
  document.getElementById('btn-save').textContent = id ? 'SALVAR ALTERAÇÕES' : 'SALVAR PRODUTO';
  document.getElementById('field-id').value = id || '';

  if (id) {
    const products = await getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('field-name').value = p.name;
    document.getElementById('field-category').value = p.category || '';
    document.getElementById('field-price').value = p.price;
    document.getElementById('field-desc').value = p.description || '';
    document.getElementById('field-badge').checked = !!p.isFeatured;
    document.getElementById('field-new').checked = !!p.isNew;
    
    // Carrega imagens (novo formato ou legado)
    if (p.images && p.images.length > 0) {
      currentImages = p.images.map(img => ({ url: img, isFeatured: false }));
      if (currentImages.length > 0) currentImages[0].isFeatured = true;
    } else if (p.image) {
      currentImages = [{ url: p.image, isFeatured: true }];
    }
    renderImagesGrid();
  }

  await updateCatDatalist();
  document.getElementById('form-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-name').focus();
}

function closeForm() {
  document.getElementById('form-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'SALVANDO...';

  const id = document.getElementById('field-id').value;
  
  // Ordena imagens: destaque primeiro
  const sortedImages = [...currentImages].sort((a, b) => b.isFeatured - a.isFeatured);
  
  const data = {
    name: document.getElementById('field-name').value.trim(),
    category: document.getElementById('field-category').value.trim(),
    price: parseFloat(document.getElementById('field-price').value),
    description: document.getElementById('field-desc').value.trim(),
    isFeatured: document.getElementById('field-badge').checked,
    isNew: document.getElementById('field-new').checked,
    images: sortedImages.map(img => img.url),
    image: sortedImages.length > 0 ? sortedImages[0].url : '', // Compatibilidade
  };

  if (id) {
    await updateProduct(id, data);
  } else {
    await addProduct(data);
  }

  closeForm();
  await renderAdmin();
}

// ─── IMAGE ────────────────────────────────────────────────────────────────────
function addImageToProduct(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      currentImages.push({ url: ev.target.result, isFeatured: currentImages.length === 0 });
      renderImagesGrid();
    };
    reader.readAsDataURL(file);
  });
  
  e.target.value = '';
}

function addImageUrl(e) {
  const url = e.target.value.trim();
  if (!url) return;
  
  currentImages.push({ url, isFeatured: currentImages.length === 0 });
  renderImagesGrid();
  e.target.value = '';
}

function renderImagesGrid() {
  const grid = document.getElementById('images-grid');
  const addCard = `
    <div class="add-image-card" onclick="document.getElementById('add-img-file').click()">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Adicionar Imagem</span>
    </div>
  `;
  
  const imageCards = currentImages.map((img, idx) => `
    <div class="image-card ${img.isFeatured ? 'featured' : ''}">
      <img src="${escHtml(img.url)}" alt="Imagem ${idx + 1}" />
      <div class="image-card-actions">
        <button type="button" class="btn-star ${img.isFeatured ? 'active' : ''}" 
                onclick="setFeaturedImage(${idx})" title="Imagem destaque">
          ★
        </button>
        <button type="button" class="btn-remove" onclick="removeImage(${idx})" title="Remover">
          ✕
        </button>
      </div>
      ${img.isFeatured ? '<span class="featured-badge">DESTAQUE</span>' : ''}
    </div>
  `).join('');
  
  grid.innerHTML = imageCards + addCard;
}

function setFeaturedImage(idx) {
  currentImages.forEach((img, i) => img.isFeatured = i === idx);
  renderImagesGrid();
}

function removeImage(idx) {
  currentImages.splice(idx, 1);
  if (currentImages.length > 0 && !currentImages.some(img => img.isFeatured)) {
    currentImages[0].isFeatured = true;
  }
  renderImagesGrid();
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
let pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('confirm-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  pendingDeleteId = null;
  document.getElementById('confirm-overlay').classList.remove('open');
  // Não restaura o overflow se o form ainda estiver aberto
  const formOpen = document.getElementById('form-overlay').classList.contains('open');
  if (!formOpen) {
    document.body.style.overflow = '';
  }
}

async function doDelete() {
  if (pendingDeleteId) {
    await deleteProduct(pendingDeleteId);
    closeConfirm();
    closeForm(); // Fecha o form também
    await renderAdmin();
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', renderAdmin);
