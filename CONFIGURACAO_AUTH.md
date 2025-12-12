# 🔐 Configuração de Autenticação - Supabase

## 📋 Pré-requisitos

1. **Conta no Supabase** ativa
2. **Projeto criado** no Supabase
3. **URL e chave anon** do projeto configuradas no `script.js`

## 🗄️ Passo 1: Criar Tabela de Usuários Autorizados

Execute este comando SQL no **SQL Editor** do seu projeto Supabase:

```sql
-- Criar tabela de usuários autorizados
CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Inserir usuário padrão (SUBSTITUA pelo seu email real)
INSERT INTO authorized_users (email, name, role) 
VALUES ('paesartesanaisfloripa@gmail.com', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Criar política RLS (Row Level Security)
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem apenas seus dados
CREATE POLICY "Users can view own profile" ON authorized_users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Política para admins verem todos os usuários
CREATE POLICY "Admins can view all users" ON authorized_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM authorized_users 
            WHERE id = auth.uid()::uuid AND role = 'admin'
        )
    );
```

## 👤 Passo 2: Criar Usuário no Supabase Auth

### Opção A: Via Dashboard do Supabase

1. Acesse seu projeto no Supabase
2. Vá para **Authentication** → **Users**
3. Clique em **"Add User"**
4. Preencha:
   - **Email**: seu-email@exemplo.com
   - **Password**: sua-senha-segura
   - **Email Confirm**: true
5. Clique em **"Create User"**

### Opção B: Via SQL (mais rápido)

Execute no SQL Editor:

```sql
-- Criar usuário via SQL (substitua os valores)
SELECT auth.sign_up(
    'seu-email@exemplo.com',
    'sua-senha-segura'
);
```

## ⚙️ Passo 3: Configurar Políticas de Segurança

Execute estes comandos para proteger suas tabelas existentes:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

-- Política para categorias (apenas usuários autenticados)
CREATE POLICY "Authenticated users can manage categories" ON category
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para produtos (apenas usuários autenticados)
CREATE POLICY "Authenticated users can manage products" ON product
    FOR ALL USING (auth.role() = 'authenticated');
```

## 🔑 Passo 4: Verificar Configurações

### Verificar URL e Chave

No seu `script.js`, confirme que as variáveis estão corretas:

```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_KEY = 'sua-chave-anon-aqui';
```

### Verificar Tabelas

Execute para verificar se tudo foi criado:

```sql
-- Verificar tabela de usuários autorizados
SELECT * FROM authorized_users;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🚀 Passo 5: Testar Autenticação

1. **Abra** `index.html` no navegador
2. **Verifique** se a tela de login aparece
3. **Faça login** com suas credenciais
4. **Confirme** que o sistema carrega após autenticação

## 🛡️ Funcionalidades de Segurança Implementadas

### ✅ Proteção de Rotas
- Redirecionamento automático para login
- Verificação de sessão em cada carregamento
- Bloqueio de acesso sem autenticação

### ✅ Validação de Usuários
- Verificação na tabela `authorized_users`
- Controle de usuários ativos/inativos
- Sistema de roles (admin/user)

### ✅ Sessões Seguras
- Tokens JWT do Supabase
- Sessões persistentes
- Logout seguro com limpeza de dados

### ✅ Proteção de Dados
- Row Level Security (RLS) habilitado
- Políticas de acesso por usuário autenticado
- Isolamento de dados entre usuários

## 🔧 Personalizações

### Adicionar Mais Usuários

```sql
-- Adicionar usuário adicional
INSERT INTO authorized_users (email, name, role) 
VALUES ('outro-usuario@exemplo.com', 'Vendedor', 'user');
```

### Modificar Roles

```sql
-- Alterar role de um usuário
UPDATE authorized_users 
SET role = 'admin' 
WHERE email = 'usuario@exemplo.com';
```

### Desativar Usuário

```sql
-- Desativar usuário (não poderá mais fazer login)
UPDATE authorized_users 
SET is_active = false 
WHERE email = 'usuario@exemplo.com';
```

## 🚨 Troubleshooting

### Erro: "User not authorized"
- Verifique se o email está na tabela `authorized_users`
- Confirme se `is_active = true`
- Verifique se o usuário foi criado no Supabase Auth

### Erro: "Invalid login credentials"
- Confirme email e senha
- Verifique se o usuário foi criado corretamente
- Tente criar um novo usuário

### Erro: "Table doesn't exist"
- Execute o SQL de criação da tabela
- Verifique se está no projeto correto
- Confirme permissões do usuário

## 📱 Teste em Diferentes Dispositivos

1. **Desktop**: Teste login/logout
2. **Mobile**: Verifique responsividade
3. **Diferentes navegadores**: Chrome, Firefox, Safari
4. **Modo incógnito**: Teste sessões

## 🎯 Próximos Passos

Após configurar a autenticação, você pode:

1. **Adicionar mais usuários** para sua equipe
2. **Implementar controle de permissões** por role
3. **Adicionar auditoria** de ações dos usuários
4. **Implementar recuperação de senha**
5. **Adicionar autenticação de dois fatores**

---

**🔒 Sistema protegido e funcionando!** 

Agora apenas usuários autorizados podem acessar sua ferramenta PDV.
