# Análise dos Campos de Data/Hora do Funil 33 (Ativação Comercial)

## Situação Atual

- ✅ **35 campos de data/hora criados** na tabela `api.oportunidade_sprint`
- ✅ **Função `mapStageDateTimeFields` implementada** na API
- ✅ **Logs de debug adicionados** para capturar campos recebidos
- ⚠️ **Campos ainda estão NULL** no banco de dados
- ⚠️ **Endpoint `/debug/opportunity` criado** mas ainda não deployado

## Oportunidades com Campos Preenchidos

O usuário identificou que as seguintes oportunidades do Funil 33 têm campos de data/hora preenchidos no SprintHub:

1. `funnelID=33&opportunityID=177874`
2. `funnelID=33&opportunityID=177775`
3. `funnelID=33&opportunityID=177690`
4. `funnelID=33&opportunityID=177596`
5. `funnelID=33&opportunityID=177452`
6. `funnelID=33&opportunityID=177373`
7. `funnelID=33&opportunityID=177120`

## Próximos Passos

### 1. Deploy da API com Novos Endpoints

Após fazer deploy da API atualizada (`api-sync-opportunities.js`), os seguintes endpoints estarão disponíveis:

- `GET /debug/opportunity?funnelID=33&opportunityID=177596` - Busca oportunidade específica
- `GET /debug/funil33?stage=317&limit=5` - Busca amostras do funil 33

### 2. Análise dos Campos

Execute o script para analisar as oportunidades:

```bash
node scripts/analisar-oportunidades-especificas.cjs
```

Este script irá:
- Buscar cada oportunidade específica
- Listar TODOS os campos em `fields`
- Identificar campos de data/hora
- Mostrar valores dos campos preenchidos
- Verificar quais campos foram mapeados automaticamente
- Salvar análise completa em JSON

### 3. Ajuste do Mapeamento

Com base na análise, será necessário:

1. **Identificar os nomes exatos** dos campos no SprintHub
2. **Ajustar `mapStageDateTimeFields`** com os nomes corretos
3. **Adicionar variações** de nomes que possam existir
4. **Testar mapeamento** com as oportunidades reais

### 4. Logs de Debug

A função `mapStageDateTimeFields` agora inclui logs detalhados que mostrarão:

- Todos os campos de data/hora detectados
- Valores dos campos preenchidos
- Campos que foram mapeados com sucesso
- Total de campos mapeados

Esses logs aparecerão no console da API durante a sincronização.

## Campos Esperados

Para o Funil 33 (Ativação Comercial), os campos esperados são:

- `entrada_ativacao`
- `acolhimento_ativacao`
- `qualificado_ativacao`
- `orcamento_ativacao`
- `negociacao_ativacao`
- `follow_up_ativacao`
- `cadastro_ativacao`

## Mapeamento Atual

A função `mapStageDateTimeFields` procura por variações dos seguintes nomes:

- "Entrada Ativacao" / "Entrada Ativação" / "ENTRADA ATIVACAO" / etc.
- "Acolhimento Ativacao" / "Acolhimento Ativação" / etc.
- "Qualificado Ativacao" / "Qualificado Ativação" / etc.
- "Orcamento Ativacao" / "Orçamento Ativação" / etc.
- "Negociacao Ativacao" / "Negociação Ativação" / etc.
- "Follow Up Ativacao" / "Follow Up Ativação" / etc.
- "Cadastro Ativacao" / "Cadastro Ativação" / etc.

## Possíveis Problemas

1. **Nomes diferentes no SprintHub**: Os campos podem ter nomes completamente diferentes
2. **Formato de data diferente**: Os valores podem estar em formato que não está sendo parseado corretamente
3. **Campos em local diferente**: Os campos podem estar em `dataLead` ou em outro objeto, não em `fields`

## Solução

Após analisar as oportunidades reais, ajustar o mapeamento conforme necessário e testar a sincronização.


