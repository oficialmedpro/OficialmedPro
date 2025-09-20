-- 🎯 TABELA LEADS - ESTRUTURA COMPLETA PARA SUPABASE
-- Esta é a estrutura da tabela que você precisa criar no Supabase
-- Baseada em TODOS os 79 campos identificados na API do SprintHub

CREATE TABLE api.leads (
    -- 🔑 CHAVE PRIMÁRIA
    id BIGINT PRIMARY KEY,

    -- 👤 DADOS PESSOAIS BÁSICOS
    firstname TEXT,
    lastname TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    mobile TEXT,
    photo_url TEXT,

    -- 📍 ENDEREÇO
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    zipcode TEXT,
    timezone TEXT,
    bairro TEXT,
    complemento TEXT,
    numero_entrega TEXT,
    rua_entrega TEXT,

    -- 🏢 DADOS COMERCIAIS
    company TEXT,
    points INTEGER DEFAULT 0,
    owner INTEGER,
    stage TEXT,
    preferred_locale TEXT,

    -- 📋 CONTROLE DE ACESSO
    user_access JSONB,
    department_access JSONB,
    ignore_sub_departments BOOLEAN DEFAULT false,

    -- 📅 DATAS E CONTROLE
    create_date TIMESTAMPTZ,
    updated_date TIMESTAMPTZ,
    last_active TIMESTAMPTZ,
    created_by BIGINT,
    created_by_name TEXT,
    created_by_type TEXT,
    updated_by INTEGER,
    updated_by_name TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- 🗂️ DADOS EXTRAS (CAMPOS PERSONALIZADOS)
    archived BOOLEAN DEFAULT false,
    third_party_data JSONB,

    -- 💰 FINANCEIRO E INVESTIMENTOS
    capital_de_investimento TEXT,
    tipo_de_compra TEXT,
    pedidos_shopify TEXT,

    -- 📊 CLASSIFICAÇÃO E AVALIAÇÃO
    categoria TEXT,
    classificacao_google TEXT,
    grau_de_interesse TEXT,
    star_score TEXT,
    avaliacao_atendente TEXT,
    avaliacao_atendimento TEXT,
    qualificacao_callix TEXT,

    -- 🎯 MARKETING E ORIGEM
    origem TEXT,
    origem_manipulacao TEXT,
    lista_de_origem TEXT,
    criativo TEXT,
    plataforma TEXT,
    redes_sociais TEXT,
    site TEXT,

    -- 📞 ATENDIMENTO
    atendente TEXT,
    atendente_atual TEXT,
    feedback TEXT,
    observacao TEXT,
    observacoes_do_lead TEXT,
    comportamento_da_ia TEXT,
    retorno TEXT,

    -- 🏥 DADOS ESPECÍFICOS (FARMÁCIA/MEDICINA)
    prescritor TEXT,
    produto TEXT,
    drograria TEXT,
    data_recompra DATE,
    mes_que_entrou TEXT,

    -- 📄 DOCUMENTOS E IDENTIFICAÇÃO
    cpf TEXT,
    rg TEXT,
    arquivo_receita TEXT,
    id_t56 TEXT,

    -- 👥 DADOS PESSOAIS EXTRAS
    empresa TEXT,
    sexo TEXT,
    data_de_nascimento DATE,
    objetivos_do_cliente TEXT,
    perfil_do_cliente TEXT,
    recebedor TEXT,

    -- 📱 WHATSAPP E INTEGRAÇÕES
    whatsapp_remote_lid TEXT,

    -- 📋 STATUS E CONTROLE
    status TEXT,
    sh_status TEXT,
    data_do_contato DATE
);

-- 📚 ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_leads_email ON api.leads(email);
CREATE INDEX idx_leads_phone ON api.leads(phone);
CREATE INDEX idx_leads_whatsapp ON api.leads(whatsapp);
CREATE INDEX idx_leads_mobile ON api.leads(mobile);
CREATE INDEX idx_leads_firstname ON api.leads(firstname);
CREATE INDEX idx_leads_lastname ON api.leads(lastname);
CREATE INDEX idx_leads_create_date ON api.leads(create_date);
CREATE INDEX idx_leads_synced_at ON api.leads(synced_at);
CREATE INDEX idx_leads_archived ON api.leads(archived);

-- 🔗 COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE api.leads IS 'Tabela de leads sincronizada do SprintHub - contém todos os leads para análise RFV';
COMMENT ON COLUMN api.leads.id IS 'ID único do lead no SprintHub (chave primária)';
COMMENT ON COLUMN api.leads.points IS 'Pontuação do lead no sistema';
COMMENT ON COLUMN api.leads.owner IS 'Proprietário/responsável pelo lead';
COMMENT ON COLUMN api.leads.stage IS 'Estágio atual do lead no funil';
COMMENT ON COLUMN api.leads.firstname IS 'Primeiro nome do lead';
COMMENT ON COLUMN api.leads.lastname IS 'Último nome do lead';
COMMENT ON COLUMN api.leads.email IS 'Email principal do lead';
COMMENT ON COLUMN api.leads.whatsapp IS 'Número do WhatsApp';
COMMENT ON COLUMN api.leads.mobile IS 'Número do celular';
COMMENT ON COLUMN api.leads.user_access IS 'Array JSON de usuários com acesso';
COMMENT ON COLUMN api.leads.department_access IS 'Array JSON de departamentos com acesso';
COMMENT ON COLUMN api.leads.synced_at IS 'Timestamp da última sincronização';
COMMENT ON COLUMN api.leads.archived IS 'Flag para indicar se está arquivado (false=ativo, true=arquivado)';

-- 📝 GRANTS DE PERMISSÃO
GRANT ALL ON api.leads TO service_role;
GRANT SELECT, INSERT, UPDATE ON api.leads TO anon;
GRANT SELECT, INSERT, UPDATE ON api.leads TO authenticated;