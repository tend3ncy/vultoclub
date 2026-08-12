// Carrega eventos da API
async function loadEventos() {
  try {
    const res = await fetch('api/eventos');
    const data = await res.json();
    renderGaleria(data.passados || []);
    renderProximos(data.proximos || []);
  } catch {
    renderGaleria([]);
    renderProximos([]);
  }
}

// Renderiza galeria
function renderGaleria(eventos) {
  const grid = document.getElementById('galeria-grid');
  if (eventos.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:#444">Nenhum evento cadastrado ainda.</div>';
    return;
  }
  grid.innerHTML = eventos.map((e, i) => {
    const hasLink = e.link && e.link.trim();
    const onclick = hasLink
      ? `window.open('${e.link}', '_blank')`
      : `openModal('${e.img}')`;
    return `
    <div class="galeria-item" onclick="${onclick}" style="cursor:pointer">
      <img src="${e.img}" alt="${e.titulo}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x600/111/666?text=${encodeURIComponent(e.titulo)}'" />
      <div class="galeria-item-overlay">
        <div class="galeria-item-title">${escHtml(e.titulo)}</div>
        <div class="galeria-item-date">${escHtml(e.data)}</div>
        ${hasLink ? '<div style="font-size:0.6rem;margin-top:0.3rem;opacity:0.7;">↗ Ver no Instagram</div>' : ''}
      </div>
    </div>
  `}).join('');
}

// Renderiza próximos eventos
function renderProximos(eventos) {
  const grid = document.getElementById('proximos-grid');
  const empty = document.getElementById('proximos-empty');
  
  if (eventos.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  empty.style.display = 'none';
  grid.innerHTML = eventos.map(e => `
    <div class="proximo-card">
      <div class="proximo-date">${escHtml(e.data)}</div>
      <div class="proximo-title">${escHtml(e.titulo)}</div>
      <div class="proximo-local">📍 ${escHtml(e.local)}</div>
      <div class="proximo-desc">${escHtml(e.desc)}</div>
    </div>
  `).join('');
}

// Modal
function openModal(src) {
  document.getElementById('modal-img').src = src;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
loadEventos();
