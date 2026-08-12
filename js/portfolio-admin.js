// Verificar autenticação
async function checkAuth() {
    try {
        const res = await fetch('/api/portfolio/auth');
        const data = await res.json();
        
        if (!data.authenticated) {
            window.location.href = '/pages/portfolio/login.html';
        }
    } catch (error) {
        window.location.href = '/pages/portfolio/login.html';
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/portfolio/logout', { method: 'POST' });
        window.location.href = '/pages/portfolio/login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Verificar auth ao carregar página
if (window.location.pathname.includes('/pages/portfolio/admin')) {
    checkAuth();
}

// ═══════════════════════════════════════════════════════════════════════════
// GERENCIAMENTO DE PROJETOS
// ═══════════════════════════════════════════════════════════════════════════

let currentProjectId = null;

// Carregar projetos
async function loadProjects() {
    try {
        // Inicializar estrutura do portfolio se necessário
        await fetch('/api/init-portfolio.php');
        
        const res = await fetch('/api/portfolio/projects');
        const projects = await res.json();
        
        console.log('Projetos carregados:', projects);
        
        const grid = document.getElementById('projects-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!grid) return;
        
        if (projects.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = projects.map(project => `
            <div class="project-card-admin">
                <div class="project-image-admin" style="background-image: url('${project.image}')"></div>
                <div class="project-info-admin">
                    <h3>${project.title}</h3>
                    <p>${project.category}</p>
                    <div class="project-actions">
                        <button onclick="editProject('${project.id}')" class="btn-icon" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button onclick="deleteProject('${project.id}')" class="btn-icon btn-danger" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
    }
}

// Abrir modal
function openModal(projectId = null) {
    currentProjectId = projectId;
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('project-form');
    
    if (projectId) {
        modalTitle.textContent = 'Editar Projeto';
        loadProjectData(projectId);
    } else {
        modalTitle.textContent = 'Novo Projeto';
        form.reset();
    }
    
    modal.style.display = 'flex';
}

// Fechar modal
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('project-form').reset();
    currentProjectId = null;
}

// Carregar dados do projeto para edição
async function loadProjectData(projectId) {
    try {
        const res = await fetch('/api/portfolio/projects');
        const projects = await res.json();
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-category').value = project.category;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-image').value = project.image;
            document.getElementById('project-link').value = project.link || '';
        }
    } catch (error) {
        console.error('Erro ao carregar projeto:', error);
    }
}

// Editar projeto
function editProject(projectId) {
    openModal(projectId);
}

// Deletar projeto
async function deleteProject(projectId) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    
    try {
        const res = await fetch(`/api/portfolio/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            loadProjects();
        }
    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        alert('Erro ao deletar projeto');
    }
}

// Salvar projeto (criar ou atualizar)
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('project-title').value;
        const category = document.getElementById('project-category').value;
        const image = document.getElementById('project-image').value;
        
        // Validação
        if (!title || !category || !image) {
            alert('Por favor, preencha todos os campos obrigatórios (Título, Categoria e Imagem)');
            return;
        }
        
        const projectData = {
            title: title,
            category: category,
            description: document.getElementById('project-description').value,
            image: image,
            link: document.getElementById('project-link').value
        };
        
        console.log('Salvando projeto:', projectData);
        
        try {
            let res;
            if (currentProjectId) {
                // Atualizar
                console.log('Atualizando projeto:', currentProjectId);
                res = await fetch(`/api/portfolio/projects/${currentProjectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });
            } else {
                // Criar
                console.log('Criando novo projeto');
                res = await fetch('/api/portfolio/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });
            }
            
            console.log('Resposta:', res.status);
            const responseData = await res.json();
            console.log('Dados da resposta:', responseData);
            
            if (res.ok) {
                closeModal();
                loadProjects();
            } else {
                alert('Erro ao salvar: ' + (responseData.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao salvar projeto:', error);
            alert('Erro ao salvar projeto: ' + error.message);
        }
    });
}

// Carregar projetos ao iniciar
if (document.getElementById('projects-grid')) {
    loadProjects();
}

// Fechar modal ao clicar ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});


// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD DE IMAGENS
// ═══════════════════════════════════════════════════════════════════════════

const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('project-image-file');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadPreview = document.getElementById('upload-preview');
const uploadProgress = document.getElementById('upload-progress');
const previewImage = document.getElementById('preview-image');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const imageUrlInput = document.getElementById('project-image-url');
const hiddenImageInput = document.getElementById('project-image');

if (uploadArea) {
    // Click para abrir seletor de arquivo
    uploadArea.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-image')) return;
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // Seleção de arquivo
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // URL externa
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                hiddenImageInput.value = url;
                showPreview(url);
            }
        });
    }
}

// Processar upload
async function handleFileUpload(file) {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
    }

    // Mostrar progresso
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display = 'none';
    uploadProgress.style.display = 'block';

    // Criar FormData
    const formData = new FormData();
    formData.append('image', file);

    try {
        const xhr = new XMLHttpRequest();

        // Progresso
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressFill.style.width = percent + '%';
                progressText.textContent = `Enviando... ${Math.round(percent)}%`;
            }
        });

        // Sucesso
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                hiddenImageInput.value = response.url;
                showPreview(response.url);
                progressText.textContent = 'Upload concluído!';
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                }, 1000);
            } else {
                throw new Error('Erro no upload');
            }
        });

        // Erro
        xhr.addEventListener('error', () => {
            alert('Erro ao fazer upload da imagem');
            resetUpload();
        });

        // Enviar
        xhr.open('POST', '/api/portfolio/upload');
        xhr.send(formData);

    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload da imagem');
        resetUpload();
    }
}

// Mostrar preview
function showPreview(url) {
    previewImage.src = url;
    uploadPlaceholder.style.display = 'none';
    uploadProgress.style.display = 'none';
    uploadPreview.style.display = 'block';
}

// Remover imagem
function removeImage() {
    hiddenImageInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    resetUpload();
}

// Resetar upload
function resetUpload() {
    uploadPlaceholder.style.display = 'flex';
    uploadPreview.style.display = 'none';
    uploadProgress.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = 'Enviando...';
    fileInput.value = '';
}

// Ao editar projeto, mostrar imagem existente
const originalLoadProjectData = loadProjectData;
loadProjectData = async function(projectId) {
    await originalLoadProjectData(projectId);
    const imageUrl = document.getElementById('project-image').value;
    if (imageUrl) {
        showPreview(imageUrl);
    }
};
