# Migração do Banco de Dados - Módulo FLOW

## Tabela flow_opportunities

Esta tabela armazena todas as oportunidades (posições dos clientes) nas esteiras do Flow.

```sql
-- Criar tabela flow_opportunities
CREATE TABLE IF NOT EXISTS flow_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  esteira VARCHAR(50) NOT NULL,
  etapa VARCHAR(50),
  tentativas INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'fechada')),
  origem_esteira VARCHAR(50),
  origem_etapa VARCHAR(50),
  ultima_tentativa TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_flow_opportunities_cliente_id ON flow_opportunities(cliente_id);
CREATE INDEX IF NOT EXISTS idx_flow_opportunities_esteira ON flow_opportunities(esteira);
CREATE INDEX IF NOT EXISTS idx_flow_opportunities_status ON flow_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_flow_opportunities_etapa ON flow_opportunities(etapa);
CREATE INDEX IF NOT EXISTS idx_flow_opportunities_cliente_status ON flow_opportunities(cliente_id, status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_flow_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flow_opportunities_updated_at
  BEFORE UPDATE ON flow_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_opportunities_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE flow_opportunities IS 'Armazena as oportunidades (posições) dos clientes nas esteiras do Flow';
COMMENT ON COLUMN flow_opportunities.cliente_id IS 'ID do cliente na tabela clientes';
COMMENT ON COLUMN flow_opportunities.esteira IS 'Nome da esteira (compra, laboratorio, logistica, monitoramento_marketing, etc)';
COMMENT ON COLUMN flow_opportunities.etapa IS 'Etapa dentro da esteira (d30, d60, d90, primeira, r30, r60, r90, infinita)';
COMMENT ON COLUMN flow_opportunities.tentativas IS 'Número de tentativas de contato/venda realizadas';
COMMENT ON COLUMN flow_opportunities.status IS 'Status da oportunidade: ativa ou fechada';
COMMENT ON COLUMN flow_opportunities.origem_esteira IS 'Esteira de origem quando cliente foi movido';
COMMENT ON COLUMN flow_opportunities.origem_etapa IS 'Etapa de origem quando cliente foi movido';
```

## Validações e Constraints

### Esteiras Válidas
As esteiras válidas são:
- `compra`
- `laboratorio`
- `logistica`
- `monitoramento_marketing`
- `monitoramento_comercial`
- `reativacao_marketing`
- `reativacao_comercial`
- `ativacao_marketing`
- `ativacao_comercial`
- `aniversariantes`
- `recorrencia`
- `site`
- `franquia`

### Etapas Válidas
As etapas válidas são:
- `d30`, `d60`, `d90` (para monitoramento)
- `primeira`, `r30`, `r60`, `r90`, `infinita` (para reativação)
- `null` (para esteiras sem etapas específicas)

## Política de Segurança (RLS)

Se estiver usando Row Level Security no Supabase:

```sql
-- Habilitar RLS
ALTER TABLE flow_opportunities ENABLE ROW LEVEL SECURITY;

-- Política para leitura (ajustar conforme sua necessidade)
CREATE POLICY "Permitir leitura de flow_opportunities"
  ON flow_opportunities
  FOR SELECT
  USING (true); -- Ajustar conforme regras de acesso

-- Política para inserção
CREATE POLICY "Permitir inserção de flow_opportunities"
  ON flow_opportunities
  FOR INSERT
  WITH CHECK (true); -- Ajustar conforme regras de acesso

-- Política para atualização
CREATE POLICY "Permitir atualização de flow_opportunities"
  ON flow_opportunities
  FOR UPDATE
  USING (true); -- Ajustar conforme regras de acesso
```

## View Útil: Clientes com Oportunidade Ativa

```sql
CREATE OR REPLACE VIEW vw_clientes_flow_ativo AS
SELECT 
  c.id as cliente_id,
  c.nome,
  c.email,
  c.telefone,
  c.cpf,
  c.ultima_compra,
  fo.id as oportunidade_id,
  fo.esteira,
  fo.etapa,
  fo.tentativas,
  fo.created_at as entrou_na_esteira,
  fo.ultima_tentativa
FROM clientes c
INNER JOIN flow_opportunities fo ON c.id = fo.cliente_id
WHERE fo.status = 'ativa'
ORDER BY fo.created_at DESC;
```

## Função Útil: Mover Cliente para Nova Esteira

```sql
CREATE OR REPLACE FUNCTION mover_cliente_esteira(
  p_cliente_id UUID,
  p_nova_esteira VARCHAR,
  p_nova_etapa VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_opportunity_id UUID;
  v_esteira_anterior VARCHAR;
  v_etapa_anterior VARCHAR;
BEGIN
  -- Fechar oportunidade anterior
  UPDATE flow_opportunities
  SET 
    status = 'fechada',
    closed_at = NOW()
  WHERE cliente_id = p_cliente_id
    AND status = 'ativa'
  RETURNING esteira, etapa INTO v_esteira_anterior, v_etapa_anterior;

  -- Criar nova oportunidade
  INSERT INTO flow_opportunities (
    cliente_id,
    esteira,
    etapa,
    origem_esteira,
    origem_etapa,
    tentativas,
    status
  ) VALUES (
    p_cliente_id,
    p_nova_esteira,
    p_nova_etapa,
    v_esteira_anterior,
    v_etapa_anterior,
    0,
    'ativa'
  )
  RETURNING id INTO v_opportunity_id;

  RETURN v_opportunity_id;
END;
$$ LANGUAGE plpgsql;
```

## Exemplo de Uso da Função

```sql
-- Mover cliente para monitoramento marketing D30
SELECT mover_cliente_esteira(
  'uuid-do-cliente',
  'monitoramento_marketing',
  'd30'
);
```

