/**
 * Sistema de autenticação local (sem Supabase)
 * Usa hash de senha armazenado em localStorage
 */

console.log('[auth.js] Loading auth.js file');

let currentUser = null;

async function initAuth() {
    try {
        console.log('[initAuth] Starting...');
        console.log('[initAuth] dataStore.initialized:', dataStore?.initialized);
        
        // Aguardar inicialização do dataStore
        if (!dataStore.initialized) {
            console.log('[initAuth] DataStore not initialized, initializing...');
            await dataStore.initialize();
            console.log('[initAuth] DataStore initialized');
        }
        
        // Verificar se há sessão ativa no localStorage
        const sessionEmail = localStorage.getItem('current_user_email');
        console.log('[initAuth] sessionEmail from localStorage:', sessionEmail);
        
        if (sessionEmail && dataStore && dataStore.data) {
            console.log('[initAuth] Checking stored user...');
            const user = dataStore.getUserByEmail(sessionEmail);
            console.log('[initAuth] User found:', !!user);
            
            if (user) {
                currentUser = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
                console.log('[initAuth] User authenticated:', currentUser.email);
                return true;
            }
        }
        
        console.log('[initAuth] No active session, user not authenticated');
        return false;
    } catch (error) {
        console.error('[initAuth] ERROR:', error);
        console.error('[initAuth] Error stack:', error.stack);
        throw error;
    }
}

/**
 * Faz login do usuário
 */
async function handleLogin(event) {
    if (event) event.preventDefault();

    console.log('[handleLogin] invoked');

    const emailInput = document.getElementById('loginEmail') || document.getElementById('email');
    const passwordInput = document.getElementById('loginPassword') || document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        console.error('Elementos de login não encontrados');
        return;
    }

    const email = emailInput.value || '';
    const password = passwordInput.value || '';
    console.log('[handleLogin] email:', email, 'password length:', password.length);
    
    if (!email || !password) {
        showNotification('Email e senha são obrigatórios', 'error');
        return;
    }

    try {
        console.log('[handleLogin] Looking up user by email:', email);
        const user = dataStore.getUserByEmail(email);
        
        if (!user) {
            showNotification('Usuário não encontrado', 'error');
            return;
        }

        if (!user.is_active) {
            showNotification('Usuário inativo', 'error');
            return;
        }

        // Verificar senha
        console.log('[handleLogin] Verifying password...');
        const isPasswordValid = await dataStore.verifyPassword(password, user.password_hash);
        console.log('[handleLogin] verifyPassword result:', isPasswordValid);
        
        if (!isPasswordValid) {
            showNotification('Senha incorreta', 'error');
            return;
        }

        // Login bem-sucedido
        currentUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        // Salvar sessão
        localStorage.setItem('current_user_email', email);
        dataStore.updateLastLogin(email);

        showNotification('Login realizado com sucesso!', 'success');
        
        // Ir para página principal
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        
        // Carregar dados
        await initializeApp();

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showNotification('Erro ao fazer login', 'error');
    }
}

/**
 * Faz logout do usuário
 */
function handleLogout() {
    console.log('[handleLogout] Logging out user...');
    currentUser = null;
    localStorage.removeItem('current_user_email');
    
    // Limpar carrinho (variável global em script.js)
    if (typeof cart !== 'undefined') {
        cart = [];
    }
    
    // Voltar para tela de login usando showAuthScreen que cria elementos se necessário
    showAuthScreen();
    
    showNotification('Logout realizado', 'success');
    console.log('[handleLogout] User logged out successfully');
}

/**
 * Mostra tela de autenticação
 */
function showAuthScreen() {
    console.log('[auth.js] showAuthScreen() called');
    const authScreen = document.getElementById('authScreen') || createAuthScreen();
    console.log('[auth.js] authScreen element:', authScreen);
    authScreen.style.display = 'flex';
    console.log('[auth.js] authScreen.style.display set to flex');
    
    const appContainer = document.getElementById('appContainer');
    console.log('[auth.js] appContainer element:', appContainer);
    if (appContainer) {
        appContainer.style.display = 'none';
        console.log('[auth.js] appContainer hidden');
    }
}

/**
 * Cria a tela de autenticação se não existir
 */
function createAuthScreen() {
    console.log('[createAuthScreen] Creating auth screen element');
    const authScreen = document.createElement('div');
    authScreen.id = 'authScreen';
    authScreen.className = 'auth-screen';
    authScreen.innerHTML = `
        <div class="auth-container">
            <div class="auth-form-container">
                <div class="auth-logo">
                    <i class="fas fa-bread-slice"></i>
                    <h1>Padaria Artesanal</h1>
                </div>
                <h2>🔐 Acesso Restrito</h2>
                <p>Faça login para acessar o sistema PDV</p>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">Email:</label>
                        <input type="email" id="loginEmail" name="email" required placeholder="seu@email.com" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Senha:</label>
                        <input type="password" id="loginPassword" name="password" required placeholder="••••••••" autocomplete="current-password">
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
    
    console.log('[createAuthScreen] Inserting authScreen into body');
    console.log('[createAuthScreen] body:', document.body);
    console.log('[createAuthScreen] body.firstChild:', document.body.firstChild);
    
    document.body.insertBefore(authScreen, document.body.firstChild);
    // Attach submit handler programmatically to ensure event is captured
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            try {
                handleLogin(e);
            } catch (err) {
                console.error('[auth.js] Error in login submit handler:', err);
            }
        });
    } else {
        console.warn('[auth.js] loginForm not found after insertion');
    }
    // Also attach click handler to the button to be extra reliable
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[auth.js] loginBtn clicked');
            try {
                handleLogin(e);
            } catch (err) {
                console.error('[auth.js] Error in loginBtn click handler:', err);
            }
        });
    } else {
        console.warn('[auth.js] loginBtn not found after insertion');
    }
    console.log('[createAuthScreen] authScreen inserted');
    
    // Focar no campo de email
    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        console.log('[createAuthScreen] Focusing email input:', !!emailInput);
        if (emailInput) emailInput.focus();
    }, 100);
    
    return authScreen;
}

/**
 * Adiciona informações do usuário no header
 */
function addUserInfoToHeader() {
    if (!currentUser) return;
    
    const header = document.querySelector('header') || document.querySelector('.header');
    if (!header) return;

    // Procura ou cria container de usuário
    let userControls = header.querySelector('.user-controls');
    if (!userControls) {
        userControls = document.createElement('div');
        userControls.className = 'user-controls';
        header.appendChild(userControls);
    }

    userControls.innerHTML = `
        <div class="user-info">
            <i class="fas fa-user-circle"></i>
            <span>${currentUser.name}</span>
        </div>
        <button class="export-btn" onclick="exportDataAsJSON()" title="Exportar dados como JSON">
            <i class="fas fa-download"></i>
            Export
        </button>
        <button class="logout-btn" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i>
            Sair
        </button>
    `;
}
