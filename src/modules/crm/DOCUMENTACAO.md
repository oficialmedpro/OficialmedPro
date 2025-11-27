# 📋 DOCUMENTAÇÃO DO MÓDULO CRM

**Data de Criação:** 17/11/2025  
**Última Atualização:** 17/11/2025  
**Status:** Em Desenvolvimento

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Componentes Principais](#componentes-principais)
4. [Serviços](#serviços)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Funcionalidades Pendentes](#funcionalidades-pendentes)
7. [Padrões de Design](#padrões-de-design)
8. [Integração com Supabase](#integração-com-supabase)

---

## 🎯 VISÃO GERAL

O módulo CRM foi desenvolvido para gerenciar oportunidades e leads de vendas através de um sistema Kanban interativo. O sistema permite visualizar oportunidades organizadas por funis e etapas, com capacidade de arrastar e soltar cards entre etapas, visualizar detalhes completos de oportunidades e leads, e gerenciar todas as informações relacionadas.

### Principais Características:
- ✅ Kanban board com scroll horizontal e vertical
- ✅ Drag and drop de oportunidades entre etapas
- ✅ Modal de detalhes da oportunidade (slide-in da direita)
- ✅ Modal de detalhes do lead (slide-in da direita)
- ✅ Busca e filtros de oportunidades
- ✅ Seleção dinâmica de unidade e funil
- ✅ Exibição de foto do vendedor nos cards
- ✅ Scroll contínuo ao passar o mouse nos botões horizontais

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/modules/crm/
├── components/
│   ├── CrmKanbanBoard.jsx          # Board principal do Kanban
│   ├── CrmKanbanBoard.css
│   ├── CrmKanbanCard.jsx            # Card individual de oportunidade
│   ├── CrmKanbanCard.css
│   ├── CrmOpportunityModal.jsx     # Modal de detalhes da oportunidade
│   ├── CrmOpportunityModal.css
│   ├── CrmLeadModal.jsx            # Modal de detalhes do lead
│   ├── CrmLeadModal.css
│   ├── CrmHeader.jsx               # Header do CRM
│   ├── CrmHeader.css
│   ├── CrmSidebar.jsx              # Sidebar de navegação
│   ├── CrmSidebar.css
│   ├── CrmLayout.jsx               # Layout wrapper (header + sidebar)
│   └── CrmLayout.css
├── pages/
│   ├── CrmKanbanPage.jsx           # Página principal do Kanban
│   ├── CrmKanbanPage.css
│   ├── CrmDashboardPage.jsx
│   ├── CrmContactsPage.jsx
│   ├── CrmOpportunitiesPage.jsx
│   └── ... (outras páginas)
├── services/
│   ├── crmKanbanService.js         # Serviço para dados do Kanban
│   ├── crmLeadService.js            # Serviço para dados do Lead
│   ├── crmContactService.js
│   ├── crmOpportunityService.js
│   └── crmReportService.js
├── utils/
│   └── crmHelpers.js               # Funções auxiliares
├── routes/
│   └── crmRoutes.js                # Rotas do módulo CRM
└── DOCUMENTACAO.md                  # Este arquivo
```

---

## 🧩 COMPONENTES PRINCIPAIS

### 1. CrmKanbanPage
**Arquivo:** `src/modules/crm/pages/CrmKanbanPage.jsx`

**Responsabilidades:**
- Gerenciar estado de unidades e funis
- Controlar seleção de unidade e funil (dropdowns sempre visíveis)
- Gerenciar filtros e busca
- Renderizar o CrmKanbanBoard

**Estados Principais:**
- `unidades`: Lista de unidades disponíveis
- `funis`: Lista de funis da unidade selecionada
- `selectedUnidade`: Unidade atualmente selecionada
- `selectedFunil`: Funil atualmente selecionado
- `searchTerm`: Termo de busca
- `selectedStatus`: Status filtrado (Aberta, Ganha, Perdida)

**Funcionalidades:**
- ✅ Dropdowns de unidade e funil sempre visíveis no top bar
- ✅ Reset automático do funil quando unidade muda
- ✅ Busca de unidades e funis do Supabase

---

### 2. CrmKanbanBoard
**Arquivo:** `src/modules/crm/components/CrmKanbanBoard.jsx`

**Responsabilidades:**
- Renderizar colunas do Kanban (etapas)
- Gerenciar scroll horizontal contínuo
- Controlar drag and drop de oportunidades
- Gerenciar modais de oportunidade e lead

**Estados Principais:**
- `etapas`: Lista de etapas do funil
- `oportunidades`: Objeto agrupado por etapa (etapaId -> array de oportunidades)
- `vendedores`: Mapa de userId -> informações do vendedor
- `selectedOportunidade`: Oportunidade selecionada para modal
- `selectedLeadId`: ID do lead selecionado para modal
- `canScrollLeft/canScrollRight`: Controle de botões de scroll

**Funcionalidades:**
- ✅ Scroll horizontal com botões (esquerda/direita)
- ✅ Scroll contínuo ao passar mouse sobre botões (requestAnimationFrame)
- ✅ Drag and drop de oportunidades entre etapas
- ✅ Oportunidades aparecem no início da etapa ao mover (unshift)
- ✅ Busca otimizada de vendedores (uma requisição para todos)

**Métodos Principais:**
- `loadKanbanData()`: Carrega etapas e oportunidades
- `handleMoveCard()`: Move oportunidade entre etapas
- `scrollHorizontal()`: Scroll por clique
- `startContinuousScroll()`: Scroll contínuo no hover
- `checkScrollButtons()`: Atualiza visibilidade dos botões

---

### 3. CrmKanbanCard
**Arquivo:** `src/modules/crm/components/CrmKanbanCard.jsx`

**Responsabilidades:**
- Renderizar card individual de oportunidade
- Exibir foto do vendedor ou inicial do lead
- Gerenciar clicks (oportunidade vs lead)

**Props:**
- `oportunidade`: Dados da oportunidade
- `etapaId`: ID da etapa atual
- `vendedorInfo`: Informações do vendedor (avatar_url, first_name, etc.)
- `onDragStart`: Callback para iniciar drag
- `onClick`: Callback para abrir modal da oportunidade
- `onLeadClick`: Callback para abrir modal do lead

**Funcionalidades:**
- ✅ Exibe foto do vendedor quando disponível
- ✅ Fallback para inicial do lead se não houver foto
- ✅ Click no título abre modal da oportunidade
- ✅ Click no nome do lead abre modal do lead
- ✅ Drag and drop funcional

**Estrutura do Card:**
- Avatar (vendedor ou inicial)
- Título da oportunidade (clicável → modal oportunidade)
- Nome do lead (clicável → modal lead)
- Meta informações (dias desde criação)
- Ícones de ação (telefone, email, chat, calendário, relógio)
- Valor da oportunidade

---

### 4. CrmOpportunityModal
**Arquivo:** `src/modules/crm/components/CrmOpportunityModal.jsx`

**Responsabilidades:**
- Exibir detalhes completos da oportunidade
- Mostrar abas das etapas do funil
- Exibir todas as seções de informações

**Estrutura:**
- **Header:**
  - Título da oportunidade
  - Botões: Ganhou, Perdeu, Settings, Fechar
  - Abas das etapas (com etapa atual destacada)
  
- **Painel Esquerdo (Geral):**
  - Sobre o negócio (Valor, Data de Criação, Data de fechamento esperada, Status, Responsável)
  - Contato
  - Social

- **Painel Direito (Abas de Conteúdo):**
  - Histórico (implementado)
  - Comentários (placeholder)
  - Tarefas (placeholder)
  - Atendimentos (placeholder)
  - E-mail (placeholder)
  - Ligações (placeholder)
  - Produtos e Serviços (placeholder)
  - Propostas (placeholder)

**Funcionalidades:**
- ✅ Abre da direita para esquerda (slide-in)
- ✅ Ocupa quase toda a tela (calc(100% - 50px))
- ✅ Etapa atual destacada nas abas
- ✅ Busca detalhes completos ao abrir
- ✅ Botão de fechar flutuante visível

**Estados:**
- `activeTab`: Aba de etapa ativa
- `activeContentTab`: Aba de conteúdo ativa
- `oportunidadeDetalhes`: Dados completos da oportunidade

---

### 5. CrmLeadModal
**Arquivo:** `src/modules/crm/components/CrmLeadModal.jsx`

**Responsabilidades:**
- Exibir detalhes completos do lead/contato
- Mostrar todas as informações e histórico

**Estrutura:**
- **Header:**
  - "Contato #[ID]"
  - Botões: Iniciar Atendimento, Lembre-me, Menu "..."
  - Botão de fechar

- **Painel Esquerdo:**
  - Perfil do Contato (foto, nome, pontos, estrelas)
  - Telefones com ícones
  - Endereço
  - Informações Completas (Pessoal, Principal - colapsáveis)
  - Informações da Empresa Principal
  - Dados do Sistema (Responsável, Tags, Segmentos, Permissões, Metadados)

- **Painel Direito (Abas):**
  - Visão Geral (cards de resumo, tarefas, anotações, histórico)
  - Atendimentos (sub-tabs, tabela)
  - Oportunidades (lista de oportunidades do lead)
  - Reuniões
  - Propostas
  - Faturas (sub-tabs)
  - Ligações
  - Menu "..." com opções adicionais

**Funcionalidades:**
- ✅ Busca dados completos do lead
- ✅ Busca oportunidades relacionadas
- ✅ Calcula totais (ganho, perdido, pendente)
- ✅ Busca informações do responsável
- ✅ Menu "..." com dropdown de opções adicionais

**Estados:**
- `lead`: Dados completos do lead
- `oportunidades`: Lista de oportunidades do lead
- `activeTab`: Aba de conteúdo ativa
- `showMoreTabs`: Controla menu "..."

---

## 🔧 SERVIÇOS

### 1. crmKanbanService.js
**Arquivo:** `src/modules/crm/services/crmKanbanService.js`

**Funções:**

#### `fetchUnidades()`
- Busca todas as unidades disponíveis
- Retorna: Array de unidades

#### `fetchFunisPorUnidade(unidadeId)`
- Busca funis de uma unidade específica
- Parâmetros: `unidadeId` (number)
- Retorna: Array de funis

#### `fetchEtapasFunil(funilId)`
- Busca etapas de um funil
- Parâmetros: `funilId` (number)
- Retorna: Array de etapas

#### `fetchOportunidadesPorFunil(funilId, etapaIds)`
- Busca oportunidades de um funil, agrupadas por etapa
- Parâmetros: 
  - `funilId` (number)
  - `etapaIds` (Array<number>) - IDs das etapas
- Retorna: Objeto `{ etapaId: [oportunidades] }`
- **Nota:** Usa `funil_id=eq.${funilId}` e `or=(${etapaFilter})` para filtro

#### `moverOportunidade(oportunidadeId, novaEtapaId)`
- Move oportunidade para nova etapa
- Parâmetros:
  - `oportunidadeId` (number)
  - `novaEtapaId` (number)
- Atualiza: `crm_column`, `last_column_change`, `update_date`
- **Nota:** Usa PATCH com REST API direto

#### `fetchVendedorInfo(userId)`
- Busca informações de um vendedor
- Parâmetros: `userId` (number)
- Retorna: Objeto com `id`, `first_name`, `last_name`, `avatar_url`

#### `fetchVendedoresInfo(userIds)`
- Busca informações de múltiplos vendedores (otimização)
- Parâmetros: `userIds` (Array<number>)
- Retorna: Objeto `{ userId: { info } }`

#### `fetchOportunidadeDetalhes(oportunidadeId)`
- Busca detalhes completos de uma oportunidade
- Parâmetros: `oportunidadeId` (number)
- Retorna: Objeto com todos os campos da oportunidade

---

### 2. crmLeadService.js
**Arquivo:** `src/modules/crm/services/crmLeadService.js`

**Funções:**

#### `fetchLeadDetalhes(leadId)`
- Busca detalhes completos de um lead
- Parâmetros: `leadId` (number)
- Retorna: Objeto com todos os campos do lead

#### `fetchOportunidadesPorLead(leadId)`
- Busca oportunidades relacionadas a um lead
- Parâmetros: `leadId` (number)
- Retorna: Array de oportunidades

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### Kanban Board
- [x] Visualização de oportunidades por etapa
- [x] Scroll horizontal com botões
- [x] Scroll contínuo ao passar mouse
- [x] Scroll vertical independente por coluna
- [x] Drag and drop entre etapas
- [x] Oportunidade aparece no início ao mover
- [x] Cálculo de valores totais por etapa
- [x] Contagem de oportunidades por etapa
- [x] Cores dinâmicas por etapa

### Seleção de Unidade e Funil
- [x] Dropdowns sempre visíveis no top bar
- [x] Seleção dinâmica de unidade
- [x] Filtro de funis por unidade
- [x] Reset automático ao mudar unidade

### Cards de Oportunidade
- [x] Exibição de foto do vendedor
- [x] Fallback para inicial do lead
- [x] Click no título abre modal da oportunidade
- [x] Click no nome do lead abre modal do lead
- [x] Ícones de ação (telefone, email, chat, calendário, relógio)
- [x] Exibição de valor formatado
- [x] Cálculo de dias desde criação

### Modal de Oportunidade
- [x] Animação slide-in da direita
- [x] Ocupa quase toda a tela
- [x] Abas das etapas do funil
- [x] Etapa atual destacada
- [x] Seção Geral (Sobre o negócio, Contato, Social)
- [x] Abas de conteúdo (Histórico implementado)
- [x] Botão de fechar flutuante
- [x] Botões Ganhou/Perdeu no header
- [x] Busca detalhes completos ao abrir

### Modal de Lead
- [x] Animação slide-in da direita
- [x] Perfil completo do contato
- [x] Informações Completas (colapsáveis)
- [x] Dados do Sistema (Responsável, Tags, Segmentos, Permissões)
- [x] Abas de conteúdo (Visão Geral, Atendimentos, Oportunidades, etc.)
- [x] Cards de resumo (Total Ganho, Perdido, Pendente)
- [x] Menu "..." com opções adicionais
- [x] Busca oportunidades relacionadas
- [x] Cálculo automático de totais

### Integração com Supabase
- [x] Busca de unidades
- [x] Busca de funis por unidade
- [x] Busca de etapas do funil
- [x] Busca de oportunidades
- [x] Atualização de etapa (mover oportunidade)
- [x] Busca de vendedores
- [x] Busca de leads
- [x] Uso correto de headers (Accept-Profile, Content-Profile)

---

## 🚧 FUNCIONALIDADES PENDENTES

### Modal de Oportunidade
- [ ] Implementar seção de Comentários
- [ ] Implementar seção de Tarefas
- [ ] Implementar seção de Atendimentos
- [ ] Implementar seção de E-mail
- [ ] Implementar seção de Ligações
- [ ] Implementar seção de Produtos e Serviços
- [ ] Implementar seção de Propostas
- [ ] Implementar histórico real de movimentação
- [ ] Implementar botão "Ganhou"
- [ ] Implementar botão "Perdeu"

### Modal de Lead
- [ ] Implementar seção de Atendimentos (tabela completa)
- [ ] Implementar seção de Reuniões
- [ ] Implementar seção de Propostas (tabela completa)
- [ ] Implementar seção de Faturas (tabela completa)
- [ ] Implementar seção de Ligações (tabela completa)
- [ ] Implementar histórico real de atividades
- [ ] Implementar Tarefas (CRUD)
- [ ] Implementar Anotações (CRUD)
- [ ] Buscar tags e segmentos reais do lead
- [ ] Buscar permissões reais do lead
- [ ] Implementar todas as opções do menu "..."

### Kanban Board
- [ ] Implementar filtro por status (Aberta, Ganha, Perdida)
- [ ] Implementar filtro por data de criação
- [ ] Implementar filtro por fechamento esperado
- [ ] Implementar busca por título
- [ ] Implementar ordenação
- [ ] Melhorar performance com virtualização para muitos cards

### Geral
- [ ] Implementar criação de nova oportunidade
- [ ] Implementar edição de oportunidade
- [ ] Implementar criação de novo lead
- [ ] Implementar edição de lead
- [ ] Implementar notificações de mudanças
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração

---

## 🎨 PADRÕES DE DESIGN

### Cores (CSS Variables)
O módulo CRM segue o padrão visual do projeto BI, usando as mesmas variáveis CSS:

```css
--bg-primary: #0f172a
--bg-secondary: #171e31
--bg-tertiary: #1e293b
--border-color: #334155
--text-primary: #ffffff
--text-secondary: #94a3b8
--text-muted: #64748b
--accent-purple: #8b5cf6
--accent-blue: #3b82f6
--accent-green: #10b981
--accent-red: #ef4444
--accent-orange: #f59e0b
```

### Cores das Etapas
As cores das etapas são baseadas na `ordem_etapa`:
- `0`: Vermelho (#ef4444) - ENTRADA
- `1`: Roxo (#8b5cf6) - ACOLHIMENTO
- `2`: Laranja (#f59e0b) - QUALIFICADO
- `3`: Roxo (#8b5cf6) - ORÇAMENTO
- `4`: Amarelo (#fbbf24) - NEGOCIAÇÃO
- `5`: Verde (#10b981) - FOLLOW UP
- `6`: Verde (#10b981) - CADASTRO

### Ícones
Todos os ícones usam `lucide-react`:
- `ChevronLeft`, `ChevronRight` - Scroll horizontal
- `Phone`, `Mail`, `MessageCircle` - Ações do card
- `Calendar`, `Clock` - Informações de tempo
- `X`, `CheckCircle`, `XCircle` - Ações gerais
- `Settings`, `Search`, `Edit` - Configurações
- `Plus`, `User`, `Building` - Adicionar/Informações

### Animações
- **Slide-in do modal:** `slideInRight` (0.3s ease)
- **Fade-in do overlay:** `fadeIn` (0.2s ease)
- **Scroll contínuo:** `requestAnimationFrame` (300px/s)

---

## 🔌 INTEGRAÇÃO COM SUPABASE

### Tabelas Utilizadas

#### `api.oportunidade_sprint`
**Campos principais:**
- `id` (BIGINT) - ID da oportunidade
- `title` (TEXT) - Título
- `value` (DECIMAL) - Valor
- `crm_column` (INTEGER) - ID da etapa (corresponde a `id_etapa_sprint`)
- `lead_id` (BIGINT) - ID do lead
- `user_id` (INTEGER) - ID do vendedor/responsável
- `funil_id` (INTEGER) - ID do funil
- `status` (TEXT) - 'open', 'won', 'lost'
- `create_date`, `update_date` (TIMESTAMPTZ)

**Queries principais:**
```javascript
// Buscar oportunidades por funil e etapas
GET /rest/v1/oportunidade_sprint?select=*&archived=eq.0&status=eq.open&funil_id=eq.${funilId}&or=(${etapaFilter})&order=create_date.desc

// Mover oportunidade
PATCH /rest/v1/oportunidade_sprint?id=eq.${oportunidadeId}
Body: { crm_column: novaEtapaId, last_column_change: ..., update_date: ... }
```

#### `api.leads`
**Campos principais:**
- `id` (BIGINT) - ID do lead
- `firstname`, `lastname` (TEXT)
- `email`, `phone`, `whatsapp` (TEXT)
- `address`, `city`, `state`, `zipcode` (TEXT)
- `photo_url` (TEXT)
- `points` (INTEGER)
- `owner` (INTEGER) - ID do responsável
- `timezone`, `preferred_locale` (TEXT)
- `create_date`, `updated_date` (TIMESTAMPTZ)

**Queries principais:**
```javascript
// Buscar detalhes do lead
GET /rest/v1/leads?id=eq.${leadId}&select=*

// Buscar oportunidades do lead
GET /rest/v1/oportunidade_sprint?select=*&lead_id=eq.${leadId}&order=create_date.desc
```

#### `api.users`
**Campos utilizados:**
- `id` (INTEGER)
- `first_name`, `last_name` (TEXT)
- `avatar_url` (TEXT)

**Queries principais:**
```javascript
// Buscar vendedor único
GET /rest/v1/users?id=eq.${userId}&select=id,first_name,last_name,avatar_url

// Buscar múltiplos vendedores (otimização)
GET /rest/v1/users?select=id,first_name,last_name,avatar_url&or=(${idFilter})
```

#### `api.funil_etapas`
**Campos principais:**
- `id_etapa_sprint` (INTEGER) - ID da etapa (usado em `crm_column`)
- `id_funil_sprint` (INTEGER) - ID do funil
- `nome_etapa` (TEXT)
- `ordem_etapa` (INTEGER)

**Queries principais:**
```javascript
// Buscar etapas do funil
GET /rest/v1/funil_etapas?select=*&id_funil_sprint=eq.${funilId}&order=ordem_etapa.asc
```

### Headers Padrão
Todas as requisições usam:
```javascript
{
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'apikey': supabaseAnonKey,
  'Accept-Profile': supabaseSchema,  // Geralmente 'api'
  'Content-Profile': supabaseSchema,
  'Prefer': 'return=representation'  // Para PATCH
}
```

### Padrão de Filtros
- **Múltiplos valores:** `or=(campo.eq.valor1,campo.eq.valor2)`
- **Igualdade:** `campo=eq.valor`
- **Ordenação:** `order=campo.desc` ou `order=campo.asc`

---

## 🐛 PROBLEMAS CONHECIDOS E SOLUÇÕES

### 1. Etapa não destacada corretamente no modal
**Problema:** Modal mostra etapa errada ao abrir  
**Solução:** Comparação numérica implementada (`Number(crm_column) === Number(id_etapa_sprint)`)  
**Status:** ✅ Resolvido

### 2. Botão de scroll esquerdo não funcionava
**Problema:** Container tinha `overflow-x: hidden`  
**Solução:** Alterado para `overflow-x: auto` com scrollbar oculta  
**Status:** ✅ Resolvido

### 3. Oportunidade aparecia no final ao mover
**Problema:** Usava `push()` ao invés de `unshift()`  
**Solução:** Alterado para `unshift()` para adicionar no início  
**Status:** ✅ Resolvido

### 4. Erro 406 ao mover oportunidade
**Problema:** Usava cliente Supabase sem headers corretos  
**Solução:** Migrado para fetch direto com REST API e headers completos  
**Status:** ✅ Resolvido

### 5. Chaves duplicadas no React
**Problema:** Cards com mesma key  
**Solução:** Key composta: `${etapaId}-${opp.id}-${index}`  
**Status:** ✅ Resolvido

---

## 📝 NOTAS TÉCNICAS

### Performance
- Busca de vendedores otimizada (uma requisição para todos)
- Scroll contínuo usa `requestAnimationFrame` para suavidade
- Lazy loading de modais (só carrega quando abre)

### Acessibilidade
- Botões com `title` para tooltips
- Cursor pointer em elementos clicáveis
- Contraste adequado seguindo padrão do projeto

### Responsividade
- Modal ocupa `calc(100% - 50px)` deixando espaço à esquerda
- Painel esquerdo fixo em 400px
- Painel direito flexível
- Scrollbars customizadas

---

## 🔄 PRÓXIMOS PASSOS

1. **Implementar seções pendentes dos modais**
2. **Adicionar funcionalidade de criar/editar oportunidades**
3. **Implementar histórico real de movimentações**
4. **Adicionar filtros avançados**
5. **Implementar busca e ordenação**
6. **Adicionar testes**
7. **Otimizar performance para muitos cards**

---

## 📞 CONTATO E SUPORTE

Para dúvidas ou problemas, consulte:
- Este arquivo de documentação
- Código fonte dos componentes
- Logs do console do navegador

---

**Última atualização:** 17/11/2025




