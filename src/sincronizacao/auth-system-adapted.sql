-- 🚀 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO - OFICIALMED (ADAPTADO)
-- Aproveitando tabelas existentes: api.unidades e api.vendedores
-- Execute este script no SQL Editor do Supabase no schema 'api'

-- ========================================
-- 1️⃣ TABELAS QUE JÁ EXISTEM (NÃO CRIAR)
-- ========================================
-- ✅ api.unidades - já existe
-- ✅ api.vendedores - já existe

-- ========================================
-- 2️⃣ TABELAS DO SISTEMA DE AUTENTICAÇÃO
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
    vendedor_id INTEGER REFERENCES api.vendedores(id), -- Link para vendedor existente
    allowed_units TEXT[] DEFAULT '{}', -- Array de IDs das unidades permitidas (usa api.unidades.id como TEXT)
    
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
-- 3️⃣ ÍNDICES PARA PERFORMANCE
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
-- 4️⃣ DADOS INICIAIS
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
-- 5️⃣ FUNÇÕES ADAPTADAS
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

-- Função para obter unidades permitidas do usuário (APROVEITANDO api.unidades)
CREATE OR REPLACE FUNCTION api.get_user_allowed_units(p_user_id INTEGER)
RETURNS TABLE(unit_id INTEGER, unit_name TEXT, unit_code TEXT, codigo_sprint TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.nome, COALESCE(u.codigo, u.codigo_sprint) as unit_code, u.codigo_sprint
    FROM api.unidades u
    JOIN api.users usr ON (
        -- Admin franqueadora vê todas as unidades
        (usr.user_type_id = (SELECT id FROM api.user_types WHERE name = 'adminfranquiadora')) OR
        -- Outros tipos vêm apenas unidades permitidas (convertendo tipos)
        (u.id::TEXT = ANY(usr.allowed_units))
    )
    WHERE usr.id = p_user_id
    AND u.status = 'ativo'
    ORDER BY u.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para obter vendedores permitidos do usuário (APROVEITANDO api.vendedores)
CREATE OR REPLACE FUNCTION api.get_user_allowed_vendedores(p_user_id INTEGER)
RETURNS TABLE(vendedor_id INTEGER, vendedor_nome TEXT, vendedor_email TEXT, id_unidade TEXT, id_sprint INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.nome, v.email, v.id_unidade, v.id_sprint
    FROM api.vendedores v
    JOIN api.users usr ON (
        -- Admin franqueadora vê todos os vendedores
        (usr.user_type_id = (SELECT id FROM api.user_types WHERE name = 'adminfranquiadora')) OR
        -- Admin franquia vê vendedores de suas unidades (comparando TEXT com TEXT[])
        (usr.user_type_id = (SELECT id FROM api.user_types WHERE name = 'adminfranquia') 
         AND v.id_unidade = ANY(usr.allowed_units)) OR
        -- Supervisor vê vendedores de suas unidades (comparando TEXT com TEXT[])
        (usr.user_type_id = (SELECT id FROM api.user_types WHERE name = 'supervisor') 
         AND v.id_unidade = ANY(usr.allowed_units)) OR
        -- Vendedor vê apenas a si mesmo
        (usr.user_type_id = (SELECT id FROM api.user_types WHERE name = 'vendedor') 
         AND v.id = usr.vendedor_id)
    )
    WHERE usr.id = p_user_id
    ORDER BY v.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para criar usuário a partir de vendedor existente
CREATE OR REPLACE FUNCTION api.create_user_from_vendedor(
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
-- 6️⃣ TRIGGERS
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
-- 7️⃣ VIEWS PARA FACILITAR CONSULTAS
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
    ut.name as user_type_name,
    ut.description as user_type_description,
    ut.level as user_type_level,
    v.id as vendedor_id,
    v.nome as vendedor_nome,
    v.email as vendedor_email,
    v.id_unidade as vendedor_unidade_id,
    v.id_sprint as vendedor_id_sprint,
    u.created_at,
    u.updated_at
FROM api.users u
LEFT JOIN api.user_types ut ON u.user_type_id = ut.id
LEFT JOIN api.vendedores v ON u.vendedor_id = v.id;

-- View: Unidades com contadores (usando apenas campos que existem)
CREATE OR REPLACE VIEW api.v_unidades_with_counts AS
SELECT 
    u.id,
    u.codigo_sprint,
    u.nome,
    u.cidade,
    u.estado,
    u.franqueado_nome,
    u.email_franqueado,
    u.telefone_franqueado,
    u.status,
    u.data_ativacao,
    u.created_at,
    u.updated_at,
    COUNT(v.id) as total_vendedores,
    COUNT(CASE WHEN v.status = 'ativo' THEN 1 END) as vendedores_ativos
FROM api.unidades u
LEFT JOIN api.vendedores v ON u.id::TEXT = v.id_unidade
GROUP BY u.id, u.codigo_sprint, u.nome, u.cidade, u.estado, 
         u.franqueado_nome, u.email_franqueado, u.telefone_franqueado, 
         u.status, u.data_ativacao, u.created_at, u.updated_at;

-- ========================================
-- 8️⃣ COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE api.user_types IS 'Tipos de usuário hierárquicos do sistema';
COMMENT ON TABLE api.modules IS 'Módulos/permissões disponíveis no sistema';
COMMENT ON TABLE api.users IS 'Usuários do sistema com controle de acesso - integrado com vendedores';
COMMENT ON TABLE api.user_sessions IS 'Sessões ativas dos usuários';
COMMENT ON TABLE api.access_logs IS 'Log de acessos e ações dos usuários';

-- ========================================
-- 9️⃣ EXEMPLO DE CRIAÇÃO DE USUÁRIOS
-- ========================================

-- Exemplo: Criar usuário admin franqueadora
-- SELECT api.create_user_from_vendedor(
--     'admin', 
--     'admin@oficialmed.com.br', 
--     '$2a$10$hash_aqui', 
--     'Admin', 
--     'Franqueadora',
--     'adminfranquiadora'
-- );

-- Exemplo: Criar usuário vendedor baseado em vendedor existente
-- SELECT api.create_user_from_vendedor(
--     'rosana.guarnieri', 
--     'rosana@oficialmed.com.br', 
--     '$2a$10$hash_aqui', 
--     'Rosana', 
--     'Guarnieri',
--     'vendedor',
--     (SELECT id FROM api.vendedores WHERE nome = 'Rosana Guarnieri' LIMIT 1),
--     ARRAY[(SELECT id::TEXT FROM api.unidades WHERE codigo_sprint = '[2]' LIMIT 1)]
-- );
