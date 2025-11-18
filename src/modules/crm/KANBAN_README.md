# 📋 Kanban de Oportunidades - Guia de Uso

## 🎯 Funcionalidades

O Kanban de Oportunidades permite visualizar e gerenciar oportunidades organizadas por funil e etapa.

### Características:

1. **Seleção de Unidade**: Escolha a unidade para filtrar os funis disponíveis
2. **Seleção de Funil**: Após escolher a unidade, selecione o funil desejado
3. **Visualização Kanban**: Oportunidades organizadas em colunas por etapa
4. **Drag and Drop**: Arraste oportunidades entre etapas para atualizar seu status

## 🚀 Como Acessar

1. Faça login no sistema
2. Acesse: `/crm/kanban`
3. Ou navegue pelo menu do CRM (se configurado)

## 📊 Como Usar

### Passo 1: Selecionar Unidade
- No dropdown "Unidade", escolha a unidade desejada
- Os funis daquela unidade serão carregados automaticamente

### Passo 2: Selecionar Funil
- No dropdown "Funil", escolha o funil que deseja visualizar
- O Kanban será carregado com as etapas e oportunidades

### Passo 3: Visualizar Oportunidades
- Cada coluna representa uma etapa do funil
- Os cards mostram informações da oportunidade:
  - Título
  - Valor
  - Dados do lead (nome, email, WhatsApp)
  - Data de criação
  - Origem
  - Vendedor responsável

### Passo 4: Mover Oportunidades
- Arraste um card de uma coluna para outra
- A oportunidade será atualizada automaticamente no banco de dados
- O `crm_column` será atualizado para a nova etapa

## 🔧 Estrutura Técnica

### Tabelas Utilizadas:
- `unidades` - Lista de unidades
- `funis` - Funis por unidade
- `funil_etapas` - Etapas de cada funil
- `oportunidade_sprint` - Oportunidades com `crm_column` (etapa)

### Serviços:
- `crmKanbanService` - Gerencia todas as operações do Kanban

### Componentes:
- `CrmKanbanPage` - Página principal com filtros
- `CrmKanbanBoard` - Board do Kanban
- `CrmKanbanCard` - Card individual de oportunidade

## 📝 Notas Importantes

1. **Apenas Oportunidades Abertas**: O Kanban mostra apenas oportunidades com `status = 'open'`
2. **Filtro por Etapa**: As oportunidades são filtradas pelo campo `crm_column` que corresponde ao `id_etapa_sprint` da tabela `funil_etapas`
3. **Atualização Automática**: Ao mover uma oportunidade, o campo `last_column_change` é atualizado automaticamente

## 🐛 Solução de Problemas

### Não aparecem funis
- Verifique se a unidade selecionada tem funis cadastrados
- Verifique a tabela `funis` no banco de dados

### Não aparecem oportunidades
- Verifique se existem oportunidades com `status = 'open'` e `archived = 0`
- Verifique se o `crm_column` das oportunidades corresponde aos `id_etapa_sprint` do funil

### Erro ao mover oportunidade
- Verifique as permissões no Supabase (RLS)
- Verifique se o campo `crm_column` pode ser atualizado



