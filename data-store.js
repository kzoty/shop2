/**
 * Sistema de persistência local em JSON
 * Substitui Supabase com armazenamento em localStorage + arquivo data.json
 */

class DataStore {
    constructor() {
        this.storageKey = 'padaria_pdv_data';
        this.dataJsonUrl = '/data.json'; // Caminho para arquivo JSON
        this.data = null;
        this.initialized = false;
    }

    /**
     * Inicializa o data store carregando dados do JSON ou localStorage
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            this.data = await this.loadData();
            this.initialized = true;
            console.log('DataStore inicializado com sucesso');
            
            // Validar e sincronizar com data.json se necessário
            await this.validateAndSyncWithRemote();
        } catch (error) {
            console.error('Erro ao inicializar DataStore:', error);
            this.data = this.getDefaultData();
        }
    }

    /**
     * Valida dados em cache contra data.json; se detectar diferença (hash do usuário mudou),
     * recarrega de data.json para garantir sincronização
     */
    async validateAndSyncWithRemote() {
        try {
            const response = await fetch(this.dataJsonUrl);
            if (!response.ok) {
                console.warn('Não foi possível validar contra data.json:', response.statusText);
                return;
            }
            
            const remoteData = await response.json();
            const localHash = this.data?.authorized_users?.[0]?.password_hash;
            const remoteHash = remoteData?.authorized_users?.[0]?.password_hash;
            
            // Se os hashes dos usuários diferirem, o localStorage está desatualizado
            if (localHash && remoteHash && localHash !== remoteHash) {
                console.log('[DataStore] Detectada diferença na versão dos dados.');
                console.log('[DataStore] Recarregando de data.json...');
                this.data = remoteData;
                this.saveData(remoteData);
                console.log('[DataStore] Dados sincronizados com sucesso');
            }
        } catch (error) {
            console.warn('[DataStore] Erro ao sincronizar com data.json:', error);
            // Não é crítico; continua com dados já carregados
        }
    }

    /**
     * Carrega dados do localStorage ou arquivo JSON
     */
    async loadData() {
        try {
            // Primeiro, tenta carregar do localStorage (dados mais atuais)
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                console.log('Dados carregados do localStorage');
                return JSON.parse(stored);
            }

            // Se não existir no localStorage, carrega do arquivo JSON
            console.log('Carregando dados do arquivo JSON...');
            const response = await fetch(this.dataJsonUrl);
            if (!response.ok) {
                throw new Error(`Erro ao carregar data.json: ${response.statusText}`);
            }
            
            const data = await response.json();
            // Salvar no localStorage para próximas cargas
            this.saveData(data);
            console.log('Dados carregados do JSON e salvos no localStorage');
            return data;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return this.getDefaultData();
        }
    }

    /**
     * Estrutura padrão dos dados (fallback quando JSON não carrega)
     */
    getDefaultData() {
        return {
            categories: [],
            products: [],
            sales: [],
            sale_items: [],
            authorized_users: [
                {
                    id: '77ccf5ff-fe74-41a7-b60d-195abc5d8f66',
                    email: 'paesartesanaisfloripa@gmail.com',
                    name: 'Administrador',
                    role: 'admin',
                    is_active: true,
                    created_at: '2025-09-01T18:25:44.000Z',
                    last_login: null,
                    password_hash: '0ca3bf40d89038be861f448402bc5362935d61e9143ab50ac40d4967b8f66ccd'
                }
            ]
        };
    }

    /**
     * Hash simples de senha usando SHA256
     * Nota: Para produção, usar bcrypt ou argon2
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verifica se a senha está correta
     */
    async verifyPassword(password, hash) {
        const newHash = await this.hashPassword(password);
        return newHash === hash;
    }

    /**
     * Salva os dados no localStorage
     */
    saveData(dataToSave = null) {
        try {
            const data = dataToSave || this.data;
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    }

    /**
     * Obtém usuário por email
     */
    getUserByEmail(email) {
        if (!this.data || !this.data.authorized_users) return null;
        return this.data.authorized_users.find(u => u.email === email);
    }

    /**
     * Obtém todos os dados
     */
    getData() {
        return this.data || this.getDefaultData();
    }

    /**
     * Obtém todas as categorias
     */
    getCategories() {
        if (!this.data || !this.data.categories) return [];
        return this.data.categories;
    }

    /**
     * Obtém todos os produtos
     */
    getProducts() {
        if (!this.data || !this.data.products) return [];
        return this.data.products;
    }

    /**
     * Adiciona uma venda
     */
    addSale(sale) {
        const id = `sale-${Date.now()}`;
        const saleData = {
            id,
            created_at: new Date().toISOString(),
            ...sale
        };
        this.data.sales.push(saleData);
        this.saveData();
        return saleData;
    }

    /**
     * Adiciona item de venda
     */
    addSaleItem(saleItem) {
        const id = `item-${Date.now()}`;
        const itemData = {
            id,
            ...saleItem
        };
        this.data.sale_items.push(itemData);
        this.saveData();
        return itemData;
    }

    /**
     * Obtém todas as vendas
     */
    getSales() {
        return this.data.sales;
    }

    /**
     * Obtém itens de uma venda
     */
    getSaleItems(saleId) {
        return this.data.sale_items.filter(item => item.sale_id === saleId);
    }

    /**
     * Atualiza último login do usuário
     */
    updateLastLogin(email) {
        const user = this.getUserByEmail(email);
        if (user) {
            user.last_login = new Date().toISOString();
            this.saveData();
        }
    }

    /**
     * Adiciona categoria
     */
    addCategory(category) {
        const newCategory = {
            id: Math.max(...this.data.categories.map(c => c.id), 0) + 1,
            created_at: new Date().toISOString(),
            ...category
        };
        this.data.categories.push(newCategory);
        this.saveData();
        return newCategory;
    }

    /**
     * Atualiza categoria
     */
    updateCategory(categoryId, updates) {
        const category = this.data.categories.find(c => c.id === categoryId);
        if (category) {
            Object.assign(category, updates);
            this.saveData();
            return category;
        }
        return null;
    }

    /**
     * Remove categoria
     */
    deleteCategory(categoryId) {
        this.data.categories = this.data.categories.filter(c => c.id !== categoryId);
        this.saveData();
        return true;
    }

    /**
     * Adiciona produto
     */
    addProduct(product) {
        const newProduct = {
            id: Math.max(...this.data.products.map(p => p.id), 0) + 1,
            created_at: new Date().toISOString(),
            ...product
        };
        this.data.products.push(newProduct);
        this.saveData();
        return newProduct;
    }

    /**
     * Atualiza produto
     */
    updateProduct(productId, updates) {
        const product = this.data.products.find(p => p.id === productId);
        if (product) {
            Object.assign(product, updates);
            this.saveData();
            return product;
        }
        return null;
    }

    /**
     * Remove produto
     */
    deleteProduct(productId) {
        this.data.products = this.data.products.filter(p => p.id !== productId);
        this.saveData();
        return true;
    }

    /**
     * Atualiza o último login do usuário
     */
    updateLastLogin(email) {
        if (!this.data || !this.data.authorized_users) return;
        const user = this.data.authorized_users.find(u => u.email === email);
        if (user) {
            user.last_login = new Date().toISOString();
            this.saveData();
        }
    }

    /**
     * Exporta dados como JSON
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Importa dados do JSON
     */
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.data = imported;
            this.saveData();
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }
}

// Instância global
const dataStore = new DataStore();
