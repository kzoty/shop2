# 🚨 Solução para Erro 500 na Autenticação

## ❌ Problema Identificado

O erro 500 está acontecendo porque as políticas RLS (Row Level Security) estão criando um conflito:
- O usuário tenta fazer login
- O sistema verifica se ele está autorizado
- Mas as políticas RLS bloqueiam o acesso antes da autenticação
- Resultado: Erro 500 (Internal Server Error)

## 🔧 Solução Rápida (2 minutos)

### Passo 1: Corrigir Políticas RLS

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON authorized_users;
DROP POLICY IF EXISTS "Admins can view all users" ON authorized_users;

-- Desabilitar RLS temporariamente (mais simples)
ALTER TABLE authorized_users DISABLE ROW LEVEL SECURITY;
```

### Passo 2: Verificar Tabela

Execute para confirmar que a tabela está funcionando:

```sql
-- Verificar se a tabela tem dados
SELECT * FROM authorized_users;

-- Verificar se o seu usuário está lá
SELECT * FROM authorized_users 
WHERE email = 'paesartesanaisfloripa@gmail.com';
```

## 🛡️ Solução Mais Segura (Recomendada)

Se quiser manter a segurança, execute este SQL:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON authorized_users;
DROP POLICY IF EXISTS "Admins can view all users" ON authorized_users;

-- Criar política mais permissiva
CREATE POLICY "Allow public read access to authorized_users" ON authorized_users
    FOR SELECT USING (true);

-- Manter RLS habilitado
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
```

## 🔍 Verificar Configuração

### 1. Confirmar Tabela Criada

```sql
-- Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'authorized_users';

-- Verificar dados
SELECT * FROM authorized_users;
```

### 2. Confirmar Usuário no Auth

- Vá para **Authentication** → **Users**
- Verifique se `paesartesanaisfloripa@gmail.com` está listado
- Confirme que o status é "Confirmed"

## 🧪 Testar Solução

1. **Execute o SQL** de correção acima
2. **Recarregue** a página `index.html`
3. **Faça login** com suas credenciais
4. **Verifique** se não há mais erro 500

## 🚨 Se o Problema Persistir

### Opção A: Recriar Tabela

```sql
-- Remover tabela problemática
DROP TABLE IF EXISTS authorized_users;

-- Recriar tabela simples
CREATE TABLE authorized_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Inserir seu usuário
INSERT INTO authorized_users (email, name, role) 
VALUES ('paesartesanaisfloripa@gmail.com', 'Administrador', 'admin');

-- SEM RLS por enquanto
-- ALTER TABLE authorized_users DISABLE ROW LEVEL SECURITY;
```

### Opção B: Verificar Logs

1. Vá para **Logs** no Supabase
2. Procure por erros relacionados a `authorized_users`
3. Verifique se há problemas de permissão

## 🔑 Credenciais de Teste

- **Email**: paesartesanaisfloripa@gmail.com
- **Senha**: (a que você definiu no Supabase Auth)

## 📱 Teste em Diferentes Cenários

1. **Modo incógnito**: Teste sessão limpa
2. **Diferentes navegadores**: Chrome, Firefox, Edge
3. **Mobile**: Teste responsividade
4. **Console do navegador**: Verifique erros JavaScript

## 🎯 Próximos Passos Após Correção

1. **Teste login/logout** várias vezes
2. **Adicione mais usuários** se necessário
3. **Implemente RLS gradualmente** após funcionar
4. **Monitore logs** para novos erros

---

**⏱️ Tempo estimado para correção: 2-5 minutos**
**🔒 Sistema funcionando após correção!**

## 📞 Suporte Adicional

Se o problema persistir após essas correções:

1. **Verifique logs** do Supabase
2. **Confirme permissões** do projeto
3. **Teste com usuário simples** primeiro
4. **Verifique conectividade** com Supabase
