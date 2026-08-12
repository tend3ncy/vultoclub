/**
 * VULTO CLUB — Estoque & Contador 1:1
 * Carrega o estoque e exibe contadores regressivos nos produtos limitados
 */

(function() {
  'use strict';

  let estoque = {};

  // Carrega o estoque do servidor
  async function loadEstoque() {
    try {
      const r = await fetch('/api/estoque');
      estoque = await r.json();
      updateUI();
    } catch(e) {
      console.warn('Estoque não disponível');
    }
  }

  // Atualiza todos os elementos com data-produto-id
  function updateUI() {
    document.querySelectorAll('[data-produto-id]').forEach(function(el) {
      const id = el.dataset.produtoId;
      const item = estoque[id];
      if (!item) return;

      // Container do contador
      const counterEl = el.querySelector('.stock-counter');
      const btnEl = el.querySelector('.btn-comprar');

      if (item.tipo === '1:1') {
        // Drop limitado — mostra contador regressivo
        if (counterEl) {
          if (item.quantidade <= 0) {
            counterEl.innerHTML = '<span class="stock-esgotado">ESGOTADO</span>';
          } else if (item.quantidade <= 3) {
            counterEl.innerHTML = '<span class="stock-urgente">⚡ ÚLTIMAS ' + item.quantidade + ' UNIDADES</span>';
          } else {
            counterEl.innerHTML = '<span class="stock-count"><strong>' + item.quantidade + '</strong> restantes</span>';
          }
          counterEl.style.display = 'block';
        }

        // Desabilita o botão se esgotado
        if (btnEl && item.quantidade <= 0) {
          btnEl.disabled = true;
          btnEl.textContent = 'ESGOTADO';
          btnEl.style.opacity = '0.4';
          btnEl.style.cursor = 'not-allowed';
        }
      } else {
        // Produto normal — só mostra se tiver alerta de baixo estoque
        if (counterEl && item.quantidade > 0 && item.quantidade <= 5) {
          counterEl.innerHTML = '<span class="stock-urgente">Últimas unidades</span>';
          counterEl.style.display = 'block';
        }
        if (counterEl && item.quantidade <= 0) {
          counterEl.innerHTML = '<span class="stock-esgotado">ESGOTADO</span>';
          counterEl.style.display = 'block';
        }
        if (btnEl && item.quantidade <= 0) {
          btnEl.disabled = true;
          btnEl.textContent = 'ESGOTADO';
          btnEl.style.opacity = '0.4';
          btnEl.style.cursor = 'not-allowed';
        }
      }
    });
  }

  // Decrementa o estoque quando uma compra é feita
  window.registrarCompra = async function(produtoId) {
    try {
      const r = await fetch('/api/estoque/compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: produtoId })
      });
      const data = await r.json();
      if (data.success) {
        // Atualiza localmente sem nova request
        if (estoque[produtoId]) {
          estoque[produtoId].quantidade = data.restante;
          updateUI();
        }
        return { ok: true, restante: data.restante };
      } else {
        return { ok: false, error: data.error };
      }
    } catch(e) {
      return { ok: false, error: 'Erro de conexão' };
    }
  };

  // Abre WhatsApp para compra 1:1
  window.comprar1x1 = function(produtoId, nomeProduto) {
    const item = estoque[produtoId];
    if (!item || item.quantidade <= 0) {
      alert('Esse produto está esgotado.');
      return;
    }

    const WHATSAPP_1x1 = '5511992249469';
    const msg = encodeURIComponent(
      'Oi! Tenho interesse no ' + (nomeProduto || produtoId) + ' 🔥\n' +
      'Vi que ainda tem ' + item.quantidade + ' unidade(s) disponível(is).\n' +
      'Pode me passar mais detalhes?'
    );
    window.open('https://wa.me/' + WHATSAPP_1x1 + '?text=' + msg, '_blank');
  };

  // Expõe o estoque global
  window.vultoEstoque = {
    load: loadEstoque,
    get: function(id) { return estoque[id] || null; },
    all: function() { return estoque; }
  };

  // Carrega automaticamente quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEstoque);
  } else {
    loadEstoque();
  }
})();
