# Sistema de Proteção de Campos Editados Manualmente

## 📋 Visão Geral

Este sistema protege campos que foram editados manualmente através da interface, evitando que sejam sobrescritos pela consolidação automática de dados das fontes (Prime, SprintHub, GreatPage, BlackLabs).

## ✅ O Que Foi Implementado

### 1. **Correção do Modal de Edição** ✅
- Corrigido problema de re-renders infinitos que impedia a edição dos campos
- Agora você pode editar todos os campos sem travamentos
- Modal ajustado para não ter botões saindo da tela

### 2. **Sistema de Proteção de Campos** ✅
- Tabela `api.campos_protegidos` para registrar campos editados manualmente
- Triggers atualizadas para respeitar campos protegidos
- Sistema de auditoria para acompanhar proteções

### 3. **Triggers Atualizadas** ✅
- Consolidação automática agora verifica se campo está protegido
- Campos protegidos NUNCA são sobrescritos, mesmo por fontes autoritativas (Prime/Sprint)
- Novos clientes não são afetados (só protege após edição manual)

## 🚀 Como Instalar

Execute os scripts SQL no Supabase **NA ORDEM**:

```bash
# 1. Criar sistema de proteção
psql -f create-campos-protegidos-system.sql

# 2. Atualizar triggers para respeitar proteções
psql -f update-triggers-respeitar-campos-protegidos.sql
```

Ou execute diretamente no **SQL Editor** do Supabase:

1. Copie o conteúdo de `create-campos-protegidos-system.sql`
2. Execute no SQL Editor
3. Copie o conteúdo de `update-triggers-respeitar-campos-protegidos.sql`
4. Execute no SQL Editor

## 🎯 Como Usar

### Editar Campos Manualmente

1. Na página **Clientes Consolidados**, seção **Ativação**
2. Clique no botão ⚙️ (engrenagem) ao lado do nome do cliente
3. Modal abre com todos os campos editáveis
4. Edite os campos desejados
5. Clique em **"Salvar Alterações"**

**O que acontece:**
- Campos editados são salvos na tabela `clientes_mestre`
- Cada campo editado é registrado em `campos_protegidos`
- Consolidação automática não sobrescreverá mais esses campos

### Verificar Campos Protegidos

```sql
-- Ver todos os campos protegidos com informações do cliente
SELECT * FROM api.vw_campos_protegidos_auditoria
ORDER BY data_protecao DESC;

-- Ver campos protegidos de um cliente específico
SELECT * FROM api.campos_protegidos
WHERE id_cliente_mestre = 123;
```

### Desproteger um Campo

Se você quiser que um campo volte a ser atualizado pela consolidação automática:

```sql
-- Desproteger um campo específico
SELECT api.desproteger_campo(123, 'email');

-- Desproteger todos os campos de um cliente
SELECT api.desproteger_cliente(123);
```

## 📊 Campos que Podem ser Protegidos

Todos os campos editáveis no modal são protegidos automaticamente ao salvar:

- ✅ `nome_completo`
- ✅ `email`
- ✅ `whatsapp`
- ✅ `telefone`
- ✅ `cpf`
- ✅ `sexo`
- ✅ `data_nascimento`
- ✅ `cep`
- ✅ `estado`
- ✅ `cidade`
- ✅ `endereco_rua`
- ✅ `endereco_numero`
- ✅ `endereco_complemento`

## 🔍 Auditoria e Monitoramento

### Ver Estatísticas de Proteção

```sql
-- Quantos campos protegidos por tipo
SELECT
  campo_protegido,
  COUNT(*) as total_protecoes
FROM api.campos_protegidos
GROUP BY campo_protegido
ORDER BY total_protecoes DESC;

-- Clientes com mais campos protegidos
SELECT
  cm.nome_completo,
  COUNT(*) as campos_protegidos
FROM api.campos_protegidos cp
JOIN api.clientes_mestre cm ON cm.id = cp.id_cliente_mestre
GROUP BY cm.id, cm.nome_completo
ORDER BY campos_protegidos DESC
LIMIT 20;

-- Proteções recentes
SELECT * FROM api.vw_campos_protegidos_auditoria
WHERE data_protecao >= NOW() - INTERVAL '7 days'
ORDER BY data_protecao DESC;
```

## 🛡️ Como Funciona a Proteção

### Fluxo Normal (SEM proteção)
1. Dados chegam do Prime/Sprint
2. Trigger de consolidação sobrescreve campos
3. Cliente fica com dados da fonte autoritativa

### Fluxo COM Proteção
1. Usuário edita campo manualmente no modal
2. Campo é salvo + registrado em `campos_protegidos`
3. Dados chegam do Prime/Sprint
4. **Trigger verifica:** Campo está protegido? ✅
5. **Trigger mantém:** Valor editado manualmente (não sobrescreve)

## ⚠️ Importante

- **Fontes Autoritativas:** Mesmo Prime e SprintHub (fontes prioritárias) respeitam campos protegidos
- **Novos Clientes:** Proteção só se aplica após edição manual. Novos clientes seguem consolidação normal
- **Qualidade de Dados:** A qualidade é recalculada mesmo com campos protegidos
- **Performance:** As verificações são rápidas (índices otimizados)

## 🧪 Teste a Proteção

```sql
-- 1. Verificar dados atuais de um cliente
SELECT id, nome_completo, email FROM api.clientes_mestre WHERE id = 123;

-- 2. Proteger o email manualmente
INSERT INTO api.campos_protegidos (id_cliente_mestre, campo_protegido, valor_protegido, motivo)
VALUES (123, 'email', 'email_manual@teste.com', 'Teste de proteção');

-- 3. Atualizar email no cliente
UPDATE api.clientes_mestre
SET email = 'email_manual@teste.com'
WHERE id = 123;

-- 4. Simular atualização da fonte (deveria manter email protegido)
-- Atualize o registro na tabela leads/prime_clientes correspondente
-- O trigger vai tentar atualizar, mas o email deve permanecer protegido

-- 5. Verificar que o email não mudou
SELECT id, nome_completo, email FROM api.clientes_mestre WHERE id = 123;

-- 6. Ver proteção registrada
SELECT * FROM api.vw_campos_protegidos_auditoria WHERE id_cliente_mestre = 123;
```

## 📝 Observações

- O botão de **"Confirmar Nome Padrão"** também protege o nome escolhido
- **"Marcar como NOME INCOMPLETO"** e **"Mover nome para Telefone"** são funções especiais e não protegem campos
- Ao clicar em **"Cancelar"**, nenhuma edição é salva e nenhum campo é protegido

## 🔧 Troubleshooting

### Campos ainda estão sendo sobrescritos
```sql
-- Verificar se a proteção está registrada
SELECT * FROM api.campos_protegidos WHERE id_cliente_mestre = 123;

-- Verificar se a trigger está ativa
SELECT * FROM information_schema.triggers
WHERE trigger_name LIKE '%consolidar%';
```

### Desproteger todos para recomeçar
```sql
-- CUIDADO: Remove TODAS as proteções
TRUNCATE api.campos_protegidos;
```

## 📚 Arquivos Relacionados

- `create-campos-protegidos-system.sql` - Cria tabela e funções base
- `update-triggers-respeitar-campos-protegidos.sql` - Atualiza triggers de consolidação
- `src/pages/clientes-consolidados.jsx` - Interface React com modal de edição
- `src/pages/ClientesConsolidados.css` - Estilos do modal

## 🎉 Pronto!

Agora você pode editar campos manualmente sem medo de serem sobrescritos pela consolidação automática!
