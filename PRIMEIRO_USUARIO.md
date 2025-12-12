# 🚀 Configuração Rápida do Primeiro Usuário

## ⚡ Passos Rápidos (5 minutos)

### 1. 📝 Substituir Email no SQL
No arquivo `CONFIGURACAO_AUTH.md`, linha 25, substitua:
```sql
VALUES ('seu-email@exemplo.com', 'Administrador', 'admin')
```
Por:
```sql
VALUES ('SEU_EMAIL_REAL@gmail.com', 'Seu Nome', 'admin')
```

### 2. 🗄️ Executar SQL no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Vá para seu projeto
3. **SQL Editor** → Cole o SQL completo
4. Clique em **"Run"**

### 3. 👤 Criar Usuário no Auth
1. **Authentication** → **Users**
2. **"Add User"**
3. **Email**: SEU_EMAIL_REAL@gmail.com
4. **Password**: SUA_SENHA_SEGURA
5. **"Create User"**

### 4. 🧪 Testar
1. Abra `index.html`
2. Faça login com suas credenciais
3. ✅ Sistema funcionando!

## 🔑 Exemplo Prático

### SQL para Executar:
```sql
-- Criar tabela e usuário
CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- SEU USUÁRIO (substitua pelo seu email real)
INSERT INTO authorized_users (email, name, role) 
VALUES ('joao.silva@gmail.com', 'João Silva', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Habilitar segurança
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
```

### Credenciais de Login:
- **Email**: joao.silva@gmail.com
- **Senha**: (a que você definiu no Supabase Auth)

## 🚨 Problemas Comuns

### ❌ "User not authorized"
- Verifique se o email no SQL é igual ao do Supabase Auth
- Confirme se executou o SQL completo

### ❌ "Invalid login credentials"
- Verifique se criou o usuário no Supabase Auth
- Confirme email e senha

### ❌ Tela de login não aparece
- Verifique se o Supabase está conectando
- Confirme URL e chave no `script.js`

## 🎯 Próximo Passo

Após o primeiro usuário funcionando, adicione mais usuários:
```sql
INSERT INTO authorized_users (email, name, role) 
VALUES ('maria@padaria.com', 'Maria Santos', 'user');
```

---

**⏱️ Tempo estimado: 5 minutos**
**🔒 Sistema protegido e funcionando!**
