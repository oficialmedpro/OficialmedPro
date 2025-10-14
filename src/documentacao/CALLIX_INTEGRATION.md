# 🔗 Documentação da Integração Callix

## Visão Geral

A integração Callix foi desenvolvida para permitir a importação e enriquecimento de leads de segmentos específicos do SprintHub, seguida do envio desses leads para a plataforma Callix.

## Arquivos Criados

### 1. **`src/service/callixService.js`**
**Propósito:** Serviço principal que gerencia todas as operações relacionadas ao Callix.

**Funcionalidades:**
- `getSegmentos()`: Busca todos os segmentos disponíveis no Supabase
- `importAndEnrichSegment(segmentId, onProgress)`: Importa e enriquece leads de um segmento específico
- `sendLeadsToCallix(segmentId, onProgress)`: Envia leads para a API do Callix
- `checkCallixStatus(segmentId, onProgress)`: Verifica o status dos leads no Callix

**Características:**
- Integração completa com SprintHub API
- Operações de UPSERT no Supabase (inserir ou atualizar)
- Rate limiting para respeitar limites da API
- Logs detalhados de progresso
- Tratamento robusto de erros

### 2. **`src/components/CallixImportComponent.jsx`**
**Propósito:** Interface de usuário para gerenciar a integração Callix.

**Funcionalidades:**
- Seleção de segmentos via dropdown
- Visualização de informações do segmento selecionado
- Processo de importação com feedback visual
- Logs em tempo real das operações
- Estatísticas detalhadas do processo
- Botões para envio ao Callix e verificação de status

**Características:**
- Interface responsiva e moderna
- Estados visuais para diferentes fases do processo
- Sistema de logs em tempo real
- Estatísticas detalhadas com métricas de sucesso

### 3. **`src/components/CallixImportComponent.css`**
**Propósito:** Estilização completa do componente Callix.

**Características:**
- Design moderno com tema escuro
- Animações e transições suaves
- Layout responsivo para mobile e desktop
- Cores personalizadas seguindo o padrão do projeto
- Componentes visuais como spinners e progress bars

### 4. **`src/pages/callix.jsx` (Atualizada)**
**Propósito:** Página principal da integração Callix.

**Alterações:**
- Removido o `MapaDeCalorComponent`
- Adicionado o `CallixImportComponent`
- Mantida toda a estrutura de dashboard (Sidebar, TopMenuBar, FilterBar)
- Preservado o background e layout existente

## Fluxo de Funcionamento

### 1. **Seleção de Segmento**
- Usuário acessa a página `/callix`
- Sistema carrega automaticamente todos os segmentos do Supabase
- Usuário seleciona um segmento do dropdown
- Sistema exibe informações detalhadas do segmento

### 2. **Importação e Enriquecimento**
- Usuário clica em "Importar e Enriquecer Leads"
- Sistema busca leads do segmento no SprintHub
- Para cada lead:
  - Verifica se já existe no Supabase
  - Busca dados completos do SprintHub
  - Insere ou atualiza no Supabase
- Sistema exibe logs em tempo real
- Ao final, mostra estatísticas detalhadas

### 3. **Envio para Callix**
- Após importação bem-sucedida
- Usuário pode clicar em "Enviar para Callix"
- Sistema busca leads do segmento no Supabase
- Envia leads para a API do Callix (implementação pendente)
- Exibe resultado do envio

### 4. **Verificação de Status**
- Usuário pode verificar status dos leads no Callix
- Sistema consulta API do Callix (implementação pendente)
- Exibe status atualizado dos leads

## Configurações Necessárias

### Variáveis de Ambiente
```env
VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
VITE_SPRINTHUB_API_TOKEN=seu_token_aqui
VITE_SPRINTHUB_INSTANCE=oficialmed
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_key
```

### Tabelas Supabase
- `api.segmento`: Armazena segmentos sincronizados do SprintHub
- `api.tag`: Armazena tags sincronizadas do SprintHub
- `api.leads`: Armazena leads importados e enriquecidos

## Próximos Passos

### 1. **Implementação da API Callix**
- Integrar com a API real do Callix
- Implementar autenticação e envio de leads
- Adicionar verificação de status

### 2. **Cron Job Automático**
- Configurar sincronização automática de segmentos/tags
- Implementar importação automática de leads
- Adicionar notificações de status

### 3. **Melhorias de UX**
- Adicionar filtros avançados
- Implementar histórico de operações
- Adicionar relatórios detalhados

## Tecnologias Utilizadas

- **React**: Framework principal
- **Supabase**: Banco de dados e autenticação
- **SprintHub API**: Fonte de dados dos leads
- **CSS3**: Estilização moderna e responsiva
- **JavaScript ES6+**: Lógica de negócio

## Estrutura de Dados

### Lead no Supabase
```javascript
{
  id: number,
  firstname: string,
  lastname: string,
  email: string,
  whatsapp: string,
  phone: string,
  segmento: number,
  // ... outros campos do SprintHub
}
```

### Segmento no Supabase
```javascript
{
  id: number,
  name: string,
  alias: string,
  is_published: boolean,
  total_leads: number,
  category_title: string,
  // ... outros campos
}
```

## Logs e Monitoramento

O sistema implementa logs detalhados que incluem:
- Timestamp de cada operação
- Status de cada lead processado
- Estatísticas de sucesso/erro
- Tempo total de processamento
- Taxa de sucesso

## Considerações de Performance

- Rate limiting entre chamadas da API (500ms)
- Processamento sequencial para evitar sobrecarga
- Paginação automática para grandes volumes
- Timeout configurável para requisições
- Tratamento de erros com retry automático
