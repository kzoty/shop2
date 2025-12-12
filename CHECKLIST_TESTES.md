# Checklist de Testes - Migração Local Storage

## Testes de Autenticação

- [ ] Acessar a página
  - [ ] Deve mostrar tela de login
  - [ ] Logo e título devem aparecer
  - [ ] Campos de email e senha visíveis

- [ ] Login com credenciais corretas
  - Email: `paesartesanaisfloripa@gmail.com`
  - Senha: `P@f2005`
  - [ ] Deve fazer login com sucesso
  - [ ] Deve mostrar nome do usuário no header
  - [ ] Deve carregar categorias e produtos

- [ ] Login com credenciais incorretas
  - [ ] Email errado → "Usuário não encontrado"
  - [ ] Senha errada → "Senha incorreta"
  - [ ] Campos vazios → "Email e senha são obrigatórios"

- [ ] Logout
  - [ ] Clicar em "Sair"
  - [ ] Deve voltar para tela de login
  - [ ] Deve limpar carrinho
  - [ ] Deve limpar sessão do localStorage

- [ ] Sessão persistente
  - [ ] Fazer login
  - [ ] Recarregar página (F5)
  - [ ] Deve manter login (não voltar para tela de login)

## Testes de Dados

- [ ] Carregamento de categorias
  - [ ] 10 categorias devem aparecer
  - [ ] Ícones devem exibir corretamente
  - [ ] Cores de fundo devem ser aplicadas

- [ ] Carregamento de produtos
  - [ ] Vários produtos devem estar visíveis
  - [ ] Produtos devem exibir: nome, preço, imagem
  - [ ] Botão "Adicionar" deve estar disponível

- [ ] Filtragem por categoria
  - [ ] Clicar em uma categoria
  - [ ] Deve filtrar apenas produtos dessa categoria
  - [ ] Clicar em outra categoria deve atualizar

## Testes de Carrinho

- [ ] Adicionar produto ao carrinho
  - [ ] Clique no botão "Adicionar"
  - [ ] Deve aparecer no carrinho
  - [ ] Total deve ser atualizado
  - [ ] Contador deve incrementar

- [ ] Aumentar/diminuir quantidade
  - [ ] Clicar no botão "+" deve aumentar
  - [ ] Clicar no botão "-" deve diminuir
  - [ ] Total deve ser recalculado

- [ ] Remover item do carrinho
  - [ ] Clicar no ícone de lixo
  - [ ] Item deve desaparecer
  - [ ] Total deve ser atualizado

## Testes de Checkout

- [ ] Abrir modal de checkout
  - [ ] Clicar em "Finalizar Venda"
  - [ ] Modal deve aparecer com resumo

- [ ] Pagamento em dinheiro
  - [ ] Selecionar "Dinheiro"
  - [ ] Campo de valor deve aparecer
  - [ ] Informar valor > total
  - [ ] Troco deve ser calculado corretamente
  - [ ] Clicar em "Finalizar"
  - [ ] Deve salvar venda
  - [ ] Deve limpar carrinho
  - [ ] Deve mostrar mensagem de sucesso

- [ ] Pagamento em PIX/Crédito
  - [ ] Selecionar "PIX" ou "Crédito"
  - [ ] Clicar em "Finalizar"
  - [ ] Deve salvar venda
  - [ ] Deve limpar carrinho

## Testes de Persistência

- [ ] Dados salvos no localStorage
  - [ ] Abrir DevTools (F12)
  - [ ] Ir para "Application" > "Storage" > "Local Storage"
  - [ ] Procurar por chave "padaria_pdv_data"
  - [ ] Deve conter JSON com dados

- [ ] Vendas salvas
  - [ ] Fazer uma venda completa
  - [ ] Abrir DevTools
  - [ ] Verificar se há registros em "sales" e "sale_items"

- [ ] Expiração de dados
  - [ ] Limpar cache do navegador (Ctrl+Shift+Del)
  - [ ] Recarregar página
  - [ ] Dados devem estar presentes (localStorage persiste)

## Testes de Interface

- [ ] Responsividade mobile
  - [ ] Abrir em celular ou modo desenvolvedor (F12 > toggle device)
  - [ ] Layout deve se adaptar
  - [ ] Botões devem ser clicáveis
  - [ ] Inputs devem ser acessíveis

- [ ] Notificações
  - [ ] Operações de sucesso devem mostrar notificação
  - [ ] Erros devem mostrar notificação vermelha
  - [ ] Notificações devem desaparecer após tempo

- [ ] Busca de produtos
  - [ ] Digitar nome de um produto no campo de busca
  - [ ] Deve filtrar produtos
  - [ ] Botão X deve limpar busca

## Testes de PWA (Opcional)

- [ ] Instalação no Android/Chrome
  - [ ] Menu do Chrome > "Adicionar à tela inicial"
  - [ ] Ícone deve aparecer na tela inicial
  - [ ] App deve abrir em tela cheia

- [ ] Service Worker
  - [ ] Abrir DevTools > "Application" > "Service Workers"
  - [ ] Deve haver um worker registrado
  - [ ] Status deve ser "activated and running"

## Problemas Conhecidos & Soluções

### Problema: Tela de login não aparece
**Solução:**
- Limpar cache (Ctrl+Shift+Del)
- Recarregar página (F5)
- Verificar console (F12) para erros

### Problema: Dados não salvam
**Solução:**
- Verificar se localStorage está ativado no navegador
- Não usar modo anônimo/incógnito (localStorage pode ser desativado)
- Verificar limite de 5-10 MB (remover dados antigos)

### Problema: Login não funciona
**Solução:**
- Verificar se data-store.js foi carregado (verificar em F12 > Network)
- Verificar console para erros JavaScript
- Tentar limpar localStorage e fazer login novamente

### Problema: Senha hash não funciona
**Solução:**
- Verificar se browser suporta Crypto API (Chrome, Firefox, Safari)
- Não usar Internet Explorer
- Se não funcionar, pode precisar de polyfill

## Relatório de Teste

Após completar os testes, preencha:

- **Data do Teste:** _______________
- **Navegador:** Chrome / Firefox / Safari / Edge / Outro: _______________
- **Dispositivo:** Desktop / Tablet / Mobile
- **Testes Passaram:** Sim / Não
- **Problemas Encontrados:**
  1. _________________________________
  2. _________________________________
  3. _________________________________

---

**Notas:**
- Todos os testes devem ser feitos com JavaScript ativado
- localStorage deve estar ativado
- Usar HTTPS (ou localhost para desenvolvimento)
