# 📊 Documentação - Dados Topo com Termômetro (StatsSection)

> **Componente:** StatsSection  
> **Localização:** `src/components/StatsSection.jsx`  
> **Criado em:** 2025-01-23  
> **Última atualização:** 2025-01-23  

---

## 📁 Arquivos Relacionados

### **🎯 Arquivos Principais:**
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/StatsSection.jsx` | Componente | Componente React principal com os 5 cards de métricas |
| `src/components/PerformanceThermometer.jsx` | Componente | Componente visual de termômetro (usado dentro de cada card) |
| `src/service/thermometerService.js` | Serviço | Serviço dedicado com funções de busca das métricas |

### **🔧 Arquivos de Apoio:**
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/data/statsData.js` | Dados | Configuração dos cards (títulos, cores, formato) |
| `src/data/translations.js` | Traduções | Traduções dos títulos dos cards |
| `src/hooks/useCountUp.js` | Hook | Animação de contagem dos números |

---

## 🎨 Componente StatsSection

### **📍 Localização:** `src/components/StatsSection.jsx`

### **📋 Props do Componente:**
```javascript
const StatsSection = ({ 
  statsCards,      // Array de configuração dos cards (vem do statsData.js)
  startDate,       // Data inicial do filtro
  endDate,         // Data final do filtro
  selectedFunnel,  // Funil selecionado no FilterBar
  selectedUnit,    // Unidade selecionada no FilterBar
  selectedSeller   // Vendedor selecionado no FilterBar
}) => { ... }
```

### **🔄 Estados Internos:**
```javascript
const [realMetrics, setRealMetrics] = useState(null)  // Dados reais do Supabase
const [loading, setLoading] = useState(true)          // Estado de carregamento
```

### **⚙️ Funcionalidades:**

#### **1. 📊 Cards de Métricas (5 cards):**
1. **📈 Total de Oportunidades** - Oportunidades criadas no período
2. **📉 Oportunidades Perdidas** - Oportunidades perdidas no período
3. **💰 Ticket Médio** - Valor médio das oportunidades ganhas
4. **🔄 Orçamento em Negociação** - Oportunidades na etapa de orçamento
5. **✅ Oportunidades Ganhas** - Oportunidades ganhas no período

#### **2. 🌡️ Visual de Cada Card:**
- **Título** do card
- **Valor principal** (número animado com useCountUp)
- **Valor monetário** (quando aplicável)
- **Termômetro de performance** (PerformanceThermometer)
- **Meta** e **percentual de atingimento**

---

## 🛠 Serviço ThermometerService

### **📍 Localização:** `src/service/thermometerService.js`

### **🔧 Configuração:**
```javascript
// Variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'
```

### **📤 Importações:**
```javascript
import { getSupabaseWithSchema, getFunilEtapas } from './supabase.js'
```

---

## 📊 Funções e SQL Queries

### **1. 📈 Total de Oportunidades**

**📝 Descrição:** Busca oportunidades criadas no período selecionado

**🔍 SQL Equivalente:**
```sql
SELECT id, value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND create_date >= '{dataInicio}' 
  AND create_date <= '{dataFim} 23:59:59'
  AND funil_id = {selectedFunnel}     -- se funil selecionado
  AND unidade_id = [{selectedUnit}]   -- se unidade selecionada
  AND user_id = '{selectedSeller}'    -- se vendedor selecionado
```

**🌐 URL/Query:**
```javascript
`${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}`
```

**📊 Cálculos:**
- **Quantidade:** `totalOportunidades = data.length`
- **Valor Total:** `valorTotalOportunidades = soma dos values`

---

### **2. 📉 Oportunidades Perdidas**

**📝 Descrição:** Busca oportunidades perdidas (status=lost) com data de perda no período

**🔍 SQL Equivalente:**
```sql
SELECT id, value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND status = 'lost' 
  AND lost_date >= '{dataInicio}' 
  AND lost_date <= '{dataFim} 23:59:59'
  AND funil_id = {selectedFunnel}     -- se funil selecionado
  AND unidade_id = [{selectedUnit}]   -- se unidade selecionada
  AND user_id = '{selectedSeller}'    -- se vendedor selecionado
```

**🌐 URL/Query:**
```javascript
`${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${filtros}`
```

**📊 Cálculos:**
- **Quantidade:** `oportunidadesPerdidas = data.length`
- **Valor Perdido:** `valorPerdidas = soma dos values`

---

### **3. 💰 Ticket Médio**

**📝 Descrição:** Calcula valor médio das oportunidades ganhas no período

**🔍 SQL Equivalente:**
```sql
SELECT value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND status = 'gain' 
  AND gain_date >= '{dataInicio}' 
  AND gain_date <= '{dataFim} 23:59:59'
  AND value IS NOT NULL
  AND funil_id = {selectedFunnel}     -- se funil selecionado
  AND unidade_id = [{selectedUnit}]   -- se unidade selecionada
  AND user_id = '{selectedSeller}'    -- se vendedor selecionado
```

**🌐 URL/Query:**
```javascript
`${supabaseUrl}/rest/v1/oportunidade_sprint?select=value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59&value=not.is.null${filtros}`
```

**📊 Cálculos:**
- **Ticket Médio:** `ticketMedio = somaValores / quantidade`
- **Filtro:** apenas valores válidos (não nulos, não NaN)

---

### **4. 🔄 Orçamento em Negociação**

**📝 Descrição:** Busca oportunidades nas etapas de orçamento específicas de cada funil

**🔍 SQL Equivalente:**

#### **Para Funil Específico:**
```sql
-- COMERCIAL APUCARANA (funil_id = 6)
SELECT id, value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND crm_column = 207  -- ORÇAMENTO REALIZADO
  AND funil_id = 6

-- RECOMPRA (funil_id = 14)  
SELECT id, value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND crm_column = 206  -- ORÇAMENTOS
  AND funil_id = 14
```

#### **Para Todos os Funis:**
```sql
SELECT id, value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND (crm_column = 207 OR crm_column = 206)  -- Etapas de orçamento
```

**🌐 URL/Query:**
```javascript
// Funil específico (exemplo: COMERCIAL APUCARANA)
`${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&crm_column=eq.207&funil_id=eq.6`

// Todos os funis
`${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(crm_column.eq.207,crm_column.eq.206)`
```

**📊 Etapas por Funil:**
| Funil ID | Nome | Etapa Orçamento | CRM Column |
|----------|------|-----------------|------------|
| 6 | COMERCIAL APUCARANA | ORÇAMENTO REALIZADO | 207 |
| 14 | RECOMPRA | ORÇAMENTOS | 206 |

---

### **5. ✅ Oportunidades Ganhas**

**📝 Descrição:** Busca oportunidades ganhas (status=gain) com data de ganho no período

**🔍 SQL Equivalente:**
```sql
SELECT id, value 
FROM api.oportunidade_sprint 
WHERE archived = 0 
  AND status = 'gain' 
  AND gain_date >= '{dataInicio}' 
  AND gain_date <= '{dataFim} 23:59:59'
  AND funil_id = {selectedFunnel}     -- se funil selecionado
  AND unidade_id = [{selectedUnit}]   -- se unidade selecionada
  AND user_id = '{selectedSeller}'    -- se vendedor selecionado
```

**🌐 URL/Query:**
```javascript
`${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtros}`
```

**📊 Cálculos:**
- **Quantidade:** `oportunidadesGanhas = data.length`
- **Valor Total:** `valorGanhas = soma dos values`

---

## 📊 Função de Comparação com Período Anterior

### **📈 getThermometerMetricsAnteriores()**

**📝 Descrição:** Busca dados do período anterior para comparação e cálculo de variação

**🔧 Lógica de Cálculo do Período Anterior:**
```javascript
// Calcular período anterior (mesmo intervalo de dias)
const start = new Date(startDate)
const end = new Date(endDate)
const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

const startAnterior = new Date(start)
startAnterior.setDate(startAnterior.getDate() - diffDays - 1)

const endAnterior = new Date(start)
endAnterior.setDate(endAnterior.getDate() - 1)
```

**📊 Exemplo:**
- **Período Atual:** 20/01 a 23/01 (4 dias)
- **Período Anterior:** 16/01 a 19/01 (4 dias anteriores)

---

## 🔄 Fluxo de Funcionamento

### **📋 Inicialização:**
1. **StatsSection monta** → `useEffect` executado
2. **Parâmetros recebidos** → `{ startDate, endDate, selectedFunnel, selectedUnit, selectedSeller }`
3. **Chamada do serviço** → `getThermometerMetrics(params)`
4. **5 queries paralelas** → Total, Perdidas, Ticket Médio, Orçamento, Ganhas
5. **Busca período anterior** → Para comparação
6. **Cálculo de métricas** → Formatação para o componente
7. **Atualização do estado** → `setRealMetrics(metrics)`

### **🎯 Processamento dos Dados:**
```javascript
// Para cada card, os dados são formatados como:
const metrics = {
  [nomeMetrica]: {
    current: valorAtual,           // Valor principal exibido
    previous: valorAnterior,       // Para comparação
    value: valorMonetario,         // Valor em R$ (quando aplicável)
    meta: metaDinamica,           // Meta calculada dinamicamente
    change: percentualMudanca,     // Variação em %
    isPositive: boolean           // Se a variação é positiva
  }
}
```

### **🎨 Renderização:**
1. **Para cada statsCard** → Busca dados reais em `realMetrics`
2. **Animação de contagem** → `useCountUp` para números
3. **Formatação monetária** → Para valores em R$
4. **Termômetro** → `PerformanceThermometer` com current vs previous
5. **Meta e percentual** → Cálculo dinâmico baseado nos dados

---

## 🎨 Componente PerformanceThermometer

### **📍 Localização:** `src/components/PerformanceThermometer.jsx`

### **⚙️ Funcionalidade:**
- **Termômetro semicircular** com gradiente de cores
- **Ponteiro animado** baseado na performance (current vs previous)
- **Escala de 0 a 200%** (0° = vermelho, 180° = verde)
- **Cores dinâmicas:**
  - 🔴 **Vermelho:** < 80% (Ruim)
  - 🟠 **Laranja:** 80-99% (Regular)  
  - 🟡 **Amarelo:** 100-119% (Bom)
  - 🟢 **Verde:** ≥ 120% (Excelente)

### **📊 Props:**
```javascript
<PerformanceThermometer 
  currentValue={cardData.value}      // Valor atual
  previousValue={cardData.previousValue} // Valor anterior  
  change={cardData.change}           // Variação em %
  isPositive={cardData.isPositive}   // Se é positiva
  color={cardData.color}             // Cor do card
/>
```

---

## 🎨 Interface Visual

### **📱 Layout dos Cards:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [📈 Total]  [📉 Perdidas]  [💰 Ticket]  [🔄 Orçamento]  [✅ Ganhas]  │
│                                                                 │
│  Para cada card:                                               │
│  ┌─────────────────┐                                           │
│  │ Título do Card  │                                           │
│  │ 1,234 ⟵ Número │ ← useCountUp animado                      │
│  │ R$ 3.2M        │ ← Valor monetário                         │
│  │      🌡️         │ ← PerformanceThermometer                  │
│  │   [Termômetro]  │                                           │
│  │ META: 2300     │                                           │
│  │ 54% atingido   │                                           │
│  └─────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

### **🎨 Cores dos Cards:**
| Card | Cor | Classe CSS |
|------|-----|------------|
| Total de Oportunidades | Azul | `blue` |
| Oportunidades Perdidas | Vermelho | `red` |
| Ticket Médio | Roxo | `purple` |
| Orçamento em Negociação | Laranja | `orange` |
| Oportunidades Ganhas | Verde | `green` |

---

## 🗃️ Tabelas do Banco

### **📊 Tabela Principal:**
| Tabela | Schema | Descrição | Campos Utilizados |
|--------|--------|-----------|-------------------|
| `oportunidade_sprint` | api | Oportunidades do sistema | id, value, status, create_date, lost_date, gain_date, crm_column, funil_id, unidade_id, user_id, archived |

### **🔗 Campos Importantes:**
```sql
-- Campos de Status
status: 'open', 'lost', 'gain'

-- Campos de Data
create_date    -- Data de criação
lost_date      -- Data de perda
gain_date      -- Data de ganho

-- Campos de Filtro
funil_id       -- ID do funil
unidade_id     -- ID da unidade (formato: [APU])
user_id        -- ID do vendedor
crm_column     -- ID da etapa do CRM
archived       -- 0 = ativo, 1 = arquivado

-- Campos de Valor
value          -- Valor monetário da oportunidade
```

---

## 📊 Configuração dos Cards

### **📍 Localização:** `src/data/statsData.js`

```javascript
export const getStatsCards = (t) => [
  { 
    title: t.totalOpportunities,      // "Total de Oportunidades"
    color: 'blue', 
    isOpportunity: true,
    isCurrency: false
  },
  { 
    title: t.lostOpportunities,       // "Oportunidades Perdidas"
    color: 'red', 
    isOpportunity: true,
    isCurrency: false
  },
  { 
    title: t.averageTicket,           // "Ticket Médio"
    color: 'purple', 
    isCurrency: true,
    isOpportunity: false
  },
  { 
    title: t.budgetNegotiation,       // "Orçamento em Negociação"
    color: 'orange', 
    isOpportunity: true,
    isCurrency: false
  },
  { 
    title: t.wonOpportunities,        // "Oportunidades Ganhas"
    color: 'green', 
    isOpportunity: true,
    isCurrency: false
  }
]
```

---

## 🚀 Como Usar

### **📥 Importação:**
```javascript
import StatsSection from '../components/StatsSection.jsx'
```

### **🎯 Exemplo de Uso:**
```javascript
function Dashboard() {
  const [startDate, setStartDate] = useState('2025-01-20')
  const [endDate, setEndDate] = useState('2025-01-23')
  const [selectedFunnel, setSelectedFunnel] = useState('all')
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedSeller, setSelectedSeller] = useState('all')
  
  const statsCards = getStatsCards(translations['pt-BR'])

  return (
    <StatsSection
      statsCards={statsCards}
      startDate={startDate}
      endDate={endDate}
      selectedFunnel={selectedFunnel}
      selectedUnit={selectedUnit}
      selectedSeller={selectedSeller}
    />
  )
}
```

---

## 🔧 Manutenção e Expansão

### **➕ Para Adicionar Nova Métrica:**

1. **Adicionar card em `statsData.js`**
2. **Criar query SQL no `thermometerService.js`**
3. **Adicionar processamento no `getThermometerMetrics`**
4. **Adicionar tradução em `translations.js`**
5. **Testar com dados reais**

### **🔄 Para Modificar Lógica de Cálculo:**

1. **Localizar função no `thermometerService.js`**  
2. **Modificar query SQL**
3. **Atualizar processamento dos dados**
4. **Testar com diferentes filtros**

---

## ⚡ Performance

### **🚀 Otimizações:**
- **Queries paralelas** - todas as 5 métricas são buscadas simultaneamente
- **Filtros combinados** - aplicados diretamente no SQL
- **Cache automático** - re-executa apenas quando props mudam
- **Animações suaves** - useCountUp para transições

### **📊 Exemplo de Log de Performance:**
```
🌡️ ThermometerService: INICIANDO BUSCA DE MÉTRICAS
📅 Período: 2025-01-20 a 2025-01-23 
🔍 Filtros: funil=6, unidade=APU, vendedor=all
✅ 5 queries executadas em paralelo
📊 Resultado: 1,234 total, 89 perdidas, R$ 2,800 ticket médio
⚡ Tempo total: ~800ms
```

---

## ⚠️ Notas Importantes

### **🔒 Segurança:**
- **Service Role Key** do Supabase para acesso completo
- **Filtros sanitizados** para evitar SQL injection
- **Schema específico** (api) para organização

### **📊 Dados:**
- **Período anterior calculado automaticamente** para comparação
- **Metas dinâmicas** baseadas nos valores atuais
- **Fallbacks** para dados ausentes ou erro na conexão

### **🎯 Filtros:**
- **Cascata de filtros** aplicada do FilterBar
- **Compatibilidade** com todos os filtros (unidade, funil, vendedor, período)
- **Formato de unidade** ajustado para `[CODIGO]`

---

## 📚 Histórico de Mudanças

### **v1.0 - Versão Atual:**
- ✅ **5 métricas principais** implementadas
- ✅ **Termômetros visuais** para cada card
- ✅ **Comparação com período anterior** automática
- ✅ **Filtros integrados** com FilterBar
- ✅ **Animações** de contagem (useCountUp)
- ✅ **Serviço separado** (thermometerService.js)

---

> **💡 Dica:** Este documento deve ser atualizado sempre que houver mudanças nas métricas, queries SQL ou lógica de cálculo do StatsSection.