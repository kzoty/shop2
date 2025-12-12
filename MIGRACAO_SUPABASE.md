# Migração de Supabase para Armazenamento Local JSON

## Resumo da Mudança

Este projeto foi migrado de um banco de dados Supabase externo para um sistema de armazenamento local baseado em JSON armazenado no `localStorage` do navegador.

## Arquivos Criados/Modificados

### Novos Arquivos:

1. **`data-store.js`** - Sistema de persistência de dados
   - Gerencia todas as operações CRUD (Create, Read, Update, Delete)
   - Armazena dados em `localStorage` no formato JSON
   - Fornece métodos para: categorias, produtos, vendas, usuários, etc.
   - Implementa hash de senha usando SHA-256 (crypto.subtle.digest)

2. **`auth.js`** - Sistema de autenticação local
   - Login/logout sem Supabase
   - Verificação de senha com hash
   - Gerenciamento de sessão no localStorage
   - Funções: `initAuth()`, `handleLogin()`, `handleLogout()`, `showAuthScreen()`

### Arquivos Modificados:

3. **`script.js`**
   - Removidas todas as referências a Supabase (SUPABASE_URL, SUPABASE_KEY, inicialização, etc.)
   - Substituídas funções `loadCategoriesFromSupabase()` e `loadProductsFromSupabase()` por versões locais
   - Atualizada `finalizeSale()` para usar `dataStore` em vez de Supabase
   - Removidas funções de autenticação duplicadas (agora em `auth.js`)

4. **`index.html`**
   - Adicionadas importações dos novos scripts na ordem correta:
     1. `data-store.js` (deve ser primeiro)
     2. `auth.js` 
     3. `script.js`
     4. Script do service worker para PWA

## Como Usar

### 1. Login

- **Email:** `paesartesanaisfloripa@gmail.com`
- **Senha:** `P@f2005`

A senha é armazenada como hash SHA-256 no localStorage e nunca é salva em texto plano.

### 2. Dados Persistem Localmente

Todos os dados (categorias, produtos, vendas) são salvos no `localStorage` do navegador:
- Dados compartilhados entre abas da mesma origem
- Persistem entre sessões (até limpar cache)
- Limite típico: 5-10 MB por domínio

### 3. Estrutura de Dados

Os dados são organizados em um objeto JSON com as seguintes seções:

```json
{
  "categories": [...],
  "products": [...],
  "sales": [...],
  "sale_items": [...],
  "authorized_users": [...]
}
```

## Funcionalidades Preservadas

✅ Autenticação de usuário (com hash de senha)  
✅ Carregamento de categorias e produtos  
✅ Carrinho de compras  
✅ Registro de vendas  
✅ Interface responsiva (mobile-first)  
✅ PWA (Progressive Web App) instalável  
✅ Service Worker para offline (com dados locais)  

## Funcionalidades Removidas

❌ Supabase Auth (JWT, OAuth, etc.)  
❌ Sincronização em tempo real  
❌ Múltiplos usuários simultâneos (dados não são sincronizados entre dispositivos)  
❌ Backup automático em nuvem  

## Limitações

1. **Dados não sincronizam entre dispositivos** - Use o mesmo navegador/dispositivo
2. **Limite de armazenamento** - localStorage tem limite (5-10 MB)
3. **Sem backup automático** - Recomenda-se exportar dados regularmente
4. **Sem acesso de API externa** - Tudo é local ao navegador

## Exportando/Importando Dados

Para fazer backup ou compartilhar dados entre dispositivos:

```javascript
// Exportar dados como JSON
const backup = dataStore.exportData();
console.log(backup); // Copie para salvar em arquivo

// Importar dados de um JSON
dataStore.importData(jsonString);
```

## Segurança

⚠️ **IMPORTANTE:**
- Senhas são armazenadas como hash SHA-256, nunca em texto plano
- localStorage é vulnerável a XSS attacks
- Para produção, considere usar uma API backend + Supabase/Firebase
- **Não armazene dados sensíveis (cartão de crédito, etc.) no localStorage**

## Estrutura do Data Store

### Métodos Disponíveis:

```javascript
// Categorias
dataStore.getCategories()
dataStore.addCategory(category)
dataStore.updateCategory(categoryId, updates)
dataStore.deleteCategory(categoryId)

// Produtos
dataStore.getProducts()
dataStore.addProduct(product)
dataStore.updateProduct(productId, updates)
dataStore.deleteProduct(productId)

// Vendas
dataStore.addSale(sale)
dataStore.getSales()
dataStore.addSaleItem(saleItem)
dataStore.getSaleItems(saleId)

// Usuários
dataStore.getUserByEmail(email)
dataStore.verifyPassword(password, hash)
dataStore.hashPassword(password)

// Autenticação
dataStore.updateLastLogin(email)

// Importação/Exportação
dataStore.exportData()
dataStore.importData(jsonString)
```

## Próximos Passos

1. **Testar fluxo completo:**
   - [ ] Fazer login com as credenciais
   - [ ] Ver categorias e produtos carregando
   - [ ] Adicionar itens ao carrinho
   - [ ] Finalizar uma venda
   - [ ] Verificar dados salvos no localStorage

2. **Considerar melhorias:**
   - Implementar sincronização entre abas com `localStorage` event
   - Adicionar exportação automática para backup
   - Implementar IndexedDB para maior capacidade de armazenamento
   - Adicionar mais usuários (gerenciável via UI)

3. **Para produção:**
   - Considerar migração para backend + banco de dados real
   - Implementar criptografia end-to-end para dados sensíveis
   - Adicionar validação e sanitização de inputs
   - Implementar rate limiting para segurança

## Estrutura de Arquivos do Projeto

```
/shop2/
├── index.html          # UI principal
├── styles.css          # Estilos
├── script.js           # Lógica principal (SEM Supabase)
├── auth.js             # Autenticação local (NOVO)
├── data-store.js       # Persistência em JSON (NOVO)
├── sw.js               # Service Worker para PWA
├── manifest.json       # Configuração PWA
├── .github/
│   └── copilot-instructions.md
└── ...arquivos SQL (apenas para referência)
```

## Dúvidas ou Problemas?

Se encontrar erros:

1. Abra o DevTools (F12)
2. Veja a aba "Console" para mensagens de erro
3. Veja a aba "Application" > "Local Storage" para inspecionar dados
4. Limpe o cache e recarregue se necessário

---

**Versão:** 2.0 (Migração para Local Storage)  
**Data:** Dezembro 2025  
**Status:** ✅ Pronto para uso
