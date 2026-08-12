// ─── CUPONS ADMIN ─────────────────────────────────────────────────────────────

async function getCoupons() {
  const db = await fetch('db.json').then(r => r.json());
  return db.coupons || [];
}

async function renderCoupons() {
  const tbody = document.getElementById('coupons-tbody');
  const empty = document.getElementById('coupons-empty');
  const coupons = await getCoupons();

  const stats = document.getElementById('sidebar-stats');
  if (stats) {
    const active = coupons.filter(c => c.active).length;
    stats.innerHTML = `
      <div class="stat-item"><span>${coupons.length}</span>Total de Cupons</div>
      <div class="stat-item"><span>${active}</span>Ativos</div>
    `;
  }

  if (coupons.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = coupons.map(c => {
    const typeText = c.type === 'percentage' ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`;
    const statusBadge = c.active 
      ? '<span class="badge-feat">ATIVO</span>' 
      : '<span class="badge-inactive">INATIVO</span>';
    
    const expiry = c.expiry ? new Date(c.expiry).toLocaleDateString('pt-BR') : '—';
    const usage = c.usageLimit > 0 
      ? `${c.usageCount || 0}/${c.usageLimit}` 
      : `${c.usageCount || 0}/∞`;

    return `
    <tr>
      <td><strong>${escHtml(c.code)}</strong></td>
      <td>${c.type === 'percentage' ? 'Porcentagem' : 'Valor Fixo'}</td>
      <td>${typeText}</td>
      <td>${statusBadge}</td>
      <td>${expiry}</td>
      <td>${usage}</td>
      <td>
        <div class="td-actions">
          <button class="btn-edit" onclick="openCouponForm('${escHtml(c.id)}')">Editar</button>
          <button class="btn-del" onclick="confirmDeleteCoupon('${escHtml(c.id)}')">Remover</button>
        </div>
      </td>
    </tr>
  `}).join('');
}

// ─── FORM ─────────────────────────────────────────────────────────────────────

async function openCouponForm(id = null) {
  const form = document.getElementById('coupon-form');
  form.reset();
  
  document.getElementById('coupon-form-title').textContent = id ? 'Editar Cupom' : 'Novo Cupom';
  document.getElementById('btn-save-coupon').textContent = id ? 'SALVAR ALTERAÇÕES' : 'SALVAR CUPOM';
  document.getElementById('coupon-field-id').value = id || '';

  if (id) {
    const coupons = await getCoupons();
    const c = coupons.find(x => x.id === id);
    if (!c) return;
    
    document.getElementById('coupon-field-code').value = c.code;
    document.getElementById('coupon-field-type').value = c.type;
    document.getElementById('coupon-field-value').value = c.value;
    document.getElementById('coupon-field-expiry').value = c.expiry || '';
    document.getElementById('coupon-field-limit').value = c.usageLimit || 0;
    document.getElementById('coupon-field-active').checked = c.active;
  }

  document.getElementById('coupon-form-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('coupon-field-code').focus();
}

function closeCouponForm() {
  document.getElementById('coupon-form-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function saveCoupon(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-coupon');
  btn.disabled = true;
  btn.textContent = 'SALVANDO...';

  const id = document.getElementById('coupon-field-id').value;
  
  const data = {
    code: document.getElementById('coupon-field-code').value.trim().toUpperCase(),
    type: document.getElementById('coupon-field-type').value,
    value: parseFloat(document.getElementById('coupon-field-value').value),
    expiry: document.getElementById('coupon-field-expiry').value || null,
    usageLimit: parseInt(document.getElementById('coupon-field-limit').value) || 0,
    active: document.getElementById('coupon-field-active').checked
  };

  try {
    if (id) {
      data.id = id;
      await fetch('api/coupons.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('api/coupons.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    closeCouponForm();
    await renderCoupons();
  } catch (error) {
    alert('Erro ao salvar cupom');
    btn.disabled = false;
    btn.textContent = id ? 'SALVAR ALTERAÇÕES' : 'SALVAR CUPOM';
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

let pendingDeleteCouponId = null;

function confirmDeleteCoupon(id) {
  pendingDeleteCouponId = id;
  document.getElementById('coupon-confirm-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCouponConfirm() {
  pendingDeleteCouponId = null;
  document.getElementById('coupon-confirm-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function doDeleteCoupon() {
  if (pendingDeleteCouponId) {
    await fetch(`api/coupons.php?id=${pendingDeleteCouponId}`, { method: 'DELETE' });
    closeCouponConfirm();
    await renderCoupons();
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', renderCoupons);
