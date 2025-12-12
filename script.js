// Sistema de dados local (migrado de Supabase para JSON)
// dataStore é inicializado em data-store.js
// currentUser é gerenciado por auth.js (NÃO redeclare aqui!)

// Variáveis globais
let categories = []; // Será preenchida do data-store local
let products = []; // Será preenchida do data-store local
let filteredProducts = []; // Produtos filtrados
// currentUser is declared in auth.js, not here!

// Carrinho de compras
let cart = [];

// Vendas salvas (localStorage)
let savedSales = [];

// Rastreamento da venda atual (para preservar nome ao re-salvar)
let currentSaleName = null;

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

// Inicialização - função reutilizável
async function performInitialization() {
    console.log('[performInitialization] ====== START ======');
    try {
        // Verificar autenticação (carrega sessão do localStorage se existir)
        console.log('[performInitialization] Calling initAuth()...');
        const isAuthenticated = await initAuth();
        console.log('[performInitialization] initAuth() returned:', isAuthenticated);
        
        if (!isAuthenticated) {
            // Mostrar tela de login
            console.log('[performInitialization] User NOT authenticated');
            console.log('[performInitialization] Showing auth screen...');
            showAuthScreen();
            console.log('[performInitialization] ====== Auth screen shown ======');
            return;
        }
        
        // Inicializar app
        console.log('[performInitialization] User IS authenticated');
        console.log('[performInitialization] Initializing app...');
        await initializeApp();
        console.log('[performInitialization] ====== App initialized ======');
    } catch (error) {
        console.error('[performInitialization] ====== ERROR ======');
        console.error('[performInitialization] Error:', error);
        console.error('[performInitialization] Stack:', error.stack);
    }
}

// Ouvir DOMContentLoaded se ainda não foi disparado
console.log('[script.js] document.readyState:', document.readyState);
if (document.readyState === 'loading') {
    console.log('[script.js] DOM still loading, adding DOMContentLoaded listener...');
    document.addEventListener('DOMContentLoaded', performInitialization);
} else {
    console.log('[script.js] DOM already loaded, calling initialization immediately...');
    // DOM já está carregado, executar imediatamente
    performInitialization();
}

async function initializeApp() {
    // Pequeno delay para garantir que o DOM está pronto
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Inicializar elementos DOM
    initializeDOMReferences();
    
    // Carregar dados locais
    loadCategoriesFromLocalStorage();
    loadProductsFromLocalStorage();
    renderCategories();
    renderProducts();
    updateFooter();
    addUserInfoToHeader();
}

/**
 * Inicializa referências aos elementos DOM
 */
function initializeDOMReferences() {
    categoriesGrid = document.getElementById('categoriesGrid') || document.querySelector('.categories-grid');
    productsGrid = document.getElementById('productsGrid') || document.querySelector('.products-grid');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.querySelector('.search-btn');
    clearSearchBtn = document.getElementById('clearSearchBtn');
    totalProducts = document.getElementById('totalProducts');
    cartItems = document.getElementById('cartItems');
    cartValue = document.getElementById('cartValue');
    
    // Registrar event listeners
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
}

// Carregar categorias do localStorage
function loadCategoriesFromLocalStorage() {
    try {
        // Carregar categorias do data-store local
        categories = dataStore.getCategories();
        if (categories && categories.length > 0) {
            console.log('Categorias carregadas do localStorage:', categories);
            renderCategories();
        } else {
            console.warn('Nenhuma categoria encontrada');
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Carregar produtos do localStorage
function loadProductsFromLocalStorage() {
    try {
        // Carregar produtos do data-store local
        products = dataStore.getProducts().map(product => ({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            category_id: product.category_id
        }));
        
        filteredProducts = [...products];
        console.log('Produtos carregados do localStorage:', products);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
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
        categoryCard.addEventListener('click', () => filterByCategory(category.id));

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
    const saveSaleModal = document.getElementById('saveSaleModal');

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

    if (saveSaleModal && event.target === saveSaleModal) {
        closeSaveSaleModal();
    }
});

// Event listener para fechar modal com tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const categoryModal = document.getElementById('addCategoryModal');
        const editCategoryModal = document.getElementById('editCategoryModal');
        const editProductModal = document.getElementById('editProductModal');
        const productModal = document.getElementById('addProductModal');
        const saveSaleModal = document.getElementById('saveSaleModal');
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
        if (saveSaleModal) {
            closeSaveSaleModal();
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
        showNotification('🔄 Salvando nova categoria...', 'info');
        
        // Gerar novo ID (maior ID existente + 1)
        const maxId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) : 0;
        const newId = maxId + 1;
        
        // Criar novo objeto de categoria
        const newCategory = {
            id: newId,
            name: name,
            icon: icon,
            color: color,
            created_at: new Date().toISOString()
        };
        
        // Adicionar à lista local
        categories.push(newCategory);
        
        // Reordenar por nome
        categories.sort((a, b) => a.name.localeCompare(b.name));
        
        // Salvar no dataStore (localStorage + data.json)
        const data = dataStore.getData();
        data.categories = categories;
        dataStore.saveData(data);
        
        // Re-renderizar categorias
        renderCategories();
        
        // Fechar modal
        closeAddCategoryModal();
        
        showNotification(`✅ Categoria "${name}" criada com sucesso!`, 'success');
        
        // Limpar formulário
        nameInput.value = '';
        iconInput.value = '';
        colorInput.value = '';
        
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
        showNotification('🔄 Salvando novo produto...', 'info');
        
        // Gerar novo ID (maior ID existente + 1)
        const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
        const newId = maxId + 1;
        
        // Criar novo objeto de produto
        const newProduct = {
            id: newId,
            name: name,
            category_id: categoryId,
            price: price,
            created_at: new Date().toISOString()
        };
        
        // Adicionar à lista local
        products.push(newProduct);
        
        // Reordenar por nome
        products.sort((a, b) => a.name.localeCompare(b.name));
        
        // Salvar no dataStore (localStorage + data.json)
        const data = dataStore.getData();
        data.products = products;
        dataStore.saveData(data);
        
        // Verificar se deve filtrar por categoria
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        console.log('Categoria selecionada para o novo produto:', selectedCategory);
        
        if (selectedCategory) {
            console.log('Atualizando seleção visual e filtrando por:', selectedCategory.name);
            // Sempre atualizar a seleção visual para a nova categoria
            updateCategorySelection(selectedCategory.name);
            // Sempre filtrar produtos pela nova categoria
            filterByCategory(selectedCategory.id);
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
        
        // Encontrar a categoria do produto para obter a cor e nome
        const productCategory = categories.find(cat => cat.id === product.category_id);
        const categoryColor = productCategory ? productCategory.color : '#667eea'; // Fallback para cor padrão
        const categoryName = productCategory ? productCategory.name : 'Sem Categoria'; // Fallback para nome
        const textColor = getContrastTextColor(categoryColor);
        
        productCard.innerHTML = `
            <button class="card-edit-btn" title="Editar" type="button">
                <i class="fas fa-pen"></i>
            </button>
            <div class="product-image" style="background: ${categoryColor}; color: ${textColor}">
                <i class="${productCategory?.icon || 'fas fa-box'}"></i>
            </div>
            <div class="product-info">
                <div class="product-name-container">
                    <h3 class="product-name">${product.name}</h3>
                    ${quantity > 0 ? `<span class="product-counter">${quantity}</span>` : ''}
                </div>
                <div class="product-category">${categoryName}</div>
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
function filterByCategory(categoryId) {
    console.log('Filtrando por categoria ID:', categoryId);
    console.log('Produtos disponíveis:', products.map(p => ({ name: p.name, category_id: p.category_id })));
    
    if (categoryId === 'Todas') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category_id === categoryId);
    }
    
    console.log('Produtos filtrados:', filteredProducts.map(p => ({ name: p.name, category_id: p.category_id })));
    
    renderProducts();
    updateFooter();
    
    // Remover seleção anterior de todas as categorias
    const allCategories = categoriesGrid.querySelectorAll('.category-card');
    allCategories.forEach(card => {
        card.style.borderColor = 'transparent';
        card.classList.remove('selected');
    });
    
    // Destacar categoria selecionada
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
        const selectedCard = Array.from(allCategories).find(card => 
            card.querySelector('h3').textContent === selectedCategory.name
        );
        if (selectedCard) {
            selectedCard.style.borderColor = '#667eea';
            selectedCard.classList.add('selected');
        }
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

// =====================
// Funções para Vendas Salvas
// =====================

// Carregar vendas salvas do localStorage
function loadSavedSales() {
    try {
        const saved = localStorage.getItem('savedSales');
        savedSales = saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Erro ao carregar vendas salvas:', error);
        savedSales = [];
    }
}

// Salvar vendas no localStorage
function saveSalesToStorage() {
    try {
        localStorage.setItem('savedSales', JSON.stringify(savedSales));
    } catch (error) {
        console.error('Erro ao salvar vendas:', error);
    }
}

// Mostrar modal para guardar venda
function showSaveSaleModal() {
    if (cart.length === 0) {
        showNotification('Carrinho vazio! Adicione produtos antes de guardar.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'save-sale-modal';
    modal.id = 'saveSaleModal';

    // Verificar se o carrinho atual veio de uma venda salva
    let defaultName = '';
    if (currentSaleName) {
        // Se veio de uma venda salva, usar o nome original
        defaultName = currentSaleName;
    } else {
        // Se é um carrinho novo, sugerir nome baseado na data/hora atual
        const now = new Date();
        defaultName = `Mesa ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    modal.innerHTML = `
        <div class="save-sale-modal-content">
            <div class="save-sale-header">
                <h2>💾 Guardar Venda</h2>
                <button class="close-save-sale-btn" onclick="closeSaveSaleModal()">×</button>
            </div>

            <form class="save-sale-form" onsubmit="saveSale(event)">
                <div class="form-group">
                    <label for="saleName">Nome da Venda:</label>
                    <input type="text" id="saleName" value="${defaultName}" placeholder="Ex: Mesa 1, Cliente João" required>
                    <div class="input-help">
                        Este nome será usado para identificar a venda guardada
                    </div>
                </div>

                <div class="cart-preview">
                    <h4>Itens no Carrinho:</h4>
                    <div class="cart-preview-items">
                        ${cart.map(item => `
                            <div class="preview-item">
                                <span>${item.name}</span>
                                <span>${item.quantity}x R$ ${item.price.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cart-preview-total">
                        <strong>Total: R$ ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</strong>
                    </div>
                </div>

                <div class="save-sale-actions">
                    <button type="button" class="cancel-btn" onclick="closeSaveSaleModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="save-sale-btn" id="saveSaleBtn">
                        Guardar Venda
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Focar no campo de nome
    setTimeout(() => {
        document.getElementById('saleName').focus();
    }, 100);
}

// Fechar modal de guardar venda
function closeSaveSaleModal() {
    const modal = document.getElementById('saveSaleModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Salvar venda
function saveSale(event) {
    event.preventDefault();

    const nameInput = document.getElementById('saleName');
    const saveBtn = document.getElementById('saveSaleBtn');

    const name = nameInput.value.trim();

    if (!name) {
        showNotification('❌ Digite um nome para a venda!', 'error');
        return;
    }

    // Verificar se já existe uma venda com esse nome
    const existingSale = savedSales.find(sale => sale.name === name);
    if (existingSale) {
        if (!confirm(`Já existe uma venda com o nome "${name}". Deseja sobrescrever?`)) {
            return;
        }
        // Remover venda existente
        savedSales = savedSales.filter(sale => sale.name !== name);
    }

    // Desabilitar botão durante o salvamento
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    try {
        // Criar objeto da venda salva
        const savedSale = {
            name: name,
            cart: [...cart], // Copia profunda do carrinho
            timestamp: new Date().toISOString(),
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        // Adicionar à lista de vendas salvas
        savedSales.push(savedSale);

        // Salvar no localStorage
        saveSalesToStorage();

        // Limpar carrinho
        cart = [];

        // Atualizar interface
        updateFooter();
        renderProducts();
        renderSavedSales();

        // Fechar modal
        closeSaveSaleModal();

        showNotification(`✅ Venda "${name}" guardada com sucesso!`, 'success');

    } catch (error) {
        console.error('Erro ao salvar venda:', error);
        showNotification('❌ Erro ao guardar venda!', 'error');
    } finally {
        // Reabilitar botão
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Venda';
    }
}

// Renderizar lista de vendas salvas
function renderSavedSales() {
    const savedSalesList = document.getElementById('savedSalesList');
    const savedSalesContainer = document.getElementById('savedSalesContainer');

    if (!savedSalesList || !savedSalesContainer) return;

    if (savedSales.length === 0) {
        savedSalesList.style.display = 'none';
        return;
    }

    savedSalesList.style.display = 'block';
    savedSalesContainer.innerHTML = '';

    savedSales.forEach((sale, index) => {
        const saleItem = document.createElement('div');
        saleItem.className = 'saved-sale-item';
        saleItem.onclick = () => loadSavedSale(index);

        const date = new Date(sale.timestamp);
        const timeString = date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        saleItem.innerHTML = `
            <div class="saved-sale-info">
                <span class="saved-sale-name">${sale.name}</span>
                <span class="saved-sale-details">
                    ${sale.cart.length} itens • R$ ${sale.total.toFixed(2)} • ${timeString}
                </span>
            </div>
            <button class="remove-saved-sale-btn" onclick="removeSavedSale(event, ${index})" title="Remover">
                ×
            </button>
        `;

        savedSalesContainer.appendChild(saleItem);
    });
}

// Carregar venda salva
function loadSavedSale(index) {
    if (cart.length > 0) {
        showNotification('Existe uma venda em andamento. Finalize ou guarde antes de abrir uma venda salva.', 'error');
        return;
    }

    const sale = savedSales[index];
    if (!sale) {
        showNotification('❌ Venda não encontrada!', 'error');
        return;
    }

    // Carregar carrinho da venda salva
    cart = [...sale.cart];

    // Definir o nome da venda atual para preservar ao re-salvar
    currentSaleName = sale.name;

    // Remover venda da lista de salvas
    savedSales.splice(index, 1);
    saveSalesToStorage();

    // Atualizar interface
    updateFooter();
    renderProducts();
    renderSavedSales();

    showNotification(`✅ Venda "${sale.name}" carregada!`, 'success');
}

// Remover venda salva
function removeSavedSale(event, index) {
    event.stopPropagation();

    const sale = savedSales[index];
    if (!sale) return;

    if (confirm(`Remover venda "${sale.name}"?`)) {
        savedSales.splice(index, 1);
        saveSalesToStorage();
        renderSavedSales();
        showNotification(`Venda "${sale.name}" removida!`, 'info');
    }
}

// Limpar vendas salvas ao finalizar venda
function clearSavedSaleOnFinalization() {
    // Esta função será chamada quando uma venda for finalizada
    // Por enquanto, não faz nada específico, mas pode ser expandida
    // para limpar vendas salvas relacionadas se necessário
}

// Inicializar vendas salvas
document.addEventListener('DOMContentLoaded', function() {
    loadSavedSales();
    renderSavedSales();
});

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
async function finalizeSale() {
    try {
        const paymentMethod = window.selectedPaymentMethod;
        if (!paymentMethod) {
            showNotification('Selecione uma forma de pagamento!', 'error');
            return;
        }

        // Validar se há itens no carrinho
        if (!cart || cart.length === 0) {
            showNotification('Carrinho vazio!', 'error');
            return;
        }

        // Formatar valores numéricos corretamente
        const total = Number(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
        
        if (paymentMethod === 'dinheiro') {
            const cashAmount = parseFloat(document.getElementById('cashAmount').value) || 0;
            if (cashAmount < total) {
                showNotification('Valor em dinheiro insuficiente!', 'error');
                return;
            }
        }

        // 1. Salvar a venda principal (no data-store local)
        const saleData = dataStore.addSale({
            total_value: total,
            payment_method: paymentMethod
        });

        // 2. Preparar e salvar os itens da venda
        const saleItems = cart.map(item => {
            const unitPrice = Number(item.price.toFixed(2));
            const quantity = Number(item.quantity);
            const subtotal = Number((unitPrice * quantity).toFixed(2));

            const category = categories.find(c => c.id === item.category_id);

            return {
                sale_id: saleData.id,
                category_id: item.category_id,
                category_name: category ? category.name : 'Sem categoria',
                product_id: item.id,
                product_name: item.name,
                quantity: quantity,
                unit_price: unitPrice,
                subtotal: subtotal
            };
        });

        // Salvar cada item no data-store
        saleItems.forEach(item => dataStore.addSaleItem(item));

        console.log('Venda salva com sucesso:', { sale: saleData, items: saleItems });

        if (paymentMethod === 'dinheiro') {
            const cashAmount = parseFloat(document.getElementById('cashAmount').value);
            const change = cashAmount - total;
            showNotification(`Venda finalizada! Total: R$ ${total.toFixed(2)} | Recebido: R$ ${cashAmount.toFixed(2)} | Troco: R$ ${change.toFixed(2)}`, 'success');
        } else {
            showNotification(`Venda finalizada! Total: R$ ${total.toFixed(2)} | Método: ${paymentMethod.toUpperCase()}`, 'success');
        }
        
        // Limpar carrinho e fechar modal
        cart = [];
        closeCheckoutModal();
        updateFooter();
        renderProducts();

    } catch (error) {
        console.error('Erro ao finalizar venda:', error);
        showNotification('Erro ao finalizar venda. Tente novamente.', 'error');
    }
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
                <div class="delete-category-section">
                    <button type="button" class="delete-category-btn" onclick="confirmDeleteCategory(${category.id})" title="Deletar categoria">
                        <i class="fas fa-trash-alt"></i>
                        Excluir Categoria
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
        showNotification('🔄 Atualizando categoria...', 'info');
        
        // Atualizar categoria na lista local
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex !== -1) {
            categories[categoryIndex].name = name;
            categories[categoryIndex].icon = icon;
            categories[categoryIndex].color = color;
            
            // Reordenar por nome
            categories.sort((a, b) => a.name.localeCompare(b.name));
            
            // Salvar no dataStore
            const data = dataStore.getData();
            data.categories = categories;
            dataStore.saveData(data);
            
            // Re-renderizar categorias
            renderCategories();
            
            // Fechar modal
            closeEditCategoryModal();
            
            showNotification(`✅ Categoria "${name}" atualizada com sucesso!`, 'success');
            
            // Se houver produtos filtrados por esta categoria, atualizar a exibição
            const currentlySelectedCategory = getCurrentlySelectedCategory();
            if (currentlySelectedCategory && currentlySelectedCategory.id === categoryId) {
                // Filtrar novamente para atualizar
                filterByCategory(categoryId);
            }
        } else {
            throw new Error('Categoria não encontrada na lista local');
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
        const selected = category.id === product.category_id ? 'selected' : '';
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

                <div class="delete-product-section" style="margin-top: 40px; text-align: center;">
                    <button type="button" class="delete-product-btn" id="deleteProductBtn" onclick="confirmDeleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Excluir Produto
                    </button>
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

    const hasChanges = name !== original.name || price !== original.price || categoryId !== original.category_id;
    if (!hasChanges) {
        showNotification('ℹ️ Nenhuma alteração foi feita!', 'info');
        closeEditProductModal();
        return;
    }

    updateBtn.disabled = true;
    updateBtn.textContent = 'Atualizando...';

    try {
        showNotification('🔄 Atualizando produto...', 'info');

        // Atualizar produto na lista local
        const idx = products.findIndex(p => p.id === productId);
        if (idx !== -1) {
            products[idx].name = name;
            products[idx].price = price;
            products[idx].category_id = categoryId;
            
            // Salvar no dataStore
            const data = dataStore.getData();
            data.products = products;
            dataStore.saveData(data);
        }

        // Reaplicar filtro atual
        const currentSelected = categoriesGrid.querySelector('.category-card.selected');
        if (currentSelected) {
            const selectedName = currentSelected.querySelector('h3').textContent;
            const selectedCategory = categories.find(cat => cat.name === selectedName);
            if (selectedCategory) {
                filterByCategory(selectedCategory.id);
            }
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

// Função para confirmar exclusão do produto
// =====================
// Exclusão de Categoria
// =====================

function confirmDeleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('❌ Categoria não encontrada!', 'error');
        return;
    }

    // Verificar se há produtos nessa categoria
    const productsInCategory = products.filter(p => p.category_id === categoryId);
    if (productsInCategory.length > 0) {
        showNotification(
            `❌ Não é possível excluir a categoria "${category.name}" porque ela possui ${productsInCategory.length} produto(s).\n\nRemova todos os produtos primeiro.`,
            'error'
        );
        return;
    }

    const confirmed = confirm(`Exclusão é irreversível.\n\nDeseja realmente excluir a categoria "${category.name}"?`);

    if (confirmed) {
        deleteCategory(categoryId);
    }
}

// Função para excluir categoria
async function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('❌ Categoria não encontrada!', 'error');
        return;
    }

    // Validação: verificar se há produtos nessa categoria
    const productsInCategory = products.filter(p => p.category_id === categoryId);
    if (productsInCategory.length > 0) {
        showNotification(
            `❌ Não é possível excluir a categoria porque ela possui ${productsInCategory.length} produto(s).`,
            'error'
        );
        return;
    }

    // Se passou nas validações, prosseguir com a exclusão
    const deleteBtn = document.querySelector('.delete-category-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    }

    try {
        showNotification('🔄 Excluindo categoria...', 'info');

        // Remover da lista local
        categories = categories.filter(c => c.id !== categoryId);
        
        // Salvar no dataStore
        const data = dataStore.getData();
        data.categories = categories;
        dataStore.saveData(data);

        // Re-renderizar categorias
        renderCategories();

        // Fechar modal
        closeEditCategoryModal();

        showNotification(`✅ Categoria "${category.name}" excluída com sucesso!`, 'success');

    } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        showNotification(`❌ Erro ao excluir categoria: ${err.message}`, 'error');
    }
}

// =====================
// Exclusão de Produto
// =====================

function confirmDeleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('❌ Produto não encontrado!', 'error');
        return;
    }

    const confirmed = confirm(`Exclusão é irreversível. O produto não poderá estar no seu carrinho de compras para excluir nem Guardado.\n\nDeseja realmente excluir o produto "${product.name}"?`);

    if (confirmed) {
        deleteProduct(productId);
    }
}

// Função para excluir produto
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('❌ Produto não encontrado!', 'error');
        return;
    }

    // Validação: verificar se produto está no carrinho
    const isInCart = cart.some(item => item.id === productId);
    if (isInCart) {
        showNotification('❌ Não é possível excluir o produto porque ele está no carrinho de compras!', 'error');
        return;
    }

    // Validação: verificar se produto está em vendas salvas
    const isInSavedSales = savedSales.some(sale =>
        sale.cart.some(item => item.id === productId)
    );
    if (isInSavedSales) {
        showNotification('❌ Não é possível excluir o produto porque ele está em vendas guardadas!', 'error');
        return;
    }

    // Se passou nas validações, prosseguir com a exclusão
    const deleteBtn = document.getElementById('deleteProductBtn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    }

    try {
        showNotification('🔄 Excluindo produto...', 'info');

        // Remover da lista local
        products = products.filter(p => p.id !== productId);
        filteredProducts = filteredProducts.filter(p => p.id !== productId);
        
        // Salvar no dataStore
        const data = dataStore.getData();
        data.products = products;
        dataStore.saveData(data);

        // Re-renderizar produtos
        renderProducts();

        // Fechar modal
        closeEditProductModal();

        // Atualizar footer
        updateFooter();

        showNotification(`✅ Produto "${product.name}" excluído com sucesso!`, 'success');

    } catch (err) {
        console.error('Erro ao excluir produto:', err);
        showNotification(`❌ Erro ao excluir produto: ${err.message}`, 'error');
    } finally {
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir Produto';
        }
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
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar Venda';
    saveBtn.onclick = showSaveSaleModal;
    saveBtn.style.cssText = `
        padding: 8px 16px;
        background: #f39c12;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        font-size: small;
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
        font-size: small;
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
        width: -webkit-fill-available;
        font-size: larger;
    `;


    
    devButtons.appendChild(saveBtn);
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
  
  // =====================
  // Exportação de Dados
  // =====================
  
  /**
   * Exporta todos os dados do localStorage como arquivo JSON
   * O usuário pode baixar e atualizar manualmente a base de dados
   */
  function exportDataAsJSON() {
    try {
      // Obter dados do dataStore
      const data = dataStore.getData();
      
      // Criar objeto com timestamp
      const exportData = {
        ...data,
        exported_at: new Date().toISOString(),
        exported_by: currentUser?.email || 'unknown'
      };
      
      // Converter para JSON com formatação
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Criar blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Criar URL
      const url = URL.createObjectURL(blob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = `padaria-dados-${new Date().toISOString().split('T')[0]}.json`;
      
      // Disparar download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar URL
      URL.revokeObjectURL(url);
      
      showNotification('✅ Dados exportados com sucesso!', 'success');
      console.log('[exportDataAsJSON] Arquivo baixado:', link.download);
    } catch (error) {
      console.error('[exportDataAsJSON] Erro ao exportar dados:', error);
      showNotification(`❌ Erro ao exportar dados: ${error.message}`, 'error');
    }
  }
  
  // =====================
  // Detecção PWA
  // =====================
  
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
    document.body.classList.add('pwa-mode');
    // Forçar altura 100vh para Android Chrome
    document.body.style.height = '100vh';
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
    document.body.classList.add('pwa-mode');
    // Forçar altura 100vh para Android Chrome
    document.body.style.height = '100vh';
}
