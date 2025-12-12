# Padaria Artesanal - PDV

Sistema de PDV (Ponto de Venda) para padaria artesanal com gerenciamento de categorias e produtos.

## Funcionalidades

### 🔐 Autenticação e Segurança
- **Login Seguro**: Sistema de autenticação com Supabase
- **Controle de Acesso**: Apenas usuários autorizados podem usar o sistema
- **Sessões Persistentes**: Login automático em visitas subsequentes
- **Logout Seguro**: Limpeza completa de dados e sessões

### Categorias
- **Visualizar**: Lista todas as categorias disponíveis
- **Adicionar**: Criação de novas categorias com nome, ícone e cor
- **Editar**: Edição de categorias existentes usando double-click/double-tap
- **Filtrar**: Filtra produtos por categoria selecionada

### Produtos
- **Visualizar**: Lista todos os produtos com informações da categoria
- **Adicionar**: Criação de novos produtos com nome, preço e categoria
- **Buscar**: Sistema de busca por nome ou categoria

### Carrinho de Compras
- **Adicionar**: Adiciona produtos ao carrinho
- **Gerenciar**: Controle de quantidade e remoção de itens
- **Finalizar**: Checkout com múltiplas formas de pagamento

## Como Usar

### Editar Categorias
1. **Double-click** (desktop) ou **double-tap** (mobile) em qualquer categoria
2. O modal de edição será aberto com os dados atuais
3. Modifique nome, ícone ou cor conforme necessário
4. Veja o preview em tempo real das mudanças
5. Pressione **Enter** em qualquer campo ou clique em "Atualizar Categoria"

### Adicionar Categorias
1. Clique no botão "Nova Categoria"
2. Preencha nome, ícone (FontAwesome) e cor
3. Clique em "Salvar Categoria"

### Adicionar Produtos
1. Clique no botão "Novo Produto"
2. Selecione a categoria, nome e preço
3. Clique em "Salvar Produto"

### Navegação
- **Click simples**: Seleciona categoria e filtra produtos
- **Double-click/Double-tap**: Edita categoria
- **Busca**: Digite no campo de busca para filtrar produtos
- **Carrinho**: Use os botões de quantidade para gerenciar itens

## Tecnologias

- HTML5, CSS3, JavaScript ES6+
- Supabase para backend
- FontAwesome para ícones
- Design responsivo para mobile e desktop

## Estrutura do Projeto

```
shop/
├── index.html          # Interface principal
├── script.js           # Lógica da aplicação
├── styles.css          # Estilos e layout
├── produtos.html       # Página de produtos
└── README.md           # Documentação
```

## Configuração

### 1. Configuração do Supabase
1. Clone o repositório
2. Configure as variáveis do Supabase em `script.js`
3. Execute os comandos SQL em `CONFIGURACAO_AUTH.md` para criar a tabela de usuários autorizados
4. Crie um usuário no Supabase Auth com as mesmas credenciais

### 2. Executar o Sistema
1. Abra `index.html` no navegador
2. Faça login com suas credenciais
3. Para desenvolvimento, use um servidor local (ex: `python -m http.server 8000`)

### 3. Segurança
- Sistema protegido por autenticação
- Apenas usuários autorizados podem acessar
- Sessões seguras com JWT tokens
- Logout automático em caso de inatividade

## Suporte Mobile

- Interface totalmente responsiva
- Suporte a touch gestures (double-tap)
- Otimizado para dispositivos móveis
- Funciona offline com dados locais

## Contribuição

Para adicionar novas funcionalidades ou corrigir bugs:
1. Faça as alterações no código
2. Teste em diferentes dispositivos
3. Mantenha a consistência visual
4. Documente as mudanças

