-- Adicionar coluna id_sprinthub na tabela leads
ALTER TABLE api.leads ADD COLUMN id_sprinthub BIGINT;

-- Criar índice para melhor performance
CREATE INDEX idx_leads_id_sprinthub ON api.leads(id_sprinthub);

-- Comentário da coluna
COMMENT ON COLUMN api.leads.id_sprinthub IS 'ID do lead no SprintHub CRM';

