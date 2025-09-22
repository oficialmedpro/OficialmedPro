# 🔐 Sistema de Login - OficialMed Pro

## 📋 **Status Atual do Projeto**

### ✅ **O que já foi implementado:**
- ✅ **Tabelas do sistema de autenticação** criadas no Supabase
- ✅ **Sistema hierárquico** de tipos de usuário
- ✅ **Módulos e permissões** configurados
- ✅ **Página de login** existente (estática)
- ✅ **Componente de login** atualizado para usar Supabase
- ✅ **Scripts SQL** de permissões e testes criados

### 🔄 **O que está em andamento:**
- 🔄 **Sincronização de leads** rodando em background (2.21% concluído)
- 🔄 **Sistema de autenticação** pronto para ser configurado

### 📝 **O que precisa ser feito:**
- ⏳ **Executar scripts SQL** no Supabase
- ⏳ **Configurar permissões** das tabelas
- ⏳ **Testar login dinâmico** via banco de dados
- ⏳ **Implementar hash de senhas** real
- ⏳ **Configurar JWT** para sessões

---

## 🗄️ **Estrutura do Banco de Dados**

### **Schema: `api`**

#### **1. Tabela: `user_types`**
**Descrição:** Tipos de usuário hierárquicos do sistema

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único do tipo de usuário |
| `name` | VARCHAR(50) UNIQUE | Nome do tipo (adminfranquiadora, adminfranquia, etc.) |
| `description` | TEXT | Descrição do tipo de usuário |
| `level` | INTEGER | Nível hierárquico (1 = mais alto) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Tipos pré-configurados:**
- `adminfranquiadora` (nível 1) - Acesso total
- `adminfranquia` (nível 2) - Acesso a unidades próprias
- `adminunidade` (nível 3) - Acesso a unidades específicas
- `supervisor` (nível 4) - Acesso a dados do time
- `vendedor` (nível 5) - Acesso apenas aos próprios dados

#### **2. Tabela: `modules`**
**Descrição:** Módulos/permissões disponíveis no sistema

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único do módulo |
| `name` | VARCHAR(100) UNIQUE | Nome do módulo (dashboard, vendas, etc.) |
| `description` | TEXT | Descrição do módulo |
| `category` | VARCHAR(50) | Categoria (dashboard, vendas, relatorios, etc.) |
| `icon` | VARCHAR(50) | Ícone para interface |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Módulos pré-configurados:**
- **Dashboard:** dashboard, dashboard_vendas, dashboard_financeiro
- **Vendas:** vendas, vendas_oportunidades, vendas_propostas, vendas_relatorios
- **Clientes:** clientes, clientes_leads, clientes_cadastro
- **Financeiro:** financeiro, financeiro_contas, financeiro_relatorios
- **Relatórios:** relatorios, relatorios_vendas, relatorios_financeiro
- **Configurações:** configuracoes, configuracoes_usuarios, configuracoes_unidades
- **Análise:** rfv, rfv_matriz

#### **3. Tabela: `user_type_permissions`**
**Descrição:** Permissões por tipo de usuário

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único da permissão |
| `user_type_id` | INTEGER | FK para user_types |
| `module_id` | INTEGER | FK para modules |
| `can_read` | BOOLEAN | Pode ler o módulo |
| `can_write` | BOOLEAN | Pode escrever no módulo |
| `can_delete` | BOOLEAN | Pode deletar dados do módulo |
| `can_export` | BOOLEAN | Pode exportar dados do módulo |
| `created_at` | TIMESTAMP | Data de criação |

#### **4. Tabela: `users` (PRINCIPAL)**
**Descrição:** Usuários do sistema com controle de acesso

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único do usuário |
| `username` | VARCHAR(50) UNIQUE | Nome de usuário para login |
| `email` | VARCHAR(255) UNIQUE | Email do usuário |
| `password_hash` | VARCHAR(255) | Hash da senha (bcrypt) |
| `first_name` | VARCHAR(100) | Nome do usuário |
| `last_name` | VARCHAR(100) | Sobrenome do usuário |
| `avatar_url` | TEXT | URL do avatar |
| `user_type_id` | INTEGER | FK para user_types |
| `status` | VARCHAR(20) | Status: active, blocked, inactive |
| `access_status` | VARCHAR(20) | Acesso: liberado, bloqueado |
| `is_online` | BOOLEAN | Usuário online |
| `vendedor_id` | INTEGER | Link para vendedor existente |
| `allowed_units` | TEXT[] | Array de IDs das unidades permitidas |
| `last_login` | TIMESTAMP | Último login |
| `last_action` | TIMESTAMP | Última ação |
| `login_attempts` | INTEGER | Tentativas de login |
| `locked_until` | TIMESTAMP | Bloqueado até |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |
| `created_by` | INTEGER | FK para users (quem criou) |
| `updated_by` | INTEGER | FK para users (quem atualizou) |

#### **5. Tabela: `user_sessions`**
**Descrição:** Sessões ativas dos usuários

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID PRIMARY KEY | ID único da sessão |
| `user_id` | INTEGER | FK para users |
| `token_hash` | VARCHAR(255) | Hash do token JWT |
| `ip_address` | INET | IP do usuário |
| `user_agent` | TEXT | User agent do navegador |
| `expires_at` | TIMESTAMP | Data de expiração |
| `created_at` | TIMESTAMP | Data de criação |
| `last_activity` | TIMESTAMP | Última atividade |

#### **6. Tabela: `access_logs`**
**Descrição:** Log de acessos e ações dos usuários

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único do log |
| `user_id` | INTEGER | FK para users |
| `action` | VARCHAR(100) | Ação realizada (login, logout, etc.) |
| `module` | VARCHAR(100) | Módulo acessado |
| `ip_address` | INET | IP do usuário |
| `user_agent` | TEXT | User agent |
| `details` | JSONB | Detalhes adicionais |
| `created_at` | TIMESTAMP | Data de criação |

---

## 🔧 **Lógica de Funcionamento**

### **1. Sistema Hierárquico**
```
adminfranquiadora (nível 1)
├── Acesso total a todas as unidades
├── Todas as permissões (read, write, delete, export)
└── Pode gerenciar outros usuários

adminfranquia (nível 2)
├── Acesso a unidades próprias
├── Vendas e clientes (read/write/delete/export)
├── Dashboards (read/export)
└── Relatórios (read/export)

adminunidade (nível 3)
├── Acesso a unidades específicas
├── Vendas e clientes (read/write/export)
├── Dashboards (read)
└── Sem acesso a configurações

supervisor (nível 4)
├── Acesso a dados do time
├── Vendas (read/write/export)
├── Clientes (read/export)
└── Dashboards (read/export)

vendedor (nível 5)
├── Acesso apenas aos próprios dados
├── Vendas (read/write)
├── Leads (read/write)
└── Dashboard principal (read)
```

### **2. Fluxo de Autenticação**
```
1. Usuário insere credenciais
2. Sistema busca usuário no banco (api.users)
3. Verifica status (active) e acesso (liberado)
4. Valida senha (hash bcrypt)
5. Cria sessão (api.user_sessions)
6. Gera JWT token
7. Retorna dados do usuário + token
8. Frontend armazena token e dados
9. Todas as requisições incluem token
10. Sistema valida token e permissões
```

### **3. Controle de Permissões**
```
1. Usuário tenta acessar módulo
2. Sistema verifica user_type_id
3. Busca permissões em user_type_permissions
4. Verifica se tem permissão para ação (read/write/delete/export)
5. Verifica allowed_units (se aplicável)
6. Permite ou bloqueia acesso
7. Registra log em access_logs
```

---

## 📁 **Arquivos Criados**

### **1. Estrutura do Banco:**
- `temp/login/auth-system-final.sql` - Criação das tabelas e dados iniciais
- `temp/login/auth-permissions.sql` - Configuração de permissões e RLS
- `temp/login/auth-test-setup.sql` - Testes e usuários de exemplo

### **2. Frontend Atualizado:**
- `src/components/Login.jsx` - Componente de login atualizado para usar Supabase
- `src/App.jsx` - Sistema de autenticação já implementado

### **3. Configuração:**
- `src/service/supabase.js` - Cliente Supabase já configurado

---

## 🚀 **Próximos Passos**

### **1. Executar Scripts SQL (PRIORIDADE ALTA)**
```sql
-- 1. Execute no Supabase SQL Editor
-- Arquivo: temp/login/auth-system-final.sql

-- 2. Execute no Supabase SQL Editor  
-- Arquivo: temp/login/auth-permissions.sql

-- 3. Execute no Supabase SQL Editor
-- Arquivo: temp/login/auth-test-setup.sql
```

### **2. Testar Conexão**
```javascript
// Teste no console do navegador
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('username', 'admin')
  .eq('status', 'active')
  .eq('access_status', 'liberado')
  .single();

console.log('Usuário encontrado:', data);
```

### **3. Implementar Hash de Senhas**
```javascript
// Instalar bcrypt
npm install bcryptjs

// Implementar hash no login
import bcrypt from 'bcryptjs';

const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

### **4. Configurar JWT**
```javascript
// Instalar jsonwebtoken
npm install jsonwebtoken

// Implementar geração de token
const token = jwt.sign(
  { userId: user.id, userType: user.user_type_id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### **5. Testar Login Completo**
```javascript
// Fluxo completo de login
const handleLogin = async (username, password) => {
  // 1. Buscar usuário
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('status', 'active')
    .eq('access_status', 'liberado')
    .single();

  // 2. Validar senha
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  // 3. Criar sessão
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  
  // 4. Salvar no localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // 5. Redirecionar para dashboard
  window.location.href = '/dashboard';
};
```

---

## 🔍 **Verificações Importantes**

### **1. Verificar Tabelas Criadas**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'api' 
AND table_name IN ('user_types', 'modules', 'users', 'user_sessions', 'access_logs');
```

### **2. Verificar Permissões**
```sql
SELECT ut.name as tipo_usuario, m.name as modulo, 
       utp.can_read, utp.can_write, utp.can_delete, utp.can_export
FROM api.user_type_permissions utp
JOIN api.user_types ut ON utp.user_type_id = ut.id
JOIN api.modules m ON utp.module_id = m.id
ORDER BY ut.level, m.category, m.name;
```

### **3. Verificar Usuários de Teste**
```sql
SELECT u.username, u.email, ut.name as tipo_usuario, u.status, u.access_status
FROM api.users u
LEFT JOIN api.user_types ut ON u.user_type_id = ut.id;
```

---

## ⚠️ **Pontos de Atenção**

### **1. Segurança**
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas de segurança configuradas
- ⏳ Implementar hash de senhas real
- ⏳ Configurar JWT com expiração
- ⏳ Validar tokens em todas as requisições

### **2. Performance**
- ✅ Índices criados nas tabelas principais
- ⏳ Implementar cache de permissões
- ⏳ Otimizar queries de validação

### **3. Usabilidade**
- ✅ Interface de login já existe
- ⏳ Implementar recuperação de senha
- ⏳ Adicionar validação de campos
- ⏳ Implementar logout automático

---

## 📞 **Suporte**

### **Arquivos de Referência:**
- `temp/login/README.md` - Instruções básicas
- `temp/login/auth-system-final.sql` - Estrutura completa
- `temp/login/auth-permissions.sql` - Configuração de segurança
- `temp/login/auth-test-setup.sql` - Testes e validação

### **Comandos Úteis:**
```bash
# Verificar sincronização de leads
node src/sincronizacao/leads/monitor-sync.js

# Testar conexão Supabase
node -e "console.log('Teste de conexão')"
```

---

**Data de Criação:** 2025-01-19  
**Última Atualização:** 2025-01-19  
**Status:** Pronto para implementação  
**Próxima Etapa:** Executar scripts SQL e testar login dinâmico
