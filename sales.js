// Configuração do Supabase
const SUPABASE_URL = 'https://nqplihfmbwlrbyzbxilh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGxpaGZtYndscmJ5emJ4aWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjEzODQsImV4cCI6MjA3MTg5NzM4NH0.mn_2tyTloRpvUxPmyU7jWt1YYSa7Y3FRFGe0B4nGXSA';

// Variáveis globais
let supabase = null;
let currentUser = null;
let allSales = []; // Todas as vendas carregadas
let filteredSales = []; // Vendas filtradas

// Elementos DOM
let salesList = null;
let loadingIndicator = null;
let dateFilter = null;
let totalSales = null;
let totalRevenue = null;
let todaySales = null;

// Detectar o caminho base automaticamente
const BASE_PATH = window.location.pathname.split('/').slice(0, -1).join('/') + '/';
console.log('Base path detectado:', BASE_PATH);

// Função para converter UTC para horário local (UTC-3 - Brasília)
function convertToLocalTime(utcDateString) {
    const utcDate = new Date(utcDateString);
    // Subtrair 3 horas para converter UTC para UTC-3 (Brasília)
    // Nota: getTimezoneOffset() retorna diferença em minutos, então convertemos
    const localDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
    return localDate;
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar Supabase primeiro
    await initializeSupabase();

    // Verificar autenticação
    await checkAuthStatus();

    // Se não estiver autenticado, redirecionar para index
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Inicializar elementos DOM
    initializeDOMElements();

    // Carregar vendas
    await loadSales();
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
                const { data: authData, error: authError } = await supabase
                    .from('authorized_users')
                    .select('*')
                    .eq('email', session.user.email)
                    .eq('is_active', true)
                    .single();

                if (authError || !authData) {
                    console.log('Usuário não autorizado:', session.user.email);
                    await supabase.auth.signOut();
                    return;
                }

                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: authData.name,
                    role: authData.role
                };

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

// Inicializar elementos DOM
function initializeDOMElements() {
    salesList = document.getElementById('salesList');
    loadingIndicator = document.getElementById('loadingIndicator');
    dateFilter = document.getElementById('dateFilter');
    totalSales = document.getElementById('totalSales');
    totalRevenue = document.getElementById('totalRevenue');
    todaySales = document.getElementById('todaySales');
}

// Carregar vendas do Supabase
async function loadSales() {
    try {
        if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
        }

        console.log('Buscando vendas do Supabase...');
        showLoading(true);

        // Buscar vendas com itens relacionados
        const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select(`
                id,
                total_value,
                payment_method,
                created_at,
                sale_items (
                    id,
                    product_name,
                    quantity,
                    unit_price,
                    subtotal,
                    category_name
                )
            `)
            .order('created_at', { ascending: false });

        if (salesError) {
            throw salesError;
        }

        if (salesData && salesData.length > 0) {
            allSales = salesData;
            filteredSales = [...allSales];
            console.log('Vendas carregadas do Supabase:', allSales);
            renderSales();
            updateStatistics();
        } else {
            console.log('Nenhuma venda encontrada');
            showEmptyState();
        }

    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        showNotification(`❌ Erro ao carregar vendas: ${error.message}`, 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

// Mostrar/esconder indicador de carregamento
function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

// Renderizar lista de vendas
function renderSales() {
    if (!salesList) return;

    salesList.innerHTML = '';

    if (filteredSales.length === 0) {
        showEmptyState();
        return;
    }

    filteredSales.forEach(sale => {
        const saleCard = document.createElement('div');
        saleCard.className = 'sale-card';
        saleCard.onclick = () => showSaleDetails(sale);

        // Usar horário local convertido
        const localDate = convertToLocalTime(sale.created_at);
        const formattedDate = localDate.toLocaleDateString('pt-BR');
        const formattedTime = localDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const totalItems = sale.sale_items ? sale.sale_items.reduce((sum, item) => sum + item.quantity, 0) : 0;

        saleCard.innerHTML = `
            <div class="sale-header">
                <div class="sale-date">
                    <i class="fas fa-calendar"></i>
                    ${formattedDate} às ${formattedTime}
                </div>
                <div class="sale-total">
                    <i class="fas fa-dollar-sign"></i>
                    R$ ${sale.total_value.toFixed(2)}
                </div>
            </div>
            <div class="sale-info">
                <div class="sale-items-count">
                    <i class="fas fa-boxes"></i>
                    ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}
                </div>
                <div class="sale-payment">
                    <i class="fas fa-credit-card"></i>
                    ${getPaymentMethodLabel(sale.payment_method)}
                </div>
            </div>
            <div class="sale-preview">
                ${getSalePreview(sale.sale_items)}
            </div>
        `;

        salesList.appendChild(saleCard);
    });
}

// Mostrar estado vazio
function showEmptyState() {
    if (!salesList) return;

    salesList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-shopping-cart"></i>
            <h3>Nenhuma venda encontrada</h3>
            <p>As vendas realizadas aparecerão aqui.</p>
        </div>
    `;
}

// Obter label do método de pagamento
function getPaymentMethodLabel(method) {
    const labels = {
        'credito': 'Crédito',
        'debito': 'Débito',
        'pix': 'Pix',
        'dinheiro': 'Dinheiro'
    };
    return labels[method] || method;
}

// Obter preview dos itens da venda
function getSalePreview(items) {
    if (!items || items.length === 0) return '<span class="no-items">Nenhum item</span>';

    const previewItems = items.slice(0, 3).map(item =>
        `<span class="preview-item">${item.quantity}x ${item.product_name}</span>`
    ).join('');

    const remaining = items.length - 3;
    const remainingText = remaining > 0 ? ` +${remaining} ${remaining === 1 ? 'item' : 'itens'}` : '';

    return `<div class="preview-items">${previewItems}${remainingText}</div>`;
}

// Atualizar estatísticas
function updateStatistics() {
    const total = filteredSales.length;
    const revenue = filteredSales.reduce((sum, sale) => sum + sale.total_value, 0);

    // Vendas de hoje - usando horário local
    const today = convertToLocalTime(new Date().toISOString());
    const todayString = today.toISOString().split('T')[0];
    const todayCount = allSales.filter(sale => {
        const localSaleDate = convertToLocalTime(sale.created_at);
        const saleDateString = localSaleDate.toISOString().split('T')[0];
        return saleDateString === todayString;
    }).length;

    if (totalSales) totalSales.textContent = total;
    if (totalRevenue) totalRevenue.textContent = `R$ ${revenue.toFixed(2)}`;
    if (todaySales) todaySales.textContent = todayCount;
}

// Filtrar vendas por data
function filterSales() {
    if (!dateFilter) return;

    const selectedDate = dateFilter.value;

    if (!selectedDate) {
        filteredSales = [...allSales];
    } else {
        filteredSales = allSales.filter(sale => {
            // Usar horário local para comparação
            const localSaleDate = convertToLocalTime(sale.created_at);
            const saleDateString = localSaleDate.toISOString().split('T')[0];
            return saleDateString === selectedDate;
        });
    }

    renderSales();
    updateStatistics();
}

// Limpar filtros
function clearFilters() {
    if (dateFilter) {
        dateFilter.value = '';
    }
    filteredSales = [...allSales];
    renderSales();
    updateStatistics();
}

// Mostrar detalhes da venda
function showSaleDetails(sale) {
    const modal = document.getElementById('saleDetailsModal');
    const body = document.getElementById('saleDetailsBody');

    if (!modal || !body) return;

    // Usar horário local convertido
    const localDate = convertToLocalTime(sale.created_at);
    const formattedDate = localDate.toLocaleDateString('pt-BR');
    const formattedTime = localDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let itemsHtml = '';
    if (sale.sale_items && sale.sale_items.length > 0) {
        itemsHtml = sale.sale_items.map(item => `
            <div class="detail-item">
                <div class="item-info">
                    <span class="item-name">${item.product_name}</span>
                    <span class="item-category">${item.category_name}</span>
                </div>
                <div class="item-details">
                    <span class="item-quantity">${item.quantity}x</span>
                    <span class="item-price">R$ ${item.unit_price.toFixed(2)}</span>
                    <span class="item-subtotal">R$ ${item.subtotal.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    } else {
        itemsHtml = '<p class="no-items">Nenhum item encontrado para esta venda.</p>';
    }

    body.innerHTML = `
        <div class="sale-summary">
            <div class="summary-row">
                <span class="summary-label">Data/Hora:</span>
                <span class="summary-value">${formattedDate} às ${formattedTime}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Método de Pagamento:</span>
                <span class="summary-value">${getPaymentMethodLabel(sale.payment_method)}</span>
            </div>
            <div class="summary-row total-row">
                <span class="summary-label">Total da Venda:</span>
                <span class="summary-value">R$ ${sale.total_value.toFixed(2)}</span>
            </div>
        </div>

        <div class="sale-items-section">
            <h3>Itens da Venda</h3>
            <div class="sale-items-list">
                ${itemsHtml}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

// Fechar detalhes da venda
function closeSaleDetails() {
    const modal = document.getElementById('saleDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Voltar para a página do PDV
function goBack() {
    window.location.href = 'index.html';
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
    document.body.classList.add('pwa-mode');
}
