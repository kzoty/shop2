# 🔐 Solução para RLS Funcional no Supabase

## ❌ Problema Identificado

O RLS (Row Level Security) está falhando porque:
1. **Políticas muito restritivas** bloqueiam acesso antes da autenticação
2. **Conflito de permissões** entre usuário autenticado e tabela protegida
3. **Falta de fallback** quando RLS falha

## 🔧 Solução Completa

### **Passo 1: Configurar Políticas RLS Corretas**

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- 1. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON authorized_users;
DROP POLICY IF EXISTS "Admins can view all users" ON authorized_users;
DROP POLICY IF EXISTS "Allow public read access to authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Allow authenticated users to read authorized_users" ON authorized_users;

-- 2. Criar política que permite acesso para usuários autenticados
CREATE POLICY "Allow authenticated users to read authorized_users" ON authorized_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Criar política para atualizar último login
CREATE POLICY "Allow users to update own last_login" ON authorized_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 4. Manter RLS habilitado
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'authorized_users';
```

### **Passo 2: Verificar Configuração**

Execute para confirmar:

```sql
-- Verificar se a tabela tem dados
SELECT * FROM authorized_users;

-- Verificar se o seu usuário está lá
SELECT * FROM authorized_users 
WHERE email = 'paesartesanaisfloripa@gmail.com';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'authorized_users';
```

## 🛡️ Como as Políticas Funcionam

### **Política de Leitura:**
```sql
CREATE POLICY "Allow authenticated users to read authorized_users" ON authorized_users
    FOR SELECT USING (auth.role() = 'authenticated');
```
- ✅ **Permite**: Usuários autenticados lerem a tabela
- ❌ **Bloqueia**: Usuários não autenticados
- 🔑 **Condição**: `auth.role() = 'authenticated'`

### **Política de Atualização:**
```sql
CREATE POLICY "Allow users to update own last_login" ON authorized_users
    FOR UPDATE USING (auth.uid()::text = id::text);
```
- ✅ **Permite**: Usuário atualizar seu próprio registro
- ❌ **Bloqueia**: Usuário atualizar registros de outros
- 🔑 **Condição**: `auth.uid()::text = id::text`

## 🧪 Testar RLS

### **1. Teste de Login:**
1. Abra `index.html` no navegador
2. Faça login com suas credenciais
3. Verifique se não há erro 500
4. Confirme que o sistema carrega

### **2. Teste de Logout/Login:**
1. Faça logout
2. Faça login novamente
3. Verifique se não há informações duplicadas no header
4. Confirme que apenas uma informação de usuário aparece

### **3. Verificar Console:**
- Abra **F12** → **Console**
- Procure por mensagens:
  - ✅ "Usuário autorizado via RLS: {...}"
  - ✅ "Usuário autenticado com sucesso: {...}"

## 🚨 Se Ainda Falhar

### **Opção A: RLS com Política Mais Permissiva**

```sql
-- Política que permite acesso total para usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated users to read authorized_users" ON authorized_users;

CREATE POLICY "Allow full access for authenticated users" ON authorized_users
    FOR ALL USING (auth.role() = 'authenticated');
```

### **Opção B: Desabilitar RLS Temporariamente**

```sql
-- Desabilitar RLS (não recomendado para produção)
ALTER TABLE authorized_users DISABLE ROW LEVEL SECURITY;
```

### **Opção C: Verificar Logs do Supabase**

1. Vá para **Logs** no Supabase
2. Procure por erros relacionados a `authorized_users`
3. Verifique se há problemas de permissão

## 🔍 Debugging

### **Verificar Status da Sessão:**

```javascript
// No console do navegador
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão atual:', session);

if (session) {
    console.log('Usuário ID:', session.user.id);
    console.log('Usuário Email:', session.user.email);
    console.log('Role:', session.user.role);
}
```

### **Verificar Políticas RLS:**

```sql
-- Verificar todas as políticas da tabela
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'authorized_users';
```

## 🎯 Próximos Passos

### **Após RLS Funcionando:**

1. **Implementar RLS nas outras tabelas:**
   ```sql
   -- Para tabela category
   ALTER TABLE category ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow authenticated users to manage categories" ON category
       FOR ALL USING (auth.role() = 'authenticated');
   
   -- Para tabela product
   ALTER TABLE product ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow authenticated users to manage products" ON product
       FOR ALL USING (auth.role() = 'authenticated');
   ```

2. **Adicionar mais usuários:**
   ```sql
   INSERT INTO authorized_users (email, name, role) 
   VALUES ('vendedor@padaria.com', 'Vendedor', 'user');
   ```

3. **Implementar controle de permissões por role**

## 📱 Teste em Diferentes Cenários

1. **Modo incógnito**: Teste sessão limpa
2. **Diferentes navegadores**: Chrome, Firefox, Edge
3. **Mobile**: Verifique responsividade
4. **Console do navegador**: Verifique erros JavaScript

---

**🔒 RLS funcionando e sistema seguro!**
**⏱️ Tempo estimado para correção: 5-10 minutos**

## 📞 Suporte Adicional

Se o problema persistir:

1. **Verifique logs** do Supabase
2. **Confirme permissões** do projeto
3. **Teste com usuário simples** primeiro
4. **Verifique conectividade** com Supabase
5. **Compare políticas** com exemplos do Supabase
