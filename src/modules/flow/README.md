# Módulo FLOW

## Visão Geral

O módulo FLOW é um sistema de gerenciamento de esteiras (pipeline) que garante que todos os clientes estejam sempre em movimento dentro da farmácia. O cliente nunca fica parado - ele sempre está em uma esteira ativa.

## Estrutura do Módulo

```
src/modules/flow/
├── components/          # Componentes React reutilizáveis
│   ├── FlowHeader.jsx
│   ├── FlowEsteiraCard.jsx
│   └── ...
├── pages/              # Páginas principais
│   ├── FlowDashboardPage.jsx
│   ├── FlowEsteirasPage.jsx
│   ├── FlowClientePage.jsx
│   └── ...
├── services/           # Serviços de API e lógica de negócio
│   ├── flowService.js
│   ├── flowClienteService.js
│   └── ...
├── hooks/              # Hooks customizados React
│   ├── useFlowOpportunities.js
│   ├── useFlowCliente.js
│   └── ...
├── routes/              # Configuração de rotas
│   └── flowRoutes.js
├── utils/               # Funções utilitárias
│   ├── flowHelpers.js
│   ├── flowValidators.js
│   └── ...
└── index.js             # Exportações centralizadas
```

## Esteiras Principais

### 1. Esteira de Compra
- **Descrição**: Cliente que está comprando pela primeira vez e nunca comprou ou orçou
- **ID**: `compra`
- **Tipo**: Principal

### 2. Esteira de Laboratório
- **Descrição**: Sequência após venda - processamento de exames
- **ID**: `laboratorio`
- **Tipo**: Sequência
- **Fluxo**: Automático após venda

### 3. Esteira de Logística
- **Descrição**: Sequência após laboratório - preparação e envio
- **ID**: `logistica`
- **Tipo**: Sequência
- **Fluxo**: Automático após laboratório

### 4. Esteira de Monitoramento
- **Descrição**: Clientes que compraram no período de até 90 dias
- **ID**: `monitoramento_marketing` / `monitoramento_comercial`
- **Tipo**: Principal
- **Etapas**: D30, D60, D90
- **Lógica**: Após logística, cliente volta para monitoramento_marketing

### 5. Esteira de Reativação
- **Descrição**: Clientes que fazem mais de 90 dias que não compram
- **ID**: `reativacao_marketing` / `reativacao_comercial`
- **Tipo**: Principal
- **Etapas**: Primeira, R30, R60, R90, Infinita
- **Lógica**: Após 4 tentativas, move para infinita

### 6. Esteira de Ativação
- **Descrição**: Clientes que nunca compraram, vindo principalmente das perdas do funil de compra
- **ID**: `ativacao_marketing` / `ativacao_comercial`
- **Tipo**: Principal

## Esteiras Independentes

### 1. Aniversariantes
- **ID**: `aniversariantes`
- **Descrição**: Todos os clientes com data de aniversário, separados por mês

### 2. Recorrência
- **ID**: `recorrencia`
- **Descrição**: Clientes que fecharam compra de forma recorrente (trimestral, semestral, anual)

### 3. Site
- **ID**: `site`
- **Descrição**: Clientes que compram pelo site
- **Fluxo**: Também passam por laboratório e logística

### 4. Franquia
- **ID**: `franquia`
- **Descrição**: Todos os franqueados ou que desejam se tornar

## Regras de Negócio

### Fluxo de Venda
1. Cliente vende em qualquer esteira (Compra, Reativação, Monitoramento, Ativação)
2. Cliente é movido automaticamente para **Laboratório**
3. Após laboratório, cliente vai para **Logística**
4. Após logística, cliente volta para **Monitoramento Marketing** (D30)

### Esteiras de Marketing e Comercial
Cada esteira estratégica tem duas versões:
- **Marketing**: Envia tentativas de contato
- **Comercial**: Tenta vender

**Esteiras com dupla:**
- Monitoramento Marketing → Monitoramento Comercial
- Reativação Marketing → Reativação Comercial
- Ativação Marketing → Ativação Comercial

### Tentativas de Venda
- **Monitoramento**: 3 tentativas (D30, D60, D90) - uma por mês
- **Reativação**: Primeira, R30, R60, R90, depois Infinita - uma por mês
- Após esgotar tentativas sem venda, cliente vai para próxima esteira

### Princípio Fundamental
**O cliente sempre tem uma oportunidade aberta em algum funil.** Ele nunca pode ficar sem estar em uma esteira ativa.

## Uso

### Importar o módulo
```javascript
import { flowService, useFlowOpportunities } from './modules/flow';
```

### Buscar cliente em uma esteira
```javascript
import flowClienteService from './modules/flow/services/flowClienteService';

const cliente = await flowClienteService.findClienteInFlow('cpf_ou_email');
console.log(cliente.oportunidade.esteira); // Esteira atual
```

### Listar clientes de uma esteira
```javascript
import flowService from './modules/flow/services/flowService';

const oportunidades = await flowService.listOpportunitiesByEsteira('compra');
```

### Mover cliente para outra esteira
```javascript
await flowService.moveToEsteira(opportunityId, 'monitoramento_marketing', 'd30');
```

### Processar venda
```javascript
// Move automaticamente: Laboratório → Logística → Monitoramento
await flowService.processVenda(opportunityId);
```

## Rotas

- `/flow` - Dashboard com visão geral de todas as esteiras
- `/flow/esteiras/:esteiraId` - Visualização de uma esteira específica
- `/flow/cliente/:clienteId` - Detalhes do cliente e sua posição no Flow

## Banco de Dados

O módulo utiliza a tabela `flow_opportunities` no Supabase com a seguinte estrutura esperada:

```sql
CREATE TABLE flow_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  esteira VARCHAR NOT NULL,
  etapa VARCHAR,
  tentativas INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'ativa', -- 'ativa' ou 'fechada'
  origem_esteira VARCHAR,
  origem_etapa VARCHAR,
  ultima_tentativa TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  closed_at TIMESTAMP
);
```

## Convenções de Nomenclatura

Todos os arquivos, componentes, serviços e funções do módulo FLOW seguem o prefixo `Flow`:
- Componentes: `FlowHeader`, `FlowEsteiraCard`
- Páginas: `FlowDashboardPage`, `FlowEsteirasPage`
- Serviços: `flowService`, `flowClienteService`
- Hooks: `useFlowOpportunities`, `useFlowCliente`
- Utilitários: `flowHelpers`, `flowValidators`

Isso garante que não haja conflitos com outros módulos do sistema.




