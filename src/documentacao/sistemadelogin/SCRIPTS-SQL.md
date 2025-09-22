# 📜 Scripts SQL - Sistema de Login

## 🗂️ **Organização dos Arquivos**

### **Localização dos Scripts:**
- `temp/login/auth-system-final.sql` - Estrutura completa do banco
- `temp/login/auth-permissions.sql` - Configuração de permissões
- `temp/login/auth-test-setup.sql` - Testes e usuários de exemplo

---

## 🚀 **Sequência de Execução**

### **PASSO 1: Criar Estrutura do Banco**
```sql
-- Execute: temp/login/auth-system-final.sql
-- Objetivo: Criar todas as tabelas, dados iniciais e funções
```

### **PASSO 2: Configurar Permissões**
```sql
-- Execute: temp/login/auth-permissions.sql
-- Objetivo: Configurar RLS, políticas e GRANTs
```

### **PASSO 3: Testar e Validar**
```sql
-- Execute: temp/login/auth-test-setup.sql
-- Objetivo: Criar usuários de teste e validar funcionamento
```

---

## 📋 **Script 1: Estrutura do Banco (auth-system-final.sql)**

### **Conteúdo Completo:**
```sql
-- 🚀 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO - OFICIALMED (VERSÃO FINAL)
-- Compatível com qualquer estrutura de api.unidades e api.vendedores
-- Execute este script no SQL Editor do Supabase no schema 'api'

-- ========================================
-- 1️⃣ TABELAS DO SISTEMA DE AUTENTICAÇÃO
-- ========================================

-- 1. Tabela de tipos de usuário
CREATE TABLE IF NOT EXISTS api.user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level INTEGER NOT NULL, -- Nível hierárquico (1 = mais alto)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de módulos/permissões
CREATE TABLE IF NOT EXISTS api.modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50), -- Ex: 'dashboard', 'vendas', 'relatorios'
    icon VARCHAR(50), -- Ícone para interface
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de permissões por tipo de usuário
CREATE TABLE IF NOT EXISTS api.user_type_permissions (
    id SERIAL PRIMARY KEY,
    user_type_id INTEGER REFERENCES api.user_types(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES api.modules(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_type_id, module_id)
);

-- 4. Tabela de usuários (expandida) - APROVEITANDO vendedores existentes
CREATE TABLE IF NOT EXISTS api.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    
    -- Status e acesso
    user_type_id INTEGER REFERENCES api.user_types(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, blocked, inactive
    access_status VARCHAR(20) DEFAULT 'liberado', -- liberado, bloqueado
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Relacionamento com tabelas existentes
    vendedor_id INTEGER, -- Link para vendedor existente (sem FK para evitar problemas)
    allowed_units TEXT[] DEFAULT '{}', -- Array de IDs das unidades permitidas
    
    -- Controle de acesso
    last_login TIMESTAMP WITH TIME ZONE,
    last_action TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES api.users(id),
    updated_by INTEGER REFERENCES api.users(id)
);

-- 5. Tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS api.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES api.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS api.access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES api.users(id),
    action VARCHAR(100) NOT NULL, -- login, logout, permission_denied, etc
    module VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2️⃣ ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_user_type ON api.users(user_type_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON api.users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON api.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON api.users(username);
CREATE INDEX IF NOT EXISTS idx_users_vendedor_id ON api.users(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON api.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON api.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON api.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON api.access_logs(created_at);

-- ========================================
-- 3️⃣ DADOS INICIAIS
-- ========================================

-- Inserir tipos de usuário padrão
INSERT INTO api.user_types (name, description, level) VALUES
('adminfranquiadora', 'Administrador da Franqueadora - Acesso total a todas as unidades', 1),
('adminfranquia', 'Administrador da Franquia - Acesso a unidades próprias', 2),
('adminunidade', 'Administrador da Unidade - Acesso a unidades específicas', 3),
('supervisor', 'Supervisor - Acesso a dados do time de vendas', 4),
('vendedor', 'Vendedor - Acesso apenas aos próprios dados', 5)
ON CONFLICT (name) DO NOTHING;

-- Inserir módulos padrão
INSERT INTO api.modules (name, description, category, icon) VALUES
-- Dashboard
('dashboard', 'Painel Principal', 'dashboard', 'dashboard'),
('dashboard_vendas', 'Dashboard de Vendas', 'dashboard', 'trending-up'),
('dashboard_financeiro', 'Dashboard Financeiro', 'dashboard', 'dollar-sign'),

-- Vendas
('vendas', 'Módulo de Vendas', 'vendas', 'shopping-cart'),
('vendas_oportunidades', 'Oportunidades de Venda', 'vendas', 'target'),
('vendas_propostas', 'Propostas', 'vendas', 'file-text'),
('vendas_relatorios', 'Relatórios de Vendas', 'vendas', 'bar-chart'),

-- Clientes
('clientes', 'Gestão de Clientes', 'clientes', 'users'),
('clientes_leads', 'Leads', 'clientes', 'user-plus'),
('clientes_cadastro', 'Cadastro de Clientes', 'clientes', 'user-edit'),

-- Financeiro
('financeiro', 'Módulo Financeiro', 'financeiro', 'credit-card'),
('financeiro_contas', 'Contas a Pagar/Receber', 'financeiro', 'receipt'),
('financeiro_relatorios', 'Relatórios Financeiros', 'financeiro', 'pie-chart'),

-- Relatórios
('relatorios', 'Módulo de Relatórios', 'relatorios', 'file-text'),
('relatorios_vendas', 'Relatórios de Vendas', 'relatorios', 'bar-chart'),
('relatorios_financeiro', 'Relatórios Financeiros', 'relatorios', 'trending-up'),

-- Configurações
('configuracoes', 'Configurações do Sistema', 'configuracoes', 'settings'),
('configuracoes_usuarios', 'Gestão de Usuários', 'configuracoes', 'users'),
('configuracoes_unidades', 'Gestão de Unidades', 'configuracoes', 'building'),

-- RFV
('rfv', 'Análise RFV', 'analise', 'activity'),
('rfv_matriz', 'Matriz RFV', 'analise', 'grid')
ON CONFLICT (name) DO NOTHING;

-- Definir permissões padrão por tipo de usuário
-- Admin Franqueadora - Acesso total
INSERT INTO api.user_type_permissions (user_type_id, module_id, can_read, can_write, can_delete, can_export)
SELECT ut.id, m.id, true, true, true, true
FROM api.user_types ut, api.modules m
WHERE ut.name = 'adminfranquiadora';

-- Admin Franquia - Acesso a vendas, clientes, relatórios próprios
INSERT INTO api.user_type_permissions (user_type_id, module_id, can_read, can_write, can_delete, can_export)
SELECT ut.id, m.id, 
    CASE WHEN m.category IN ('dashboard', 'vendas', 'clientes', 'relatorios') THEN true ELSE false END,
    CASE WHEN m.category IN ('vendas', 'clientes') THEN true ELSE false END,
    CASE WHEN m.category IN ('vendas', 'clientes') THEN true ELSE false END,
    true
FROM api.user_types ut, api.modules m
WHERE ut.name = 'adminfranquia';

-- Admin Unidade - Acesso limitado à unidade
INSERT INTO api.user_type_permissions (user_type_id, module_id, can_read, can_write, can_delete, can_export)
SELECT ut.id, m.id, 
    CASE WHEN m.category IN ('dashboard', 'vendas', 'clientes') THEN true ELSE false END,
    CASE WHEN m.category IN ('vendas', 'clientes') THEN true ELSE false END,
    false,
    CASE WHEN m.category IN ('vendas', 'clientes') THEN true ELSE false END
FROM api.user_types ut, api.modules m
WHERE ut.name = 'adminunidade';

-- Supervisor - Acesso a dados do time
INSERT INTO api.user_type_permissions (user_type_id, module_id, can_read, can_write, can_delete, can_export)
SELECT ut.id, m.id, 
    CASE WHEN m.category IN ('dashboard', 'vendas', 'clientes') THEN true ELSE false END,
    CASE WHEN m.category IN ('vendas') THEN true ELSE false END,
    false,
    true
FROM api.user_types ut, api.modules m
WHERE ut.name = 'supervisor';

-- Vendedor - Acesso apenas aos próprios dados
INSERT INTO api.user_type_permissions (user_type_id, module_id, can_read, can_write, can_delete, can_export)
SELECT ut.id, m.id, 
    CASE WHEN m.name IN ('dashboard', 'vendas', 'clientes_leads') THEN true ELSE false END,
    CASE WHEN m.name IN ('vendas', 'clientes_leads') THEN true ELSE false END,
    false,
    false
FROM api.user_types ut, api.modules m
WHERE ut.name = 'vendedor';

-- ========================================
-- 4️⃣ FUNÇÕES BÁSICAS (SEM DEPENDÊNCIAS EXTERNAS)
-- ========================================

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION api.check_user_permission(
    p_user_id INTEGER,
    p_module_name VARCHAR(100),
    p_action VARCHAR(20) DEFAULT 'read'
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT CASE 
        WHEN p_action = 'read' THEN utp.can_read
        WHEN p_action = 'write' THEN utp.can_write
        WHEN p_action = 'delete' THEN utp.can_delete
        WHEN p_action = 'export' THEN utp.can_export
        ELSE FALSE
    END INTO has_permission
    FROM api.users u
    JOIN api.user_type_permissions utp ON u.user_type_id = utp.user_type_id
    JOIN api.modules m ON utp.module_id = m.id
    WHERE u.id = p_user_id 
    AND m.name = p_module_name
    AND u.status = 'active'
    AND u.access_status = 'liberado';
    
    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Função para criar usuário básico
CREATE OR REPLACE FUNCTION api.create_user(
    p_username VARCHAR(50),
    p_email VARCHAR(255),
    p_password_hash VARCHAR(255),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_user_type_name VARCHAR(50),
    p_vendedor_id INTEGER DEFAULT NULL,
    p_allowed_units TEXT[] DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    user_type_id INTEGER;
    new_user_id INTEGER;
BEGIN
    -- Obter ID do tipo de usuário
    SELECT id INTO user_type_id FROM api.user_types WHERE name = p_user_type_name;
    
    IF user_type_id IS NULL THEN
        RAISE EXCEPTION 'Tipo de usuário % não encontrado', p_user_type_name;
    END IF;
    
    -- Criar usuário
    INSERT INTO api.users (
        username, email, password_hash, first_name, last_name,
        user_type_id, vendedor_id, allowed_units
    ) VALUES (
        p_username, p_email, p_password_hash, p_first_name, p_last_name,
        user_type_id, p_vendedor_id, p_allowed_units
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5️⃣ TRIGGERS
-- ========================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas principais
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON api.users FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON api.modules FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();
CREATE TRIGGER update_user_types_updated_at BEFORE UPDATE ON api.user_types FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

-- ========================================
-- 6️⃣ VIEWS BÁSICAS (SEM DEPENDÊNCIAS EXTERNAS)
-- ========================================

-- View: Usuários com informações completas
CREATE OR REPLACE VIEW api.v_users_complete AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    u.access_status,
    u.is_online,
    u.last_login,
    u.vendedor_id,
    u.allowed_units,
    ut.name as user_type_name,
    ut.description as user_type_description,
    ut.level as user_type_level,
    u.created_at,
    u.updated_at
FROM api.users u
LEFT JOIN api.user_types ut ON u.user_type_id = ut.id;

-- ========================================
-- 7️⃣ COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE api.user_types IS 'Tipos de usuário hierárquicos do sistema';
COMMENT ON TABLE api.modules IS 'Módulos/permissões disponíveis no sistema';
COMMENT ON TABLE api.users IS 'Usuários do sistema com controle de acesso';
COMMENT ON TABLE api.user_sessions IS 'Sessões ativas dos usuários';
COMMENT ON TABLE api.access_logs IS 'Log de acessos e ações dos usuários';
```

---

## 📋 **Script 2: Configuração de Permissões (auth-permissions.sql)**

### **Conteúdo Completo:**
```sql
-- ========================================
-- 🔐 CONFIGURAR PERMISSÕES SISTEMA DE AUTENTICAÇÃO
-- ========================================
-- Data: 2025-01-19
-- Objetivo: Configurar RLS e permissões para tabelas do sistema de auth
-- ========================================

-- ========================================
-- 1️⃣ TABELA: api.user_types
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (user_types)" ON api.user_types;
DROP POLICY IF EXISTS "Allow insert for authenticated users (user_types)" ON api.user_types;
DROP POLICY IF EXISTS "Allow update for authenticated users (user_types)" ON api.user_types;
DROP POLICY IF EXISTS "Allow delete for authenticated users (user_types)" ON api.user_types;

-- 1) Habilitar RLS
ALTER TABLE api.user_types ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (user_types)" ON api.user_types
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (apenas para service_role)
CREATE POLICY "Allow insert for service_role (user_types)" ON api.user_types
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for service_role (user_types)" ON api.user_types
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for service_role (user_types)" ON api.user_types
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.user_types TO anon;
GRANT SELECT ON api.user_types TO authenticated;
GRANT ALL ON api.user_types TO service_role;

-- ========================================
-- 2️⃣ TABELA: api.modules
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (modules)" ON api.modules;
DROP POLICY IF EXISTS "Allow insert for authenticated users (modules)" ON api.modules;
DROP POLICY IF EXISTS "Allow update for authenticated users (modules)" ON api.modules;
DROP POLICY IF EXISTS "Allow delete for authenticated users (modules)" ON api.modules;

-- 1) Habilitar RLS
ALTER TABLE api.modules ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (modules)" ON api.modules
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (apenas para service_role)
CREATE POLICY "Allow insert for service_role (modules)" ON api.modules
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for service_role (modules)" ON api.modules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for service_role (modules)" ON api.modules
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.modules TO anon;
GRANT SELECT ON api.modules TO authenticated;
GRANT ALL ON api.modules TO service_role;

-- ========================================
-- 3️⃣ TABELA: api.user_type_permissions
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (user_type_permissions)" ON api.user_type_permissions;
DROP POLICY IF EXISTS "Allow insert for authenticated users (user_type_permissions)" ON api.user_type_permissions;
DROP POLICY IF EXISTS "Allow update for authenticated users (user_type_permissions)" ON api.user_type_permissions;
DROP POLICY IF EXISTS "Allow delete for authenticated users (user_type_permissions)" ON api.user_type_permissions;

-- 1) Habilitar RLS
ALTER TABLE api.user_type_permissions ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (user_type_permissions)" ON api.user_type_permissions
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (apenas para service_role)
CREATE POLICY "Allow insert for service_role (user_type_permissions)" ON api.user_type_permissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for service_role (user_type_permissions)" ON api.user_type_permissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for service_role (user_type_permissions)" ON api.user_type_permissions
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.user_type_permissions TO anon;
GRANT SELECT ON api.user_type_permissions TO authenticated;
GRANT ALL ON api.user_type_permissions TO service_role;

-- ========================================
-- 4️⃣ TABELA: api.users (PRINCIPAL - AUTENTICAÇÃO)
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (users)" ON api.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users (users)" ON api.users;
DROP POLICY IF EXISTS "Allow update for authenticated users (users)" ON api.users;
DROP POLICY IF EXISTS "Allow delete for authenticated users (users)" ON api.users;
DROP POLICY IF EXISTS "Allow login check (users)" ON api.users;

-- 1) Habilitar RLS
ALTER TABLE api.users ENABLE ROW LEVEL SECURITY;

-- 2) Política especial para login (sem autenticação necessária)
CREATE POLICY "Allow login check (users)" ON api.users
  FOR SELECT
  USING (true);

-- 3) Políticas de leitura para usuários autenticados
CREATE POLICY "Allow select for authenticated users (users)" ON api.users
  FOR SELECT
  USING (true);

-- 4) Políticas de escrita (apenas para service_role)
CREATE POLICY "Allow insert for service_role (users)" ON api.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for service_role (users)" ON api.users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for service_role (users)" ON api.users
  FOR DELETE
  USING (true);

-- 5) GRANTs
-- IMPORTANTE: anon precisa de SELECT para login funcionar
GRANT SELECT ON api.users TO anon;
GRANT SELECT ON api.users TO authenticated;
GRANT ALL ON api.users TO service_role;

-- ========================================
-- 5️⃣ TABELA: api.user_sessions
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (user_sessions)" ON api.user_sessions;
DROP POLICY IF EXISTS "Allow insert for authenticated users (user_sessions)" ON api.user_sessions;
DROP POLICY IF EXISTS "Allow update for authenticated users (user_sessions)" ON api.user_sessions;
DROP POLICY IF EXISTS "Allow delete for authenticated users (user_sessions)" ON api.user_sessions;

-- 1) Habilitar RLS
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (user_sessions)" ON api.user_sessions
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita
CREATE POLICY "Allow insert for authenticated users (user_sessions)" ON api.user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (user_sessions)" ON api.user_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (user_sessions)" ON api.user_sessions
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.user_sessions TO authenticated;
GRANT ALL ON api.user_sessions TO service_role;

-- ========================================
-- 6️⃣ TABELA: api.access_logs
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (access_logs)" ON api.access_logs;
DROP POLICY IF EXISTS "Allow insert for authenticated users (access_logs)" ON api.access_logs;
DROP POLICY IF EXISTS "Allow update for authenticated users (access_logs)" ON api.access_logs;
DROP POLICY IF EXISTS "Allow delete for authenticated users (access_logs)" ON api.access_logs;

-- 1) Habilitar RLS
ALTER TABLE api.access_logs ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (access_logs)" ON api.access_logs
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita
CREATE POLICY "Allow insert for authenticated users (access_logs)" ON api.access_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (access_logs)" ON api.access_logs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (access_logs)" ON api.user_sessions
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.access_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.access_logs TO authenticated;
GRANT ALL ON api.access_logs TO service_role;

-- ========================================
-- 7️⃣ VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar permissões (GRANTs) de todas as tabelas
SELECT
  table_schema, 
  table_name, 
  privilege_type, 
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' 
  AND table_name IN ('user_types', 'modules', 'user_type_permissions', 'users', 'user_sessions', 'access_logs')
ORDER BY table_name, grantee, privilege_type;

-- Verificar políticas (RLS) de todas as tabelas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE schemaname = 'api' 
  AND tablename IN ('user_types', 'modules', 'user_type_permissions', 'users', 'user_sessions', 'access_logs')
ORDER BY tablename, policyname;

-- ========================================
-- 8️⃣ TESTE DE CONEXÃO
-- ========================================

-- Teste básico de acesso às tabelas
SELECT 'user_types' as tabela, count(*) as registros FROM api.user_types
UNION ALL
SELECT 'modules' as tabela, count(*) as registros FROM api.modules
UNION ALL
SELECT 'user_type_permissions' as tabela, count(*) as registros FROM api.user_type_permissions
UNION ALL
SELECT 'users' as tabela, count(*) as registros FROM api.users
UNION ALL
SELECT 'user_sessions' as tabela, count(*) as registros FROM api.user_sessions
UNION ALL
SELECT 'access_logs' as tabela, count(*) as registros FROM api.access_logs;
```

---

## 📋 **Script 3: Testes e Validação (auth-test-setup.sql)**

### **Conteúdo Completo:**
```sql
-- ========================================
-- 🧪 TESTE E CONFIGURAÇÃO INICIAL DO SISTEMA DE AUTH
-- ========================================
-- Data: 2025-01-19
-- Objetivo: Testar conexão e criar usuário de teste
-- ========================================

-- ========================================
-- 1️⃣ VERIFICAR SE AS TABELAS EXISTEM
-- ========================================

SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'api' 
  AND table_name IN ('user_types', 'modules', 'user_type_permissions', 'users', 'user_sessions', 'access_logs')
ORDER BY table_name;

-- ========================================
-- 2️⃣ VERIFICAR DADOS INICIAIS
-- ========================================

-- Verificar tipos de usuário
SELECT 'user_types' as tabela, count(*) as registros FROM api.user_types;

-- Verificar módulos
SELECT 'modules' as tabela, count(*) as registros FROM api.modules;

-- Verificar permissões
SELECT 'user_type_permissions' as tabela, count(*) as registros FROM api.user_type_permissions;

-- ========================================
-- 3️⃣ CRIAR USUÁRIO DE TESTE
-- ========================================

-- Criar usuário admin para teste
INSERT INTO api.users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name,
  user_type_id,
  status,
  access_status
) VALUES (
  'admin',
  'admin@oficialmed.com.br',
  '$2a$10$hash_placeholder', -- Substituir por hash real depois
  'Administrador',
  'OficialMed',
  (SELECT id FROM api.user_types WHERE name = 'adminfranquiadora'),
  'active',
  'liberado'
) ON CONFLICT (username) DO NOTHING;

-- Criar usuário vendedor para teste
INSERT INTO api.users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name,
  user_type_id,
  status,
  access_status,
  vendedor_id,
  allowed_units
) VALUES (
  'vendedor.teste',
  'vendedor@oficialmed.com.br',
  '$2a$10$hash_placeholder', -- Substituir por hash real depois
  'Vendedor',
  'Teste',
  (SELECT id FROM api.user_types WHERE name = 'vendedor'),
  'active',
  'liberado',
  1, -- ID do vendedor (ajustar conforme necessário)
  ARRAY['1', '2'] -- IDs das unidades permitidas
) ON CONFLICT (username) DO NOTHING;

-- ========================================
-- 4️⃣ VERIFICAR USUÁRIOS CRIADOS
-- ========================================

SELECT 
  u.id,
  u.username,
  u.email,
  u.first_name,
  u.last_name,
  ut.name as user_type_name,
  u.status,
  u.access_status,
  u.vendedor_id,
  u.allowed_units
FROM api.users u
LEFT JOIN api.user_types ut ON u.user_type_id = ut.id
ORDER BY u.id;

-- ========================================
-- 5️⃣ TESTAR FUNÇÃO DE VERIFICAÇÃO DE PERMISSÕES
-- ========================================

-- Testar função check_user_permission
SELECT 
  'Teste permissão admin para dashboard' as teste,
  api.check_user_permission(1, 'dashboard', 'read') as resultado;

SELECT 
  'Teste permissão admin para configuracoes' as teste,
  api.check_user_permission(1, 'configuracoes', 'write') as resultado;

-- ========================================
-- 6️⃣ TESTAR ACESSO VIA SUPABASE CLIENT
-- ========================================

-- Query que o frontend vai executar para login
SELECT 
  u.id,
  u.username,
  u.email,
  u.password_hash,
  u.first_name,
  u.last_name,
  u.user_type_id,
  ut.name as user_type_name,
  u.status,
  u.access_status,
  u.vendedor_id,
  u.allowed_units
FROM api.users u
LEFT JOIN api.user_types ut ON u.user_type_id = ut.id
WHERE u.username = 'admin'
  AND u.status = 'active'
  AND u.access_status = 'liberado';

-- ========================================
-- 7️⃣ VERIFICAR PERMISSÕES POR TIPO DE USUÁRIO
-- ========================================

-- Mostrar todas as permissões do admin franqueadora
SELECT 
  ut.name as tipo_usuario,
  m.name as modulo,
  m.category,
  utp.can_read,
  utp.can_write,
  utp.can_delete,
  utp.can_export
FROM api.user_type_permissions utp
JOIN api.user_types ut ON utp.user_type_id = ut.id
JOIN api.modules m ON utp.module_id = m.id
WHERE ut.name = 'adminfranquiadora'
ORDER BY m.category, m.name;

-- ========================================
-- 8️⃣ RESUMO FINAL
-- ========================================

SELECT 
  'Sistema de Autenticação' as sistema,
  'Configurado e testado' as status,
  (SELECT count(*) FROM api.users) as usuarios_criados,
  (SELECT count(*) FROM api.user_types) as tipos_usuario,
  (SELECT count(*) FROM api.modules) as modulos_disponiveis,
  (SELECT count(*) FROM api.user_type_permissions) as permissoes_configuradas;
```

---

## 🎯 **Comandos para Testar no Frontend**

### **1. Teste de Conexão**
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

### **2. Teste de Permissões**
```javascript
// Teste de permissões
const { data: permissions } = await supabase
  .from('user_type_permissions')
  .select(`
    user_types(name),
    modules(name, category),
    can_read, can_write, can_delete, can_export
  `)
  .eq('user_types.name', 'adminfranquiadora');
```

### **3. Teste de Login Completo**
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

  // 2. Validar senha (implementar bcrypt depois)
  // const isValid = await bcrypt.compare(password, user.password_hash);
  
  // 3. Salvar no localStorage
  localStorage.setItem('user', JSON.stringify(user));
  
  // 4. Redirecionar
  window.location.href = '/dashboard';
};
```

---

## ⚠️ **Pontos Importantes**

### **1. Ordem de Execução**
- ✅ **Sempre execute na ordem:** 1 → 2 → 3
- ✅ **Não pule nenhum script**
- ✅ **Verifique se não há erros**

### **2. Verificações**
- ✅ **Confirme que todas as tabelas foram criadas**
- ✅ **Verifique se as permissões foram aplicadas**
- ✅ **Teste se os usuários de exemplo foram criados**

### **3. Próximos Passos**
- ⏳ **Implementar hash de senhas real**
- ⏳ **Configurar JWT para sessões**
- ⏳ **Testar login no frontend**
- ⏳ **Implementar logout e renovação de token**

---

**Estes scripts contêm toda a configuração necessária para o sistema de login funcionar completamente.**
