# 📋 Checklist de Testes - Sistema PDV Local

## 1. ✅ Inicialização do DataStore
- [x] DataStore carrega de /data.json
- [x] Categorias carregam corretamente (10 categorias)
- [x] Produtos carregam corretamente (44 produtos)
- [x] Usuários carregam corretamente
- [x] Verificação de senha funciona (SHA-256)

## 2. 🔐 Autenticação
- [ ] Tela de login renderiza corretamente
- [ ] Email: `paesartesanaisfloripa@gmail.com`
- [ ] Senha: `P@f2005`
- [ ] Login bem-sucedido redireciona para app
- [ ] Logout funciona corretamente
- [ ] Sessão persiste em localStorage

## 3. 📦 Listagem de Produtos
- [ ] Categorias renderizam com ícones
- [ ] Produtos exibem com preços
- [ ] Filtro por categoria funciona
- [ ] Busca de produtos funciona

## 4. 🛒 Carrinho
- [ ] Adicionar produto ao carrinho
- [ ] Aumentar/diminuir quantidade
- [ ] Remover produto do carrinho
- [ ] Total atualiza corretamente

## 5. 💳 Checkout
- [ ] Modal de checkout abre
- [ ] Cálculo de troco funciona
- [ ] Métodos de pagamento
- [ ] Finalizar venda salva em localStorage

## 6. 💾 Persistência de Dados
- [ ] Dados salvos em localStorage
- [ ] Vendas estruturadas em sales + sale_items
- [ ] Dados persistem após recarga
- [ ] Exportação de dados funciona

## Notas de Correção Aplicadas:
- Removidos dados hardcoded de getDefaultData()
- Corrigidos caminhos /shop2 → /
- Removido código obsoleto de Supabase
- Adicionada inicialização de elementos DOM
- Adicionado método updateLastLogin em dataStore
