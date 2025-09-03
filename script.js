// Configuração do Supabase
const SUPABASE_URL = 'https://nqplihfmbwlrbyzbxilh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGxpaGZtYndscmJ5emJ4aWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjEzODQsImV4cCI6MjA3MTg5NzM4NH0.mn_2tyTloRpvUxPmyU7jWt1YYSa7Y3FRFGe0B4nGXSA';

// Variáveis globais
let supabase = null;
let categories = []; // Será preenchida do Supabase
let products = []; // Será preenchida do Supabase
let filteredProducts = []; // Produtos filtrados
let currentUser = null; // Usuário autenticado

// Carrinho de compras
let cart = [];

// Elementos DOM - serão inicializados quando o DOM estiver carregado
let categoriesGrid = null;
let productsGrid = null;
let searchInput = null;
let searchBtn = null;
let clearSearchBtn = null;
let totalProducts = null;
let cartItems = null;
let cartValue = null;

// Detectar o caminho base automaticamente
const BASE_PATH = window.location.pathname.split('/').slice(0, -1).join('/') + '/';
console.log('Base path detectado:', BASE_PATH);

// Função para corrigir URLs relativas
function getAbsolutePath(relativePath) {
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  return BASE_PATH + relativePath;
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar Supabase primeiro
    await initializeSupabase();
    
    // Verificar autenticação
    await checkAuthStatus();
    
    // Se não estiver autenticado, mostrar tela de login
    if (!currentUser) {
        showAuthScreen();
        return;
    }
    
    // Se estiver autenticado, inicializar a aplicação
    await initializeApp();
});

// Inicializar Supabase
async function initializeSupabase() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Cliente Supabase inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar Supabase:', error);
        showNotification('❌ Erro ao conectar com o servidor', 'error');
    }
}

// Verificar status de autenticação
async function checkAuthStatus() {
    try {
        if (!supabase) return;
        
        // Verificar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return;
        }
        
        if (session) {
            try {
                // Verificar se o usuário está na lista de usuários autorizados
                let authorizedUser = null;
                
                // Primeira tentativa: com RLS habilitado
                const { data: authData, error: authError } = await supabase
                    .from('authorized_users')
                    .select('*')
                    .eq('email', session.user.email)
                    .eq('is_active', true)
                    .single();
                
                if (authError) {
                    console.error('Erro ao verificar autorização com RLS:', authError);
                    
                    // Se falhar com RLS, tentar uma abordagem alternativa
                    try {
                        // Verificar se o usuário existe na tabela (sem RLS)
                        const { data: fallbackUser, error: fallbackError } = await supabase
                            .from('authorized_users')
                            .select('*')
                            .eq('email', session.user.email)
                            .eq('is_active', true)
                            .maybeSingle();
                        
                        if (fallbackError) {
                            console.error('Erro no fallback:', fallbackError);
                            throw new Error('Falha na verificação de autorização');
                        }
                        
                        if (!fallbackUser) {
                            throw new Error('Usuário não encontrado na lista de autorizados');
                        }
                        
                        authorizedUser = fallbackUser;
                        console.log('Usuário autorizado via fallback:', authorizedUser);
                        
                    } catch (fallbackError) {
                        console.error('Falha no fallback:', fallbackError);
                        await supabase.auth.signOut();
                        return;
                    }
                } else {
                    authorizedUser = authData;
                    console.log('Usuário autorizado via RLS:', authorizedUser);
                }
                
                if (!authorizedUser) {
                    console.log('Usuário não autorizado:', session.user.email);
                    await supabase.auth.signOut();
                    return;
                }
                
                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: authorizedUser.name,
                    role: authorizedUser.role
                };
                
                // Atualizar último login (com tratamento de erro)
                try {
                    await supabase
                        .from('authorized_users')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', authorizedUser.id);
                } catch (updateError) {
                    console.warn('Erro ao atualizar último login:', updateError);
                    // Não falhar se não conseguir atualizar o último login
                }
                
                console.log('Usuário autenticado com sucesso:', currentUser);
            } catch (error) {
                console.error('Erro crítico ao verificar autenticação:', error);
                await supabase.auth.signOut();
            }
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Mostrar tela de autenticação
function showAuthScreen() {
    // Ocultar conteúdo principal
    const mainContent = document.querySelector('.container');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Criar tela de autenticação
    const authScreen = document.createElement('div');
    authScreen.className = 'auth-screen';
    authScreen.id = 'authScreen';
    
    authScreen.innerHTML = `
        <div class="auth-container">
            <div class="auth-logo">
                <i class="fas fa-bread-slice"></i>
                <h1>Padaria Artesanal</h1>
            </div>
            
            <div class="auth-form-container">
                <h2>🔐 Acesso Restrito</h2>
                <p>Faça login para acessar o sistema PDV</p>
                
                <form class="auth-form" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="loginEmail">Email:</label>
                        <input type="email" id="loginEmail" placeholder="seu-email@exemplo.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Senha:</label>
                        <input type="password" id="loginPassword" placeholder="Sua senha" required>
                    </div>
                    
                    <button type="submit" class="login-btn" id="loginBtn">
                        <i class="fas fa-sign-in-alt"></i>
                        Entrar no Sistema
                    </button>
                </form>
                
                <div class="auth-footer">
                    <p>⚠️ Apenas usuários autorizados podem acessar este sistema</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(authScreen);
    
    // Focar no campo de email
    setTimeout(() => {
        document.getElementById('loginEmail').focus();
    }, 100);
}

// Função de login
async function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showNotification('❌ Preencha todos os campos!', 'error');
        return;
    }
    
    // Desabilitar botão durante o login
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        // Fazer login no Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user) {
            // Verificar se o usuário está autorizado
            const { data: authorizedUser, error: authError } = await supabase
                .from('authorized_users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();
            
            if (authError || !authorizedUser) {
                await supabase.auth.signOut();
                throw new Error('Usuário não autorizado para acessar este sistema');
            }
            
            // Login bem-sucedido
            currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: authorizedUser.name,
                role: authorizedUser.role
            };
            
            // Atualizar último login
            await supabase
                .from('authorized_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', authorizedUser.id);
            
            showNotification(`✅ Bem-vindo, ${currentUser.name}!`, 'success');
            
            // Remover tela de autenticação e inicializar app
            setTimeout(() => {
                const authScreen = document.getElementById('authScreen');
                if (authScreen) {
                    document.body.removeChild(authScreen);
                }
                
                const mainContent = document.querySelector('.container');
                if (mainContent) {
                    mainContent.style.display = 'block';
                }
                
                initializeApp();
            }, 1000);
            
        } else {
            throw new Error('Dados de login inválidos');
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('not authorized')) {
            errorMessage = 'Usuário não autorizado para acessar este sistema';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Email não confirmado. Verifique sua caixa de entrada';
        }
        
        showNotification(`❌ ${errorMessage}`, 'error');
        
        // Limpar senha em caso de erro
        passwordInput.value = '';
        passwordInput.focus();
    } finally {
        // Reabilitar botão
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Sistema';
    }
}

// Inicializar aplicação após autenticação
async function initializeApp() {
    // Inicializar elementos DOM
    categoriesGrid = document.getElementById('categoriesGrid');
    productsGrid = document.getElementById('productsGrid');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    clearSearchBtn = document.getElementById('clearSearchBtn');
    totalProducts = document.getElementById('totalProducts');
    cartItems = document.getElementById('cartItems');
    cartValue = document.getElementById('cartValue');
    
    // Adicionar informações do usuário no header
    addUserInfoToHeader();
    
    // Carregar dados
    await loadCategoriesFromSupabase();
    await loadProductsFromSupabase();
    renderProducts();
    updateFooter();
    
    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
}

// Adicionar informações do usuário no header
function addUserInfoToHeader() {
    const header = document.querySelector('.header');
    if (!header || !currentUser) return;
    
    // Limpar controles de usuário existentes antes de adicionar novos
    const existingUserControls = header.querySelectorAll('.user-controls');
    existingUserControls.forEach(control => control.remove());
    
    const userControls = document.createElement('div');
    userControls.className = 'user-controls';
    userControls.id = 'userControls';
    
    userControls.innerHTML = `
        <div class="user-info">
            <i class="fas fa-user-circle"></i>
            <span>${currentUser.name}</span>
        </div>
        <button class="logout-btn" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i>
            Sair
        </button>
    `;
    
    header.appendChild(userControls);
}

// Função de logout
async function handleLogout() {
    try {
        if (supabase) {
            await supabase.auth.signOut();
        }
        
        // Limpar dados locais
        currentUser = null;
        categories = [];
        products = [];
        filteredProducts = [];
        cart = [];
        
        // Limpar interface
        if (categoriesGrid) categoriesGrid.innerHTML = '';
        if (productsGrid) productsGrid.innerHTML = '';
        
        // Limpar controles de usuário do header
        const userControls = document.querySelector('#userControls');
        if (userControls) {
            userControls.remove();
        }
        
        // Também limpar por classe (backup)
        const allUserControls = document.querySelectorAll('.user-controls');
        allUserControls.forEach(control => control.remove());
        
        showNotification('👋 Logout realizado com sucesso!', 'success');
        
        // Redirecionar para tela de login
        setTimeout(() => {
            const mainContent = document.querySelector('.container');
            if (mainContent) {
                mainContent.style.display = 'none';
            }
            
            showAuthScreen();
        }, 1000);
        
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('❌ Erro ao fazer logout', 'error');
    }
}

// Carregar categorias do Supabase
async function loadCategoriesFromSupabase() {
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }

        console.log('Buscando categorias do Supabase...');
        showLoadingStatus('Carregando categorias...');
        
        const { data, error } = await supabase
            .from('category')
            .select('id, name, icon, color')
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            categories = data;
            console.log('Categorias carregadas do Supabase:', categories);
            renderCategories();
        } else {
            console.log('Nenhuma categoria encontrada no Supabase, usando dados padrão');
            // Usar dados padrão se não houver categorias no Supabase
            categories = [
                { id: 1, name: 'Pães Artesanais', icon: 'fas fa-bread-slice', color: '#8B4513' },
                { id: 2, name: 'Doces e Confeitaria', icon: 'fas fa-cake-candles', color: '#FF69B4' },
                { id: 3, name: 'Salgados', icon: 'fas fa-pizza-slice', color: '#FF6347' },
                { id: 4, name: 'Bebidas', icon: 'fas fa-coffee', color: '#8B4513' },
                { id: 5, name: 'Especiais', icon: 'fas fa-star', color: '#FFD700' },
                { id: 6, name: 'Sem Glúten', icon: 'fas fa-leaf', color: '#32CD32' }
            ];
            renderCategories();
        }

    } catch (error) {
        console.error('Erro ao carregar categorias do Supabase:', error);
        // Fallback para dados hard-coded
        categories = [
            { id: 1, name: 'Pães Artesanais', icon: 'fas fa-bread-slice', color: '#8B4513' },
            { id: 2, name: 'Doces e Confeitaria', icon: 'fas fa-cake-candles', color: '#FF69B4' },
            { id: 3, name: 'Salgados', icon: 'fas fa-pizza-slice', color: '#FF6347' },
            { id: 4, name: 'Bebidas', icon: 'fas fa-coffee', color: '#8B4513' },
            { id: 5, name: 'Especiais', icon: 'fas fa-star', color: '#FFD700' },
            { id: 6, name: 'Sem Glúten', icon: 'fas fa-leaf', color: '#32CD32' }
        ];
        renderCategories();
    }
}

// Carregar produtos do Supabase
async function loadProductsFromSupabase() {
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }

        console.log('Buscando produtos do Supabase...');
        
        // Buscar produtos com relacionamento de categoria
        const { data, error } = await supabase
            .from('product')
            .select(`
                id,
                name,
                price,
                categoryId,
                category:categoryId(id, name, icon)
            `)
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            // Processar dados para incluir informações da categoria
            products = data.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                categoryId: product.categoryId,
                category: product.category?.name || 'Sem Categoria',
                icon: product.category?.icon || 'fas fa-box'
            }));
            
            filteredProducts = [...products];
            console.log('Produtos carregados do Supabase:', products);
        } else {
            console.log('Nenhum produto encontrado no Supabase, usando dados padrão');
            // Usar dados padrão se não houver produtos no Supabase
            products = [
                {
                    id: 1,
                    name: 'Pão de Fermentação Natural',
                    price: 8.50,
                    categoryId: 1,
                    category: 'Pães Artesanais',
                    icon: 'fas fa-bread-slice'
                },
                {
                    id: 2,
                    name: 'Croissant Tradicional',
                    price: 6.80,
                    categoryId: 1,
                    category: 'Pães Artesanais',
                    icon: 'fas fa-bread-slice'
                },
                {
                    id: 3,
                    name: 'Bolo de Chocolate',
                    price: 12.90,
                    categoryId: 2,
                    category: 'Doces e Confeitaria',
                    icon: 'fas fa-cake-candles'
                }
            ];
            filteredProducts = [...products];
        }

    } catch (error) {
        console.error('Erro ao carregar produtos do Supabase:', error);
        // Fallback para dados hard-coded
        products = [
            {
                id: 1,
                name: 'Pão de Fermentação Natural',
                price: 8.50,
                categoryId: 1,
                category: 'Pães Artesanais',
                icon: 'fas fa-bread-slice'
            },
            {
                id: 2,
                name: 'Croissant Tradicional',
                price: 6.80,
                categoryId: 1,
                category: 'Pães Artesanais',
                icon: 'fas fa-bread-slice'
            },
            {
                id: 3,
                name: 'Bolo de Chocolate',
                price: 12.90,
                categoryId: 2,
                category: 'Doces e Confeitaria',
                icon: 'fas fa-cake-candles'
            }
        ];
        filteredProducts = [...products];
    }
}

// Renderizar categorias
function renderCategories() {
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.dataset.categoryId = category.id;
        
        // Usar os dados do Supabase (icon e color)
        const iconClass = category.icon || 'fas fa-bread-slice';
        const iconColor = category.color || '#8B4513';
        


        
        categoryCard.innerHTML = `
            <button class="card-edit-btn" title="Editar" type="button">
                <i class="fas fa-pen"></i>
            </button>
            <i class="${iconClass}" style="color: ${iconColor}"></i>
            <h3>${category.name}</h3>

        `;
        
        // Adicionar event listener para click (filtro)
        categoryCard.addEventListener('click', () => filterByCategory(category.name));

        // Botão de edição (dblclick/double-tap apenas no ícone)
        const editBtn = categoryCard.querySelector('.card-edit-btn');
        editBtn.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showEditCategoryModal(category);
        });
        attachDoubleTap(editBtn, (e) => {
            showEditCategoryModal(category);
        });
        
        categoriesGrid.appendChild(categoryCard);
    });
}

// Função para mostrar modal de adicionar categoria
function showAddCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'add-category-modal';
    modal.id = 'addCategoryModal';
    
    modal.innerHTML = `
        <div class="add-category-modal-content">
            <div class="add-category-header">
                <h2>➕ Nova Categoria</h2>
                <button class="close-add-category-btn" onclick="closeAddCategoryModal()">×</button>
            </div>
            
            <form class="add-category-form" onsubmit="saveNewCategory(event)">
                <div class="form-group">
                    <label for="categoryName">Nome da Categoria:</label>
                    <input type="text" id="categoryName" placeholder="Ex: Bebidas Quentes" required>
                </div>
                
                <div class="form-group">
                    <label for="categoryIcon">Ícone (FontAwesome):</label>
                    <input type="text" id="categoryIcon" placeholder="Ex: fa fa-house" required>
                    <div class="input-help">
                        Sugestão: "fa fa-house" | 
                        <a href="https://fontawesome.com/search?ic=free&o=r" target="_blank" rel="noopener">
                            Consultar ícones disponíveis
                        </a>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="categoryColor">Cor:</label>
                    <input type="text" id="categoryColor" placeholder="Ex: blue" required>
                    <div class="input-help">
                        Sugestão: "blue", "red", "green", "#FF6B6B", etc.
                    </div>
                </div>
                
                <div class="add-category-actions">
                    <button type="button" class="cancel-btn" onclick="closeAddCategoryModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="save-category-btn" id="saveCategoryBtn">
                        Salvar Categoria
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('categoryName').focus();
    }, 100);
}

// Função para fechar modal de adicionar categoria
function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Event listener para fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const categoryModal = document.getElementById('addCategoryModal');
    const editCategoryModal = document.getElementById('editCategoryModal');
    const editProductModal = document.getElementById('editProductModal');
    const productModal = document.getElementById('addProductModal');
    
    if (categoryModal && event.target === categoryModal) {
        closeAddCategoryModal();
    }
    
    if (editCategoryModal && event.target === editCategoryModal) {
        closeEditCategoryModal();
    }
    
    if (editProductModal && event.target === editProductModal) {
        closeEditProductModal();
    }

    if (productModal && event.target === productModal) {
        closeAddProductModal();
    }
});

// Event listener para fechar modal com tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const categoryModal = document.getElementById('addCategoryModal');
        const editCategoryModal = document.getElementById('editCategoryModal');
        const editProductModal = document.getElementById('editProductModal');
        const productModal = document.getElementById('addProductModal');
        if (categoryModal) {
            closeAddCategoryModal();
        }
        if (editCategoryModal) {
            closeEditCategoryModal();
        }
        if (editProductModal) {
            closeEditProductModal();
        }
        if (productModal) {
            closeAddProductModal();
        }
    }
});

// Função para salvar nova categoria
async function saveNewCategory(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('categoryName');
    const iconInput = document.getElementById('categoryIcon');
    const colorInput = document.getElementById('categoryColor');
    const saveBtn = document.getElementById('saveCategoryBtn');
    
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim();
    const color = colorInput.value.trim();
    
    // Validação básica
    if (!name || !icon || !color) {
        showNotification('❌ Todos os campos são obrigatórios!', 'error');
        return;
    }
    
    // Desabilitar botão durante o salvamento
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        showNotification('🔄 Salvando nova categoria...', 'info');
        
        // Inserir nova categoria no Supabase
        const { data, error } = await supabase
            .from('category')
            .insert([
                {
                    name: name,
                    icon: icon,
                    color: color
                }
            ])
            .select();
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            const newCategory = data[0];
            
            // Adicionar à lista local
            categories.push(newCategory);
            
            // Reordenar por nome
            categories.sort((a, b) => a.name.localeCompare(b.name));
            
            // Re-renderizar categorias
            renderCategories();
            
            // Fechar modal
            closeAddCategoryModal();
            
            showNotification(`✅ Categoria "${name}" criada com sucesso!`, 'success');
            
            // Limpar formulário
            nameInput.value = '';
            iconInput.value = '';
            colorInput.value = '';
        } else {
            throw new Error('Nenhum dado retornado do Supabase');
        }
        
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        showNotification(`❌ Erro ao salvar categoria: ${error.message}`, 'error');
    } finally {
        // Reabilitar botão
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Categoria';
    }
}

// Função para mostrar modal de adicionar produto
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'add-product-modal';
    modal.id = 'addProductModal';
    
    // Obter categoria atualmente selecionada (se houver)
    const selectedCategory = getCurrentlySelectedCategory();
    
    // Gerar opções do dropdown de categorias
    const categoryOptions = categories.map(category => {
        const selected = selectedCategory && selectedCategory.id === category.id ? 'selected' : '';
        return `<option value="${category.id}" ${selected}>${category.name}</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="add-product-modal-content">
            <div class="add-product-header">
                <h2>🛍️ Novo Produto</h2>
                <button class="close-add-product-btn" onclick="closeAddProductModal()">×</button>
            </div>
            
            <form class="add-product-form" onsubmit="saveNewProduct(event)">
                <div class="form-group">
                    <label for="productCategory">Categoria:</label>
                    <select id="productCategory" required>
                        <option value="">Selecione uma categoria</option>
                        ${categoryOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="productName">Nome do Produto:</label>
                    <input type="text" id="productName" placeholder="Ex: Pão de Queijo Especial" required>
                </div>
                
                <div class="form-group">
                    <label for="productPrice">Preço (R$):</label>
                    <input type="number" id="productPrice" placeholder="0.00" step="0.01" min="0" required>
                </div>
                
                <div class="add-product-actions">
                    <button type="button" class="cancel-btn" onclick="closeAddProductModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="save-category-btn" id="saveProductBtn">
                        Salvar Produto
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focar no primeiro campo (agora é a categoria)
    setTimeout(() => {
        document.getElementById('productCategory').focus();
    }, 100);
}

// Função para fechar modal de adicionar produto
function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Função para obter categoria atualmente selecionada
function getCurrentlySelectedCategory() {
    // Buscar por categoria com borda azul (selecionada)
    const selectedCard = categoriesGrid.querySelector('.category-card[style*="border-color: #667eea"]');
    if (selectedCard) {
        const categoryName = selectedCard.querySelector('h3').textContent;
        return categories.find(cat => cat.name === categoryName);
    }
    
    // Buscar por categoria com classe 'selected'
    const selectedCardByClass = categoriesGrid.querySelector('.category-card.selected');
    if (selectedCardByClass) {
        const categoryName = selectedCardByClass.querySelector('h3').textContent;
        return categories.find(cat => cat.name === categoryName);
    }
    
    return null;
}

// Função para salvar novo produto
async function saveNewProduct(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('productName');
    const categorySelect = document.getElementById('productCategory');
    const priceInput = document.getElementById('productPrice');
    const saveBtn = document.getElementById('saveProductBtn');
    
    const name = nameInput.value.trim();
    const categoryId = parseInt(categorySelect.value);
    const price = parseFloat(priceInput.value);
    
    // Validação básica
    if (!name || !categoryId || isNaN(price) || price <= 0) {
        showNotification('❌ Todos os campos são obrigatórios e o preço deve ser maior que zero!', 'error');
        return;
    }
    
    // Desabilitar botão durante o salvamento
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        showNotification('🔄 Salvando novo produto...', 'info');
        
        // Inserir novo produto no Supabase
        const { data, error } = await supabase
            .from('product')
            .insert([
                {
                    name: name,
                    categoryId: categoryId,
                    price: price
                }
            ])
            .select(`
                id,
                name,
                price,
                categoryId,
                category:categoryId(id, name, icon)
            `);
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            const newProduct = data[0];
            
            // Processar dados para incluir informações da categoria
            const processedProduct = {
                id: newProduct.id,
                name: newProduct.name,
                price: newProduct.price,
                categoryId: newProduct.categoryId,
                category: newProduct.category?.name || 'Sem Categoria',
                icon: newProduct.category?.icon || 'fas fa-box'
            };
            
            // Adicionar à lista local
            products.push(processedProduct);
            
            // Reordenar por nome
            products.sort((a, b) => a.name.localeCompare(b.name));
            
            // Verificar se deve filtrar por categoria
            const selectedCategory = categories.find(cat => cat.id === categoryId);
            console.log('Categoria selecionada para o novo produto:', selectedCategory);
            
            if (selectedCategory) {
                console.log('Atualizando seleção visual e filtrando por:', selectedCategory.name);
                // Sempre atualizar a seleção visual para a nova categoria
                updateCategorySelection(selectedCategory.name);
                // Sempre filtrar produtos pela nova categoria
                filterByCategory(selectedCategory.name);
            } else {
                console.log('Categoria não encontrada, apenas re-renderizando');
                // Se não encontrou a categoria, apenas re-renderizar
                renderProducts();
            }
            
            // Fechar modal
            closeAddProductModal();
            
            showNotification(`✅ Produto "${name}" criado com sucesso!`, 'success');
            
            // Limpar formulário
            nameInput.value = '';
            categorySelect.value = '';
            priceInput.value = '';
            
            // Atualizar footer
            updateFooter();
        } else {
            throw new Error('Nenhum dado retornado do Supabase');
        }
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showNotification(`❌ Erro ao salvar produto: ${error.message}`, 'error');
    } finally {
        // Reabilitar botão
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Produto';
    }
}

// Função para atualizar seleção visual de categoria
function updateCategorySelection(categoryName) {
    console.log('Atualizando seleção visual para categoria:', categoryName);
    
    // Remover seleção anterior
    const allCategories = categoriesGrid.querySelectorAll('.category-card');
    allCategories.forEach(card => {
        card.style.borderColor = 'transparent';
        card.classList.remove('selected');
    });
    
    // Selecionar nova categoria
    const selectedCard = Array.from(allCategories).find(card => 
        card.querySelector('h3').textContent === categoryName
    );
    if (selectedCard) {
        selectedCard.style.borderColor = '#667eea';
        selectedCard.classList.add('selected');
        console.log('Categoria selecionada visualmente:', categoryName);
    } else {
        console.log('Categoria não encontrada para seleção visual:', categoryName);
    }
}

// Função para recarregar categorias do Supabase
async function reloadCategories() {
    try {
        showNotification('🔄 Recarregando categorias...', 'info');
        await loadCategoriesFromSupabase();
        showNotification('✅ Categorias atualizadas!', 'success');
    } catch (error) {
        showNotification('❌ Erro ao recarregar categorias', 'error');
        console.error('Erro ao recarregar categorias:', error);
    }
}

// Função para mostrar status de carregamento
function showLoadingStatus(message) {
    if (categoriesGrid) {
        categoriesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Renderizar produtos
function renderProducts() {
    productsGrid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.id;
        
        // Verificar quantidade no carrinho para este produto
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        // Encontrar a categoria do produto para obter a cor
        const productCategory = categories.find(cat => cat.id === product.categoryId);
        const categoryColor = productCategory ? productCategory.color : '#667eea'; // Fallback para cor padrão
        const textColor = getContrastTextColor(categoryColor);
        
        productCard.innerHTML = `
            <button class="card-edit-btn" title="Editar" type="button">
                <i class="fas fa-pen"></i>
            </button>
            <div class="product-image" style="background: ${categoryColor}; color: ${textColor}">
                <i class="${product.icon}"></i>
            </div>
            <div class="product-info">
                <div class="product-name-container">
                    <h3 class="product-name">${product.name}</h3>
                    ${quantity > 0 ? `<span class="product-counter">${quantity}</span>` : ''}
                </div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    ADD +
                </button>
            </div>
        `;

        // Botão de edição (dblclick/double-tap apenas no botão)
        const editBtn = productCard.querySelector('.card-edit-btn');
        editBtn.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const fullProduct = products.find(p => p.id === product.id);
            if (fullProduct) showEditProductModal(fullProduct);
        });
        attachDoubleTap(editBtn, () => {
            const fullProduct = products.find(p => p.id === product.id);
            if (fullProduct) showEditProductModal(fullProduct);
        });
        
        productsGrid.appendChild(productCard);
    });
}

// Função para determinar cor do texto baseada no background (contraste)
function getContrastTextColor(backgroundColor) {
    // Se for um gradiente ou cor não hexadecimal, retorna branco como padrão
    if (!backgroundColor || backgroundColor.includes('gradient') || !backgroundColor.startsWith('#')) {
        return '#FFFFFF';
    }
    
    try {
        // Converte hex para RGB
        const hex = backgroundColor.replace('#', '');
        let r, g, b;
        
        if (hex.length === 3) {
            // Formato shorthand #RGB
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            // Formato completo #RRGGBB
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            return '#FFFFFF'; // Formato inválido
        }
        
        // Calcula luminosidade (fórmula de percepção humana)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Retorna branco para fundos escuros, preto para claros
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (error) {
        console.error('Erro ao calcular contraste para cor:', backgroundColor, error);
        return '#FFFFFF'; // Fallback para branco em caso de erro
    }
}

// Função de busca
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Mostrar/ocultar botão de limpar baseado no conteúdo
    if (searchTerm === '') {
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        filteredProducts = [...products];
    } else {
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'flex';
        }
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts();
    updateFooter();
}

// Função para limpar busca
function clearSearch() {
    // Limpar o campo de busca
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Ocultar o botão de limpar
    if (clearSearchBtn) {
        clearSearchBtn.style.display = 'none';
    }
    
    // Restaurar todos os produtos
    filteredProducts = [...products];
    renderProducts();
    updateFooter();
    
    // Focar no campo de busca
    if (searchInput) {
        searchInput.focus();
    }
}

// Filtrar por categoria
function filterByCategory(categoryName) {
    console.log('Filtrando por categoria:', categoryName);
    console.log('Produtos disponíveis:', products.map(p => ({ name: p.name, category: p.category })));
    
    if (categoryName === 'Todas') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === categoryName);
    }
    
    console.log('Produtos filtrados:', filteredProducts.map(p => ({ name: p.name, category: p.category })));
    
    renderProducts();
    updateFooter();
    
    // Remover seleção anterior de todas as categorias
    const allCategories = categoriesGrid.querySelectorAll('.category-card');
    allCategories.forEach(card => {
        card.style.borderColor = 'transparent';
        card.classList.remove('selected');
    });
    
    // Destacar categoria selecionada
    const selectedCard = Array.from(allCategories).find(card => 
        card.querySelector('h3').textContent === categoryName
    );
    if (selectedCard) {
        selectedCard.style.borderColor = '#667eea';
        selectedCard.classList.add('selected');
    }
}

// Adicionar ao carrinho
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        // Feedback visual
        showNotification(`${product.name} adicionado à sacola!`);
        
        // Atualizar contador do produto em tempo real
        updateProductCounter(productId);
        
        updateFooter();
    }
}

// Atualizar contador de um produto específico
function updateProductCounter(productId) {
    const productCard = document.querySelector(`[onclick="addToCart(${productId})"]`).closest('.product-card');
    if (productCard) {
        const product = cart.find(item => item.id === productId);
        const quantity = product ? product.quantity : 0;
        const nameContainer = productCard.querySelector('.product-name-container');
        
        if (nameContainer) {
            const existingCounter = nameContainer.querySelector('.product-counter');
            if (quantity > 0) {
                if (existingCounter) {
                    existingCounter.textContent = quantity;
                } else {
                    const counter = document.createElement('span');
                    counter.className = 'product-counter';
                    counter.textContent = quantity;
                    nameContainer.appendChild(counter);
                }
            } else {
                if (existingCounter) {
                    existingCounter.remove();
                }
            }
        }
    }
}

// Função para determinar cor do texto baseada no background (contraste)
function getContrastTextColor(backgroundColor) {
    // Converte hex para RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcula luminosidade
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retorna branco para fundos escuros, preto para claros
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Definir cor baseada no tipo
    let backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (type === 'error') {
        backgroundColor = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    } else if (type === 'info') {
        backgroundColor = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Atualizar footer
function updateFooter() {
    const totalProductsCount = filteredProducts.length;
    const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotalValue = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    totalProducts.textContent = totalProductsCount;
    cartItems.textContent = cartItemsCount;
    cartValue.textContent = `R$ ${cartTotalValue.toFixed(2)}`;
}

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .category-card.selected {
        border-color: #667eea !important;
        background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
    }
    
    .category-edit-hint {
        font-size: 0.75rem;
        color: #888;
        text-align: center;
        margin-top: 8px;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    
    .category-card:hover .category-edit-hint {
        opacity: 1;
        color: #667eea;
    }
    
    .product-category {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 10px;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// Helper: detectar double‑tap em mobile com prevenção de click fantasma
function attachDoubleTap(element, callback, threshold = 300) {
    let lastTouchTime = 0;
    let touchTimeout = null;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const clear = () => {
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
    };

    element.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return; // ignorar multi-touch
        const t = e.changedTouches[0];
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        const now = Date.now();
        const delta = now - lastTouchTime;
        lastTouchTime = now;

        // Impedir clique fantasma após touch
        e.preventDefault();
        e.stopPropagation();

        if (delta > 0 && delta <= threshold) {
            clear();
            callback(e);
        } else {
            clear();
            // janela para possível segundo toque
            touchTimeout = setTimeout(() => {
                clear();
            }, threshold);
        }
    });

    // Bloquear click gerado por touch em alguns navegadores
    element.addEventListener('click', (e) => {
        // se veio logo após um touchend recente, cancelar
        if (Date.now() - lastTouchTime < 350) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

// Função para limpar carrinho (para desenvolvimento)
function clearCart() {
    cart = [];
    updateFooter();
    showNotification('Carrinho limpo!');
    // Atualizar todos os contadores dos produtos
    renderProducts();
}

// Função para finalizar compra
function checkout() {
    if (cart.length === 0) {
        showNotification('Carrinho vazio!', 'error');
        return;
    }
    
    showCheckoutModal();
}

// Função para mostrar modal de checkout
function showCheckoutModal() {
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.id = 'checkoutModal';
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    modal.innerHTML = `
        <div class="checkout-modal-content">
            <div class="checkout-header">
                <h2>🛒 Finalizar Compra</h2>
                <button class="close-modal-btn" onclick="closeCheckoutModal()">×</button>
            </div>
            
            <div class="cart-items-list">
                <h3>Itens no Carrinho:</h3>
                <div class="cart-items-container">
                    ${cart.map(item => `
                        <div class="cart-item-row" data-product-id="${item.id}">
                            <div class="cart-item-info">
                                <span class="cart-item-name">${item.name}</span>
                                <span class="cart-item-price">R$ ${item.price.toFixed(2)}</span>
                            </div>
                            <div class="cart-item-controls">
                                <button class="quantity-btn minus-btn" onclick="decreaseQuantity(${item.id})">-</button>
                                <span class="quantity-display">${item.quantity}</span>
                                <button class="quantity-btn plus-btn" onclick="increaseQuantity(${item.id})">+</button>
                                <button class="remove-item-btn" onclick="removeFromCart(${item.id})">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="cart-total">
                <h3>Total da Compra: <span class="total-amount">R$ ${total.toFixed(2)}</span></h3>
            </div>
            
            <div class="payment-methods">
                <h3>Forma de Pagamento:</h3>
                <div class="payment-buttons">
                    <button class="payment-btn" data-method="credito" onclick="selectPaymentMethod('credito')">
                        <i class="fas fa-credit-card"></i> Crédito
                    </button>
                    <button class="payment-btn" data-method="debito" onclick="selectPaymentMethod('debito')">
                        <i class="fas fa-credit-card"></i> Débito
                    </button>
                    <button class="payment-btn" data-method="pix" onclick="selectPaymentMethod('pix')">
                        <i class="fas fa-qrcode"></i> Pix
                    </button>
                    <button class="payment-btn" data-method="dinheiro" onclick="selectPaymentMethod('dinheiro')">
                        <i class="fas fa-money-bill-wave"></i> Dinheiro
                    </button>
                </div>
            </div>
            
            <div class="cash-payment-section" id="cashPaymentSection" style="display: none;">
                <div class="cash-input-group">
                    <label for="cashAmount">Valor Recebido:</label>
                    <input type="number" id="cashAmount" placeholder="0.00" step="0.01" min="${total.toFixed(2)}">
                    <div class="change-display" id="changeDisplay"></div>
                </div>
            </div>
            
            <div class="finalize-section">
                <button class="finalize-btn" id="finalizeBtn" onclick="finalizeSale()" disabled>
                    FINALIZAR VENDA
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adicionar event listener para o campo de dinheiro
    const cashInput = document.getElementById('cashAmount');
    if (cashInput) {
        cashInput.addEventListener('input', calculateChange);
    }
}

// Função para fechar modal de checkout
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Função para diminuir quantidade
function decreaseQuantity(productId) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem && cartItem.quantity > 1) {
        cartItem.quantity -= 1;
        updateCheckoutModal();
        updateProductCounter(productId);
        updateFooter();
    }
}

// Função para aumentar quantidade
function increaseQuantity(productId) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
        updateCheckoutModal();
        updateProductCounter(productId);
        updateFooter();
    }
}

// Função para remover item do carrinho
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCheckoutModal();
    updateProductCounter(productId);
    updateFooter();
    
    // Se o carrinho ficou vazio, fechar o modal
    if (cart.length === 0) {
        closeCheckoutModal();
        showNotification('Carrinho vazio!', 'info');
    }
}

// Função para atualizar modal de checkout
function updateCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Atualizar lista de itens
    const cartItemsContainer = modal.querySelector('.cart-items-container');
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item-row" data-product-id="${item.id}">
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">R$ ${item.price.toFixed(2)}</span>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn minus-btn" onclick="decreaseQuantity(${item.id})">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn plus-btn" onclick="increaseQuantity(${item.id})">+</button>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id})">×</button>
            </div>
        </div>
    `).join('');
    
    // Atualizar total
    const totalAmount = modal.querySelector('.total-amount');
    if (totalAmount) {
        totalAmount.textContent = `R$ ${total.toFixed(2)}`;
    }
    
    // Atualizar valor mínimo do campo de dinheiro
    const cashInput = modal.querySelector('#cashAmount');
    if (cashInput) {
        cashInput.min = total.toFixed(2);
        if (cashInput.value && parseFloat(cashInput.value) < total) {
            cashInput.value = total.toFixed(2);
            calculateChange();
        }
    }
}

// Função para selecionar método de pagamento
function selectPaymentMethod(method) {
    // Remover seleção anterior
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Selecionar botão atual
    const selectedBtn = document.querySelector(`[data-method="${method}"]`);
    selectedBtn.classList.add('selected');
    
    // Mostrar/ocultar seção de dinheiro
    const cashSection = document.getElementById('cashPaymentSection');
    const finalizeBtn = document.getElementById('finalizeBtn');
    
    if (method === 'dinheiro') {
        cashSection.style.display = 'block';
        finalizeBtn.disabled = true;
    } else {
        cashSection.style.display = 'none';
        finalizeBtn.disabled = false;
    }
    
    // Armazenar método selecionado
    window.selectedPaymentMethod = method;
}

// Função para calcular troco
function calculateChange() {
    const cashInput = document.getElementById('cashAmount');
    const changeDisplay = document.getElementById('changeDisplay');
    const finalizeBtn = document.getElementById('finalizeBtn');
    
    if (!cashInput || !changeDisplay) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cashAmount = parseFloat(cashInput.value) || 0;
    
    if (cashAmount >= total) {
        const change = cashAmount - total;
        changeDisplay.innerHTML = `
            <span class="change-label">Troco:</span>
            <span class="change-amount">R$ ${change.toFixed(2)}</span>
        `;
        changeDisplay.className = 'change-display valid';
        finalizeBtn.disabled = false;
    } else {
        changeDisplay.innerHTML = `
            <span class="change-label">Valor insuficiente</span>
        `;
        changeDisplay.className = 'change-display invalid';
        finalizeBtn.disabled = true;
    }
}

// Função para finalizar venda
function finalizeSale() {
    const paymentMethod = window.selectedPaymentMethod;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (paymentMethod === 'dinheiro') {
        const cashAmount = parseFloat(document.getElementById('cashAmount').value) || 0;
        const change = cashAmount - total;
        
        showNotification(`Venda finalizada! Total: R$ ${total.toFixed(2)} | Recebido: R$ ${cashAmount.toFixed(2)} | Troco: R$ ${change.toFixed(2)}`, 'success');
    } else {
        // Para outros métodos, mostrar confirmação
        const confirmPayment = confirm(`Confirma o pagamento de R$ ${total.toFixed(2)} em ${paymentMethod.toUpperCase()}?`);
        if (!confirmPayment) return;
        
        showNotification(`Venda finalizada! Total: R$ ${total.toFixed(2)} | Método: ${paymentMethod.toUpperCase()}`, 'success');
    }
    
    // Limpar carrinho e fechar modal
    cart = [];
    closeCheckoutModal();
    updateFooter();
    renderProducts();
}

// Função para mostrar modal de editar categoria
function showEditCategoryModal(category) {
    const modal = document.createElement('div');
    modal.className = 'edit-category-modal';
    modal.id = 'editCategoryModal';
    
    modal.innerHTML = `
        <div class="edit-category-modal-content">
            <div class="edit-category-header">
                <h2>✏️ Editar Categoria</h2>
                <button class="close-edit-category-btn" onclick="closeEditCategoryModal()">×</button>
            </div>
            
            <form class="edit-category-form" onsubmit="updateCategory(event, ${category.id})">
                <div class="form-group">
                    <label for="editCategoryName">Nome da Categoria:</label>
                    <input type="text" id="editCategoryName" value="${category.name}" placeholder="Ex: Bebidas Quentes" required>
                </div>
                
                <div class="form-group">
                    <label for="editCategoryIcon">Ícone (FontAwesome):</label>
                    <input type="text" id="editCategoryIcon" value="${category.icon}" placeholder="Ex: fa fa-house" required>
                    <div class="input-help">
                        Sugestão: "fa fa-house" | 
                        <a href="https://fontawesome.com/search?ic=free&o=r" target="_blank" rel="noopener">
                            Consultar ícones disponíveis
                        </a>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editCategoryColor">Cor:</label>
                    <input type="text" id="editCategoryColor" value="${category.color}" placeholder="Ex: blue" required>
                    <div class="input-help">
                        Sugestão: "blue", "red", "green", "#FF6B6B", etc.
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Preview:</label>
                    <div class="category-preview" id="categoryPreview">
                        <i class="${category.icon}" style="color: ${category.color}"></i>
                        <span>${category.name}</span>
                    </div>
                </div>
                
                <div class="edit-category-actions">
                    <button type="button" class="cancel-btn" onclick="closeEditCategoryModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="save-category-btn" id="updateCategoryBtn">
                        Atualizar Categoria
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focar no primeiro campo
    setTimeout(() => {
        const nameInput = document.getElementById('editCategoryName');
        nameInput.focus();
        
        // Permitir salvar com Enter
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateCategory(e, category.id);
            }
        });
        
        // Permitir navegar entre campos com Tab
        const iconInput = document.getElementById('editCategoryIcon');
        const colorInput = document.getElementById('editCategoryColor');
        
        iconInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateCategory(e, category.id);
            }
        });
        
        colorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateCategory(e, category.id);
            }
        });
        
        // Atualizar preview em tempo real
        const updatePreview = () => {
            const preview = document.getElementById('categoryPreview');
            const previewIcon = preview.querySelector('i');
            const previewText = preview.querySelector('span');
            
            previewIcon.className = iconInput.value;
            previewIcon.style.color = colorInput.value;
            previewText.textContent = nameInput.value;
        };
        
        nameInput.addEventListener('input', updatePreview);
        iconInput.addEventListener('input', updatePreview);
        colorInput.addEventListener('input', updatePreview);
    }, 100);
}

// Função para fechar modal de editar categoria
function closeEditCategoryModal() {
    const modal = document.getElementById('editCategoryModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Função para atualizar categoria
async function updateCategory(event, categoryId) {
    event.preventDefault();
    
    const nameInput = document.getElementById('editCategoryName');
    const iconInput = document.getElementById('editCategoryIcon');
    const colorInput = document.getElementById('editCategoryColor');
    const updateBtn = document.getElementById('updateCategoryBtn');
    
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim();
    const color = colorInput.value.trim();
    
    // Validação básica
    if (!name || !icon || !color) {
        showNotification('❌ Todos os campos são obrigatórios!', 'error');
        return;
    }
    
    // Verificar se houve mudanças
    const originalCategory = categories.find(cat => cat.id === categoryId);
    if (!originalCategory) {
        showNotification('❌ Categoria não encontrada!', 'error');
        return;
    }
    
    const hasChanges = name !== originalCategory.name || 
                      icon !== originalCategory.icon || 
                      color !== originalCategory.color;
    
    if (!hasChanges) {
        showNotification('ℹ️ Nenhuma alteração foi feita!', 'info');
        closeEditCategoryModal();
        return;
    }
    
    // Se o nome mudou, verificar se já existe uma categoria com esse nome
    if (name !== originalCategory.name) {
        const existingCategory = categories.find(cat => cat.name === name && cat.id !== categoryId);
        if (existingCategory) {
            showNotification('❌ Já existe uma categoria com esse nome!', 'error');
            return;
        }
    }
    
    // Desabilitar botão durante a atualização
    updateBtn.disabled = true;
    updateBtn.textContent = 'Atualizando...';
    
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        showNotification('🔄 Atualizando categoria...', 'info');
        
        // Atualizar categoria no Supabase
        const { data, error } = await supabase
            .from('category')
            .update({
                name: name,
                icon: icon,
                color: color
            })
            .eq('id', categoryId)
            .select();
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            const updatedCategory = data[0];
            
            // Atualizar na lista local
            const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
            if (categoryIndex !== -1) {
                categories[categoryIndex] = updatedCategory;
                
                // Reordenar por nome
                categories.sort((a, b) => a.name.localeCompare(b.name));
                
                // Re-renderizar categorias
                renderCategories();
                
                // Fechar modal
                closeEditCategoryModal();
                
                showNotification(`✅ Categoria "${name}" atualizada com sucesso!`, 'success');
                
                // Se houver produtos filtrados por esta categoria, atualizar a exibição
                const currentlySelectedCategory = getCurrentlySelectedCategory();
                if (currentlySelectedCategory && currentlySelectedCategory.id === categoryId) {
                    // Atualizar nome da categoria nos produtos filtrados
                    filteredProducts.forEach(product => {
                        if (product.categoryId === categoryId) {
                            product.category = name;
                        }
                    });
                    renderProducts();
                }
            } else {
                throw new Error('Categoria não encontrada na lista local');
            }
        } else {
            throw new Error('Nenhum dado retornado do Supabase');
        }
        
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        showNotification(`❌ Erro ao atualizar categoria: ${error.message}`, 'error');
    } finally {
        // Reabilitar botão
        updateBtn.disabled = false;
        updateBtn.textContent = 'Atualizar Categoria';
    }
}

// =====================
// Edição de Produto
// =====================

function showEditProductModal(product) {
    const modal = document.createElement('div');
    modal.className = 'edit-product-modal';
    modal.id = 'editProductModal';
    
    const categoryOptions = categories.map(category => {
        const selected = category.id === product.categoryId ? 'selected' : '';
        return `<option value="${category.id}" ${selected}>${category.name}</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="edit-product-modal-content">
            <div class="edit-product-header">
                <h2>✏️ Editar Produto</h2>
                <button class="close-edit-product-btn" onclick="closeEditProductModal()">×</button>
            </div>
            
            <form class="edit-product-form" onsubmit="updateProduct(event, ${product.id})">
                <div class="form-group">
                    <label for="editProductName">Nome do Produto:</label>
                    <input type="text" id="editProductName" value="${product.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="editProductPrice">Preço (R$):</label>
                    <input type="number" id="editProductPrice" value="${product.price}" step="0.01" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="editProductCategory">Categoria:</label>
                    <select id="editProductCategory" required>
                        ${categoryOptions}
                    </select>
                </div>
                
                <div class="edit-product-actions">
                    <button type="button" class="cancel-btn" onclick="closeEditProductModal()">Cancelar</button>
                    <button type="submit" class="save-category-btn" id="updateProductBtn">Atualizar Produto</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        const nameInput = document.getElementById('editProductName');
        nameInput.focus();
        const submitOnEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); updateProduct(e, product.id); } };
        nameInput.addEventListener('keydown', submitOnEnter);
        document.getElementById('editProductPrice').addEventListener('keydown', submitOnEnter);
        document.getElementById('editProductCategory').addEventListener('keydown', submitOnEnter);
    }, 50);
}

function closeEditProductModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function updateProduct(event, productId) {
    event.preventDefault();
    const nameInput = document.getElementById('editProductName');
    const priceInput = document.getElementById('editProductPrice');
    const categorySelect = document.getElementById('editProductCategory');
    const updateBtn = document.getElementById('updateProductBtn');
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const categoryId = parseInt(categorySelect.value);
    
    if (!name || isNaN(price) || price <= 0 || !categoryId) {
        showNotification('❌ Preencha corretamente: nome, preço (>0) e categoria.', 'error');
        return;
    }
    
    const original = products.find(p => p.id === productId);
    if (!original) {
        showNotification('❌ Produto não encontrado!', 'error');
        return;
    }
    
    const hasChanges = name !== original.name || price !== original.price || categoryId !== original.categoryId;
    if (!hasChanges) {
        showNotification('ℹ️ Nenhuma alteração foi feita!', 'info');
        closeEditProductModal();
        return;
    }
    
    updateBtn.disabled = true;
    updateBtn.textContent = 'Atualizando...';
    
    try {
        if (!supabase) throw new Error('Cliente Supabase não inicializado');
        showNotification('🔄 Atualizando produto...', 'info');
        
        const { data, error } = await supabase
            .from('product')
            .update({ name, price, categoryId })
            .eq('id', productId)
            .select(`
                id,
                name,
                price,
                categoryId,
                category:categoryId(id, name, icon)
            `);
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Nenhum dado retornado do Supabase');
        
        const updated = data[0];
        const processed = {
            id: updated.id,
            name: updated.name,
            price: updated.price,
            categoryId: updated.categoryId,
            category: updated.category?.name || 'Sem Categoria',
            icon: updated.category?.icon || 'fas fa-box'
        };
        
        // Atualizar lista local
        const idx = products.findIndex(p => p.id === productId);
        if (idx !== -1) {
            products[idx] = processed;
        }
        
        // Reaplicar filtro atual
        const currentSelected = categoriesGrid.querySelector('.category-card.selected');
        if (currentSelected) {
            const selectedName = currentSelected.querySelector('h3').textContent;
            filterByCategory(selectedName);
        } else {
            filteredProducts = [...products];
            renderProducts();
        }
        
        closeEditProductModal();
        showNotification(`✅ Produto "${name}" atualizado com sucesso!`, 'success');
        updateFooter();
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        showNotification(`❌ Erro ao atualizar produto: ${err.message}`, 'error');
    } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Atualizar Produto';
    }
}

// Adicionar botões de desenvolvimento ao footer (remover em produção)
document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('.footer-info');
    
    const devButtons = document.createElement('div');
    devButtons.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 15px;
        justify-content: center;
        width: 100%;
    `;
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Limpar Carrinho';
    clearBtn.onclick = clearCart;
    clearBtn.style.cssText = `
        padding: 8px 16px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
    `;
    
    const checkoutBtn = document.createElement('button');
    checkoutBtn.textContent = 'Finalizar Compra';
    checkoutBtn.onclick = checkout;
    checkoutBtn.style.cssText = `
        padding: 8px 16px;
        background: #27ae60;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
    `;
    

    
    devButtons.appendChild(clearBtn);
    devButtons.appendChild(checkoutBtn);
    footer.appendChild(devButtons);
});

// Ajustar altura visual para mobile
function adjustVisualHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
// Executar no carregamento e redimensionamento
window.addEventListener('load', adjustVisualHeight);
window.addEventListener('resize', adjustVisualHeight);
window.addEventListener('orientationchange', adjustVisualHeight);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js')
        .then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(function(error) {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
  
  // Detectar se está em modo standalone (tela cheia)
  function isRunningStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator.standalone) || 
           (document.referrer.includes('android-app://'));
  }
  
  // Ajustar interface para modo tela cheia
  if (isRunningStandalone()) {
    document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    
    // Adicionar classe para ajustes específicos
    document.body.classList.add('pwa-mode');
  }

