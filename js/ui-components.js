/* ═══════════════════════════════════════════════════════════════════════════
   UI COMPONENTS - Toast, Loading, Confirmações
   ═══════════════════════════════════════════════════════════════════════════ */

// Criar container de toasts se não existir
function ensureToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// TOAST NOTIFICATIONS
const Toast = {
    success(message, title = 'Sucesso') {
        this.show(message, title, 'success');
    },
    
    error(message, title = 'Erro') {
        this.show(message, title, 'error');
    },
    
    warning(message, title = 'Atenção') {
        this.show(message, title, 'warning');
    },
    
    info(message, title = 'Informação') {
        this.show(message, title, 'info');
    },
    
    show(message, title, type = 'info') {
        const container = ensureToastContainer();
        
        const icons = {
            success: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            error: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            warning: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            info: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove após 5 segundos
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// LOADING OVERLAY
const Loading = {
    overlay: null,
    
    show(text = 'Carregando...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div>
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
        
        this.overlay.querySelector('.loading-text').textContent = text;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// CONFIRM DIALOG
const Confirm = {
    overlay: null,
    
    async show(options = {}) {
        const {
            title = 'Confirmar ação',
            message = 'Tem certeza que deseja continuar?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'danger', // danger, warning, info
            confirmClass = '' // primary para ações positivas
        } = options;
        
        return new Promise((resolve) => {
            if (!this.overlay) {
                this.overlay = document.createElement('div');
                this.overlay.className = 'confirm-overlay';
                document.body.appendChild(this.overlay);
            }
            
            const icons = {
                danger: '<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
                warning: '<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
                info: '<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            };
            
            this.overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-icon ${type}">
                        ${icons[type]}
                    </div>
                    <h3 class="confirm-title">${title}</h3>
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-actions">
                        <button class="confirm-btn confirm-btn-cancel">${cancelText}</button>
                        <button class="confirm-btn confirm-btn-confirm ${confirmClass}">${confirmText}</button>
                    </div>
                </div>
            `;
            
            const cancelBtn = this.overlay.querySelector('.confirm-btn-cancel');
            const confirmBtn = this.overlay.querySelector('.confirm-btn-confirm');
            
            const close = (result) => {
                this.overlay.classList.remove('active');
                document.body.style.overflow = '';
                resolve(result);
            };
            
            cancelBtn.onclick = () => close(false);
            confirmBtn.onclick = () => close(true);
            
            // Fechar ao clicar fora
            this.overlay.onclick = (e) => {
                if (e.target === this.overlay) close(false);
            };
            
            // Fechar com ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            confirmBtn.focus();
        });
    },
    
    async delete(itemName = 'este item') {
        return this.show({
            title: 'Excluir item',
            message: `Tem certeza que deseja excluir ${itemName}? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
        });
    }
};

// BUTTON LOADING STATE
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = '';
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

// IMAGE PREVIEW
function createImagePreview(file, container) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('Arquivo não é uma imagem'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Preview" class="image-preview">
                    <div class="image-preview-overlay">
                        <div class="image-preview-actions">
                            <button type="button" class="image-preview-btn" onclick="this.closest('.image-preview-container').remove()">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            if (container) {
                container.innerHTML = previewHTML;
            }
            
            resolve(e.target.result);
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

// Exportar para uso global
window.Toast = Toast;
window.Loading = Loading;
window.Confirm = Confirm;
window.setButtonLoading = setButtonLoading;
window.createImagePreview = createImagePreview;
