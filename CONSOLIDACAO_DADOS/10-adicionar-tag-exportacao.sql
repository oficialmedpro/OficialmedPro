-- Adicionar campo tag_exportacao na tabela historico_exportacoes
-- Este campo permite agrupar exportações por tipo/tag para o modo vendedor

ALTER TABLE api.historico_exportacoes 
ADD COLUMN IF NOT EXISTS tag_exportacao TEXT;

-- Criar índice para melhorar performance de consultas por tag
CREATE INDEX IF NOT EXISTS idx_historico_exportacoes_tag 
ON api.historico_exportacoes(tag_exportacao);

-- Comentário para documentação
COMMENT ON COLUMN api.historico_exportacoes.tag_exportacao IS 
'Tag ou tipo de exportação para agrupamento no modo vendedor. Ex: "campanha_jan2024", "whatsapi_batch_1", etc.';













