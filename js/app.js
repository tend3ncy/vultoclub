// ─── API ──────────────────────────────────────────────────────────────────────
async function getProducts() {
  try {
    const res = await fetch('/api/products');
    return await res.json();
  } catch { return []; }
}

async function addProduct(data) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updateProduct(id, data) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteProduct(id) {
  await fetch(`/api/products/${id}`, { method: 'DELETE' });
}

function getCategories(products) {
  return [...new Set(products.map(p => p.category).filter(Boolean))];
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatPrice(val) {
  return 'R$ ' + parseFloat(val).toFixed(2).replace('.', ',');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── STORE RENDER ─────────────────────────────────────────────────────────────
let _allProducts = [];

async function initStore() {
  _allProducts = await getProducts();
  renderStore('todos');
}

function renderStore(filterCat = 'todos') {
  const grid = document.getElementById('products-grid');
  const empty = document.getElementById('empty-state');
  const countEl = document.getElementById('products-count');
  if (!grid) return;

  const filtered = filterCat === 'todos' ? _allProducts : _allProducts.filter(p => p.category === filterCat);

  if (countEl) countEl.textContent = filtered.length + ' produto' + (filtered.length !== 1 ? 's' : '');

  if (_allProducts.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
    renderFilters('todos');
    return;
  }

  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  renderFilters(filterCat);

  grid.innerHTML = filtered.map(p => {
    const mainImg = p.images && p.images.length > 0 ? p.images[0] : (p.image || '');
    const estoqueItem = window.vultoEstoque ? window.vultoEstoque.get(p.id) : null;
    const is1x1 = estoqueItem && estoqueItem.tipo === '1:1';
    const esgotado = estoqueItem && estoqueItem.quantidade <= 0;
    return `
    <div class="product-card fade-in ${esgotado ? 'esgotado' : ''}" onclick="openModal('${escHtml(p.id)}')">
      <div class="product-img">
        ${mainImg
          ? `<img src="${escHtml(mainImg)}" alt="${escHtml(p.name)}" loading="lazy" />`
          : `<div class="product-placeholder">VULTO</div>`}
        ${is1x1 ? `<span class="product-badge badge-drop">1:1</span>` : p.isNew ? `<span class="product-badge">NOVO</span>` : p.isFeatured ? `<span class="product-badge">DESTAQUE</span>` : ''}
        ${esgotado ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;"><span style="font-size:0.7rem;letter-spacing:0.2em;font-weight:700;color:#6b7280;">ESGOTADO</span></div>` : ''}
      </div>
      <div class="product-info" data-produto-id="${escHtml(p.id)}">
        <h3>${escHtml(p.name)}</h3>
        <span class="product-price">${formatPrice(p.price)}</span>
        <div class="stock-counter"></div>
      </div>
    </div>
  `}).join('');

  requestAnimationFrame(() => {
    grid.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 60);
    });
  });
}

function renderFilters(active) {
  const wrap = document.getElementById('filters');
  if (!wrap) return;
  const cats = getCategories(_allProducts);
  wrap.innerHTML =
    `<button class="filter-btn ${active === 'todos' ? 'active' : ''}" onclick="renderStore('todos')">TODOS</button>` +
    cats.map(c => `<button class="filter-btn ${active === c ? 'active' : ''}" onclick="renderStore('${escHtml(c)}')">${escHtml(c.toUpperCase())}</button>`).join('');
}

// ─── MODAL PRODUTO ────────────────────────────────────────────────────────────
let _currentProduct = null;
let _currentImageIndex = 0;
let _selectedSize = null;

function openModal(id) {
  const p = _allProducts.find(x => x.id === id);
  if (!p) return;
  _currentProduct = p;
  _currentImageIndex = 0;
  _selectedSize = null;
  
  document.getElementById('modal-cat').textContent = p.category || '';
  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-desc').textContent = p.description || 'Sem descrição.';
  document.getElementById('modal-price').textContent = formatPrice(p.price);
  
  // Mostra seletor de tamanho se for roupa
  const sizeSelector = document.getElementById('size-selector');
  const isClothing = ['camiseta', 'camisa', 'blusa', 'moletom', 'jaqueta', 'calça', 'shorts'].some(
    type => (p.category || '').toLowerCase().includes(type) || (p.name || '').toLowerCase().includes(type)
  );
  
  if (isClothing) {
    sizeSelector.style.display = 'block';
    // Remove seleção anterior
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.onclick = () => selectSize(btn.dataset.size);
    });
  } else {
    sizeSelector.style.display = 'none';
  }
  
  renderModalImages();
  
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Analytics: view_item
  if (typeof gtag !== 'undefined') {
    gtag('event', 'view_item', {
      currency: 'BRL',
      value: p.price,
      items: [{ item_id: p.id, item_name: p.name, price: p.price }]
    });
  }
}

function selectSize(size) {
  _selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
}

function renderModalImages() {
  const imgEl = document.getElementById('modal-img');
  const images = _currentProduct.images && _currentProduct.images.length > 0 
    ? _currentProduct.images 
    : (_currentProduct.image ? [_currentProduct.image] : []);
  
  if (images.length === 0) {
    imgEl.innerHTML = `<div class="modal-img-placeholder">VULTO</div>`;
    return;
  }
  
  const hasMultiple = images.length > 1;
  
  imgEl.innerHTML = `
    <div class="modal-carousel">
      <img src="${escHtml(images[_currentImageIndex])}" alt="${escHtml(_currentProduct.name)}" />
      ${hasMultiple ? `
        <button class="carousel-btn carousel-prev" onclick="prevImage()">‹</button>
        <button class="carousel-btn carousel-next" onclick="nextImage()">›</button>
        <div class="carousel-dots">
          ${images.map((_, i) => `
            <span class="dot ${i === _currentImageIndex ? 'active' : ''}" onclick="goToImage(${i})"></span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function nextImage() {
  const images = _currentProduct.images || [_currentProduct.image];
  _currentImageIndex = (_currentImageIndex + 1) % images.length;
  renderModalImages();
}

function prevImage() {
  const images = _currentProduct.images || [_currentProduct.image];
  _currentImageIndex = (_currentImageIndex - 1 + images.length) % images.length;
  renderModalImages();
}

function goToImage(idx) {
  _currentImageIndex = idx;
  renderModalImages();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  _currentProduct = null;
  _currentImageIndex = 0;
  _selectedSize = null;
}

function buyProduct() {
  if (!_currentProduct) return;
  
  // Verifica se precisa de tamanho
  const sizeSelector = document.getElementById('size-selector');
  if (sizeSelector.style.display !== 'none' && !_selectedSize) {
    alert('Por favor, selecione um tamanho');
    return;
  }

  // Verifica estoque
  const estoqueItem = window.vultoEstoque ? window.vultoEstoque.get(_currentProduct.id) : null;
  if (estoqueItem && estoqueItem.quantidade <= 0) {
    alert('Produto esgotado!');
    return;
  }

  // Adiciona ao carrinho
  const itemId = _selectedSize ? `${_currentProduct.id}-${_selectedSize}` : _currentProduct.id;
  const mainImg = _currentProduct.images && _currentProduct.images.length > 0 
    ? _currentProduct.images[0] 
    : (_currentProduct.image || '');

  const cartItem = {
    id: itemId,
    productId: _currentProduct.id,
    name: _currentProduct.name,
    price: _currentProduct.price,
    image: mainImg,
    size: _selectedSize || null,
    qty: 1
  };

  // Salva direto pro checkout
  localStorage.setItem('vulto_checkout', JSON.stringify([cartItem]));
  localStorage.setItem('vulto_checkout_cupom', '');
  localStorage.setItem('vulto_checkout_desconto', '0');

  // Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'begin_checkout', {
      currency: 'BRL',
      value: _currentProduct.price,
      items: [{ item_id: _currentProduct.id, item_name: _currentProduct.name, price: _currentProduct.price }]
    });
  }

  // Vai pro checkout
  window.location.href = '/pages/checkout.html';
}

// Init na página da loja
if (document.getElementById('products-grid')) {
  initStore();
  loadHeroVideo();
}

// ─── HERO VIDEO ───────────────────────────────────────────────────────────────
async function loadHeroVideo() {
  const videoEl = document.getElementById('hero-video');
  if (!videoEl) return;
  
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.heroVideo) {
      videoEl.src = data.heroVideo;
      videoEl.addEventListener('loadeddata', () => {
        videoEl.classList.add('loaded');
      });
    }
  } catch {}
}


// ─── CARRINHO ─────────────────────────────────────────────────────────────────
let _cart = [];
let _appliedCoupon = null;

function loadCart() {
  // Não carrega mais do localStorage - carrinho sempre vazio ao recarregar
  _cart = [];
  
  const savedCoupon = localStorage.getItem('vulto_coupon');
  if (savedCoupon) {
    _appliedCoupon = JSON.parse(savedCoupon);
  }
}

function saveCart() {
  // Não salva mais no localStorage - carrinho temporário apenas
  updateCartUI();
}

function addToCart() {
  if (!_currentProduct) return;
  
  // Verifica se precisa de tamanho
  const sizeSelector = document.getElementById('size-selector');
  if (sizeSelector.style.display !== 'none' && !_selectedSize) {
    alert('Por favor, selecione um tamanho');
    return;
  }
  
  const itemId = _selectedSize ? `${_currentProduct.id}-${_selectedSize}` : _currentProduct.id;
  const existing = _cart.find(item => item.id === itemId);
  
  if (existing) {
    existing.qty++;
  } else {
    const mainImg = _currentProduct.images && _currentProduct.images.length > 0 
      ? _currentProduct.images[0] 
      : (_currentProduct.image || '');
    _cart.push({
      id: itemId,
      productId: _currentProduct.id,
      name: _currentProduct.name,
      price: _currentProduct.price,
      image: mainImg,
      size: _selectedSize || null,
      qty: 1
    });
  }
  
  // Google Analytics Event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'add_to_cart', {
      currency: 'BRL',
      value: _currentProduct.price,
      items: [{
        item_id: _currentProduct.id,
        item_name: _currentProduct.name,
        item_variant: _selectedSize || '',
        price: _currentProduct.price,
        quantity: 1
      }]
    });
  }
  
  saveCart();
  closeModal();
  
  // Feedback visual
  const btn = document.getElementById('cart-float');
  btn.style.transform = 'scale(1.2)';
  setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function removeFromCart(id) {
  _cart = _cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
}

function updateQty(id, delta) {
  const item = _cart.find(i => i.id === id);
  if (!item) return;
  
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    renderCart();
  }
}

function updateCartUI() {
  const count = _cart.reduce((sum, item) => sum + item.qty, 0);
  const floatBtn = document.getElementById('cart-float');
  const countEl = document.getElementById('cart-count');
  
  if (count > 0) {
    floatBtn.style.display = 'flex';
    countEl.textContent = count;
  } else {
    floatBtn.style.display = 'none';
  }
}

function openCart() {
  renderCart();
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  const body = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  
  if (_cart.length === 0) {
    body.innerHTML = '<p class="cart-empty">Seu carrinho está vazio</p>';
    footer.style.display = 'none';
    return;
  }
  
  const subtotal = _cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discount = 0;
  
  if (_appliedCoupon) {
    if (_appliedCoupon.type === 'percentage') {
      discount = subtotal * (_appliedCoupon.value / 100);
    } else {
      discount = _appliedCoupon.value;
    }
    
    // Remove cupom se desconto ultrapassar o valor total
    if (discount >= subtotal) {
      _appliedCoupon = null;
      localStorage.removeItem('vulto_coupon');
      discount = 0;
      
      const msgEl = document.getElementById('coupon-message');
      if (msgEl) {
        msgEl.textContent = 'Cupom removido: desconto maior que o valor total';
        msgEl.className = 'coupon-message error';
        msgEl.style.display = 'block';
        setTimeout(() => {
          msgEl.style.display = 'none';
        }, 3000);
      }
    }
  }
  
  const total = subtotal - discount;
  
  body.innerHTML = _cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image ? `<img src="${escHtml(item.image)}" alt="${escHtml(item.name)}" />` : '<span>—</span>'}
      </div>
      <div class="cart-item-info">
        <h4>${escHtml(item.name)}</h4>
        ${item.size ? `<span class="cart-item-size">Tamanho: ${escHtml(item.size)}</span>` : ''}
        <span class="cart-item-price">${formatPrice(item.price)}</span>
      </div>
      <div class="cart-item-qty">
        <button onclick="updateQty('${escHtml(item.id)}', -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="updateQty('${escHtml(item.id)}', 1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${escHtml(item.id)}')">✕</button>
    </div>
  `).join('');
  
  document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('cart-total').textContent = formatPrice(total);
  
  const discountEl = document.getElementById('cart-discount');
  if (_appliedCoupon && discount > 0) {
    discountEl.style.display = 'flex';
    document.getElementById('discount-value').textContent = '- ' + formatPrice(discount);
  } else {
    discountEl.style.display = 'none';
  }
  
  footer.style.display = 'block';
}

function checkout() {
  if (_cart.length === 0) return;
  
  const subtotal = _cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discount = 0;
  
  if (_appliedCoupon) {
    if (_appliedCoupon.type === 'percentage') {
      discount = subtotal * (_appliedCoupon.value / 100);
    } else {
      discount = _appliedCoupon.value;
    }
  }

  // Salva carrinho para a página de checkout
  localStorage.setItem('vulto_checkout', JSON.stringify(_cart));
  localStorage.setItem('vulto_checkout_cupom', _appliedCoupon ? _appliedCoupon.code : '');
  localStorage.setItem('vulto_checkout_desconto', discount.toString());

  // Redireciona para o checkout
  window.location.href = '/pages/checkout.html';
}

// Carrega carrinho ao iniciar
if (document.getElementById('products-grid')) {
  loadCart();
}

// ─── CUPONS ───────────────────────────────────────────────────────────────────
async function applyCoupon() {
  const input = document.getElementById('coupon-code');
  const code = input.value.trim().toUpperCase();
  const msgEl = document.getElementById('coupon-message');
  
  if (!code) {
    msgEl.textContent = 'Digite um código de cupom';
    msgEl.className = 'coupon-message error';
    msgEl.style.display = 'block';
    return;
  }
  
  try {
    const res = await fetch(`/api/coupons.php?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    
    if (data.error) {
      msgEl.textContent = data.error;
      msgEl.className = 'coupon-message error';
      msgEl.style.display = 'block';
      _appliedCoupon = null;
      localStorage.removeItem('vulto_coupon');
      renderCart();
      return;
    }
    
    // Valida se o desconto não ultrapassa o valor total
    const subtotal = _cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discount = 0;
    
    if (data.type === 'percentage') {
      discount = subtotal * (data.value / 100);
    } else {
      discount = data.value;
    }
    
    if (discount >= subtotal) {
      msgEl.textContent = 'Desconto não pode ser maior ou igual ao valor total';
      msgEl.className = 'coupon-message error';
      msgEl.style.display = 'block';
      _appliedCoupon = null;
      localStorage.removeItem('vulto_coupon');
      renderCart();
      return;
    }
    
    _appliedCoupon = data;
    localStorage.setItem('vulto_coupon', JSON.stringify(data));
    
    const discountText = data.type === 'percentage' 
      ? `${data.value}% de desconto` 
      : `R$ ${data.value.toFixed(2).replace('.', ',')} de desconto`;
    
    msgEl.innerHTML = `Cupom "${data.code}" aplicado! ${discountText} <button onclick="removeCoupon()" style="margin-left: 10px; padding: 2px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; cursor: pointer; font-size: 0.75rem;">REMOVER</button>`;
    msgEl.className = 'coupon-message success';
    msgEl.style.display = 'block';
    
    input.value = '';
    renderCart();
    
  } catch (error) {
    msgEl.textContent = 'Erro ao validar cupom';
    msgEl.className = 'coupon-message error';
    msgEl.style.display = 'block';
  }
}

function removeCoupon() {
  _appliedCoupon = null;
  localStorage.removeItem('vulto_coupon');
  
  const msgEl = document.getElementById('coupon-message');
  msgEl.style.display = 'none';
  
  const input = document.getElementById('coupon-code');
  input.value = '';
  
  renderCart();
}
