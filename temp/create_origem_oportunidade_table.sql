-- ========================================
-- 📊 CRIAR TABELA DE ORIGENS DAS OPORTUNIDADES
-- ========================================
-- Data: 2025-01-23
-- Objetivo: Criar tabela origem_oportunidade no schema api
-- Baseado na imagem 94.JPG fornecida pelo usuário
-- ========================================

-- 1. Criar tabela origem_oportunidade
CREATE TABLE IF NOT EXISTS api.origem_oportunidade (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir origens baseadas na imagem 94.JPG
INSERT INTO api.origem_oportunidade (nome, descricao) VALUES 
('Google Ads', 'Leads originados de campanhas do Google Ads'),
('Meta Ads', 'Leads originados de campanhas do Meta (Facebook/Instagram)'),
('Orgânico', 'Leads originados organicamente'),
('Indicação', 'Leads originados por indicação'),
('Prescritor', 'Leads originados por prescritores'),
('Campanha', 'Leads originados de campanhas de marketing'),
('Monitoramento', 'Leads originados de monitoramento'),
('Colaborador', 'Leads originados por colaboradores'),
('Franquia', 'Leads originados de franquias'),
('Farmácia Parceira', 'Leads originados de farmácias parceiras'),
('Monitoramento/disp', 'Leads originados de monitoramento/disparo'),
('Site', 'Leads originados do site'),
('Phusion/disparo', 'Leads originados de Phusion/disparo'),
('Contato Rosana', 'Leads originados do contato da Rosana'),
('Contato Poliana', 'Leads originados do contato da Poliana'),
('Yampi Parceiro', 'Leads originados do Yampi Parceiro')
ON CONFLICT (nome) DO NOTHING;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_origem_oportunidade_nome ON api.origem_oportunidade(nome);
CREATE INDEX IF NOT EXISTS idx_origem_oportunidade_ativo ON api.origem_oportunidade(ativo);

-- 4. Verificar dados inseridos
SELECT * FROM api.origem_oportunidade ORDER BY nome;