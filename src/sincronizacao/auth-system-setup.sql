-- 🚀 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO - OFICIALMED
-- Execute este script no SQL Editor do Supabase no schema 'api'

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

-- 4. Tabela de usuários (expandida)
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
    
    -- Hierarquia e unidades
    parent_user_id INTEGER REFERENCES api.users(id), -- Para subordinação
    allowed_units INTEGER[] DEFAULT '{}', -- Array de IDs das unidades permitidas
    
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

-- 5. Tabela de unidades/franquias
CREATE TABLE IF NOT EXISTS api.units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'matriz', 'franquia', 'unidade'
    parent_unit_id INTEGER REFERENCES api.units(id), -- Para hierarquia
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_user_id INTEGER REFERENCES api.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de sessões de usuário
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

-- 7. Tabela de logs de acesso
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_user_type ON api.users(user_type_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON api.users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON api.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON api.users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON api.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON api.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON api.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON api.access_logs(created_at);

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

-- Inserir unidades de exemplo
INSERT INTO api.units (name, code, type, city, state) VALUES
('Matriz Apucarana', 'MTZ-APC', 'matriz', 'Apucarana', 'PR'),
('Franquia Bom Jesus', 'FRQ-BJ', 'franquia', 'Bom Jesus', 'PR'),
('Franquia Belo Horizonte', 'FRQ-BH', 'franquia', 'Belo Horizonte', 'MG'),
('Franquia Londrina', 'FRQ-LON', 'franquia', 'Londrina', 'PR'),
('Franquia Arapongas', 'FRQ-AR', 'franquia', 'Arapongas', 'PR'),
('Franquia Balneário Camboriú', 'FRQ-BC', 'franquia', 'Balneário Camboriú', 'SC')
ON CONFLICT (code) DO NOTHING;

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

-- Função para obter unidades permitidas do usuário
CREATE OR REPLACE FUNCTION api.get_user_allowed_units(p_user_id INTEGER)
RETURNS TABLE(unit_id INTEGER, unit_name VARCHAR(200), unit_code VARCHAR(20)) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.code
    FROM api.units u
    JOIN api.users usr ON (
        -- Admin franqueadora vê todas as unidades
        (usr.user_type_id = (SELECT id FROM api.user_types WHERE name = 'adminfranquiadora')) OR
        -- Outros tipos vêm apenas unidades permitidas
        (u.id = ANY(usr.allowed_units))
    )
    WHERE usr.id = p_user_id
    AND u.is_active = true
    ORDER BY u.name;
END;
$$ LANGUAGE plpgsql;

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
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON api.units FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON api.modules FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();
CREATE TRIGGER update_user_types_updated_at BEFORE UPDATE ON api.user_types FOR EACH ROW EXECUTE FUNCTION api.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE api.user_types IS 'Tipos de usuário hierárquicos do sistema';
COMMENT ON TABLE api.modules IS 'Módulos/permissões disponíveis no sistema';
COMMENT ON TABLE api.users IS 'Usuários do sistema com controle de acesso';
COMMENT ON TABLE api.units IS 'Unidades/franquias do negócio';
COMMENT ON TABLE api.user_sessions IS 'Sessões ativas dos usuários';
COMMENT ON TABLE api.access_logs IS 'Log de acessos e ações dos usuários';
