# 📋 Documentação - Filtros Menu Topo (FilterBar)

> **Componente:** FilterBar  
> **Localização:** `src/components/FilterBar.jsx`  
> **Criado em:** 2025-01-23  
> **Última atualização:** 2025-01-23  

---

## 📁 Arquivos Relacionados

### **🎯 Arquivos Principais:**
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/FilterBar.jsx` | Componente | Componente React principal com interface dos filtros |
| `src/components/FilterBar.css` | Estilos | Estilos CSS do componente |
| `src/service/FilterBarService.js` | Serviço | Serviço dedicado com funções de busca dos filtros |

### **🔧 Arquivos de Apoio:**
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/utils/utils.js` | Utilitário | Função `handleDatePreset` para períodos predefinidos |

---

## 🎨 Componente FilterBar

### **📍 Localização:** `src/components/FilterBar.jsx`

### **📋 Props do Componente:**
```javascript
const FilterBar = ({ 
  t,                        // Função de tradução (i18n)
  selectedSeller,           // Estado: vendedor selecionado
  setSelectedSeller,        // Setter: alterar vendedor
  selectedPeriod,           // Estado: período selecionado
  setSelectedPeriod,        // Setter: alterar período
  selectedFunnel,           // Estado: funil selecionado
  setSelectedFunnel,        // Setter: alterar funil
  selectedUnit,             // Estado: unidade selecionada
  setSelectedUnit,          // Setter: alterar unidade
  selectedOrigin,           // Estado: origem selecionada (NOVO)
  setSelectedOrigin,        // Setter: alterar origem (NOVO)
  startDate,                // Estado: data inicial
  setStartDate,             // Setter: alterar data inicial
  endDate,                  // Estado: data final
  setEndDate,               // Setter: alterar data final
  onUnitFilterChange,       // Callback: quando filtro de unidade muda
  onSellerFilterChange,     // Callback: quando filtro de vendedor muda
  onOriginFilterChange,     // Callback: quando filtro de origem muda (NOVO)
  marketData                // Dados de mercado (USD, EUR, IBOV)
}) => { ... }
```

### **🔄 Estados Internos:**
```javascript
// Controle de dropdowns (accordion)
const [openDropdown, setOpenDropdown] = useState(null)

// Estados de dados e carregamento
const [units, setUnits] = useState([])              // Lista de unidades
const [loadingUnits, setLoadingUnits] = useState(true)  // Loading unidades

const [funnels, setFunnels] = useState([])          // Lista de funis
const [loadingFunnels, setLoadingFunnels] = useState(true)  // Loading funis

const [sellers, setSellers] = useState([])          // Lista de vendedores
const [loadingSellers, setLoadingSellers] = useState(true)  // Loading vendedores

const [origins, setOrigins] = useState([])          // Lista de origens (NOVO)
const [loadingOrigins, setLoadingOrigins] = useState(true)  // Loading origens (NOVO)
```

### **⚙️ Funcionalidades:**

#### **1. Filtros Disponíveis:**
- **🏢 Unidades** - Filtra por unidade/franquia
- **🎯 Funis** - Filtra por funil de vendas (dependente da unidade)
- **👤 Vendedores** - Filtra por vendedor (dependente da unidade)
- **🎌 Origens** - Filtra por origem da oportunidade (NOVO)
- **📅 Períodos** - Filtra por período (predefinidos + personalizado)

#### **2. Indicadores de Mercado:**
- **💱 USD** - Cotação do dólar
- **💱 EUR** - Cotação do euro  
- **📊 IBOV** - Índice Bovespa
- **📅 Data/Hora** - Data e hora atual (atualizada em tempo real)

---

## 🛠 Serviço FilterBarService

### **📍 Localização:** `src/service/FilterBarService.js`

### **🔧 Configuração:**
```javascript
// Variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'
```

---

## 📊 Funções e SQL Queries

### **1. 🏢 getUnidades()**

**📝 Descrição:** Busca todas as unidades ativas do sistema

**🔍 SQL Equivalente:**
```sql
SELECT id, unidade, codigo_sprint, status 
FROM api.unidades 
WHERE status = 'ativo' 
ORDER BY unidade ASC;
```

**🌐 URL/Query:**
```
${supabaseUrl}/rest/v1/unidades?select=id,unidade,codigo_sprint,status&status=eq.ativo&order=unidade.asc
```

**📋 Campos Retornados:**
- `id` - ID da unidade
- `unidade` - Nome da unidade
- `codigo_sprint` - Código usado para filtrar oportunidades
- `status` - Status da unidade (ativo/inativo)

**🏷️ Formato de Retorno:**
```javascript
[
  { id: 'all', name: 'Todas as Unidades', codigo_sprint: 'all' },
  { id: 'APU', name: 'APUCARANA', codigo_sprint: 'APU' },
  { id: 'MAR', name: 'MARINGÁ', codigo_sprint: 'MAR' },
  // ... outras unidades
]
```

---

### **2. 🎯 getFunisPorUnidade(unidadeId)**

**📝 Descrição:** Busca funis filtrados por unidade específica

**🔍 SQL Equivalente:**
```sql
-- Para todas as unidades (unidadeId = null ou 'all')
SELECT id_funil_sprint, nome_funil, unidade 
FROM api.funis 
ORDER BY nome_funil ASC;

-- Para unidade específica
SELECT id_funil_sprint, nome_funil, unidade 
FROM api.funis 
WHERE unidade = '{unidadeId}' 
ORDER BY nome_funil ASC;
```

**🌐 URL/Query:**
```javascript
// Todas as unidades
`${supabaseUrl}/rest/v1/funis?select=id_funil_sprint,nome_funil,unidade&order=nome_funil.asc`

// Unidade específica
`${supabaseUrl}/rest/v1/funis?select=id_funil_sprint,nome_funil,unidade&unidade=eq.${unidadeId}&order=nome_funil.asc`
```

**🏷️ Formato de Retorno:**
```javascript
[
  { id: 'all', name: 'Todos os funis', id_funil_sprint: 'all' },
  { id: 6, name: '[1] COMERCIAL APUCARANA', id_funil_sprint: 6, unidade: 'APU' },
  { id: 14, name: '[2] RECOMPRA', id_funil_sprint: 14, unidade: 'APU' },
  // ... outros funis
]
```

---

### **3. 👤 getVendedores(unidadeId)**

**📝 Descrição:** Busca vendedores filtrados por unidade específica

**🔍 SQL Equivalente:**
```sql
-- Para todas as unidades (unidadeId = null ou 'all')
SELECT id_sprint, nome, id_unidade 
FROM api.vendedores 
WHERE status = 'ativo' 
ORDER BY nome ASC;

-- Para unidade específica
SELECT id_sprint, nome, id_unidade 
FROM api.vendedores 
WHERE status = 'ativo' AND id_unidade = '{unidadeId}' 
ORDER BY nome ASC;
```

**🌐 URL/Query:**
```javascript
// Todas as unidades
`${supabaseUrl}/rest/v1/vendedores?select=id_sprint,nome,id_unidade&status=eq.ativo&order=nome.asc`

// Unidade específica
`${supabaseUrl}/rest/v1/vendedores?select=id_sprint,nome,id_unidade&status=eq.ativo&id_unidade=eq.${unidadeId}&order=nome.asc`
```

**🏷️ Formato de Retorno:**
```javascript
[
  { id: 'all', name: 'Todos os vendedores', id_sprint: 'all' },
  { id: 'JOAO123', name: 'João Silva', id_sprint: 'JOAO123', id_unidade: 'APU' },
  { id: 'MARIA456', name: 'Maria Santos', id_sprint: 'MARIA456', id_unidade: 'APU' },
  // ... outros vendedores
]
```

---

### **4. 🎌 getOrigens() - NOVO**

**📝 Descrição:** Busca todas as origens de oportunidades ativas

**🔍 SQL Equivalente:**
```sql
SELECT id, nome, ativo 
FROM api.origem_oportunidade 
WHERE ativo = true 
ORDER BY nome ASC;
```

**🌐 URL/Query:**
```
${supabaseUrl}/rest/v1/origem_oportunidade?select=id,nome,ativo&ativo=eq.true&order=nome.asc
```

**📋 Campos Retornados:**
- `id` - ID da origem
- `nome` - Nome da origem
- `ativo` - Se a origem está ativa

**🏷️ Formato de Retorno:**
```javascript
[
  { id: 'all', name: 'Todas as origens', origem: 'all' },
  { id: 1, name: 'Google Ads', origem: 'Google Ads' },
  { id: 2, name: 'Meta Ads', origem: 'Meta Ads' },
  { id: 3, name: 'Orgânico', origem: 'Orgânico' },
  { id: 4, name: 'Indicação', origem: 'Indicação' },
  // ... outras origens (16 total)
]
```

**🗂️ Origens Disponíveis:**
1. Google Ads
2. Meta Ads
3. Orgânico
4. Indicação
5. Prescritor
6. Campanha
7. Monitoramento
8. Colaborador
9. Franquia
10. Farmácia Parceira
11. Monitoramento/disp
12. Site
13. Phusion/disparo
14. Contato Rosana
15. Contato Poliana
16. Yampi Parceiro

---

## 🔄 Fluxo de Funcionamento

### **📋 Inicialização:**
1. Component monta → `useEffect` executa
2. Busca **unidades** (`getUnidades`) 
3. Busca **funis** (`getFunisPorUnidade`) 
4. Busca **origens** (`getOrigens`) - NOVO
5. **Vendedores** só são carregados quando unidade específica é selecionada

### **🎯 Filtro em Cascata:**
1. **Usuário seleciona unidade** → 
2. `handleUnitChange` executado → 
3. Recarrega **funis** da unidade → 
4. Recarrega **vendedores** da unidade → 
5. Reseta **funil selecionado** para "Todos"

### **📞 Callbacks de Filtro:**
```javascript
// Quando filtros mudam, callbacks são chamados para aplicar filtros nos dados

onUnitFilterChange(filterValue)    // filterValue = codigo_sprint da unidade ou null
onSellerFilterChange(filterValue)  // filterValue = id_sprint do vendedor ou null  
onOriginFilterChange(filterValue)  // filterValue = nome da origem ou null (NOVO)
```

---

## 🎨 Interface Visual

### **📱 Layout:**
```
[ USD: R$ 5.20 ] [ EUR: R$ 5.45 ] [ IBOV: 125.432 ] | [ Data: 23/01/2025 ] [ Hora: 14:30 ]
                                                      |
                                [ Unidades ▼ ] [ Funis ▼ ] [ Vendedores ▼ ] [ Origens ▼ ] [ Período ▼ ]
```

### **🎛️ Dropdowns (Accordion):**
- **Sistema de accordion** - apenas um dropdown aberto por vez
- **Estado visual** - item selecionado destacado com classe `fb-selected`
- **Loading states** - "Carregando..." enquanto busca dados

---

## 🗃️ Tabelas do Banco

### **📊 Tabelas Utilizadas:**

| Tabela | Schema | Descrição | Campos Principais |
|--------|--------|-----------|-------------------|
| `unidades` | api | Unidades/franquias | id, unidade, codigo_sprint, status |
| `funis` | api | Funis de vendas | id_funil_sprint, nome_funil, unidade |
| `vendedores` | api | Vendedores/usuários | id_sprint, nome, id_unidade, status |
| `origem_oportunidade` | api | Origens das oportunidades (NOVA) | id, nome, ativo |
| `oportunidade_sprint` | api | Oportunidades (filtrada pelos filtros) | origem_oportunidade, unidade_id, user_id |

### **🔗 Relacionamentos:**
```
unidades.codigo_sprint ←→ oportunidade_sprint.unidade_id
vendedores.id_sprint ←→ oportunidade_sprint.user_id  
origem_oportunidade.nome ←→ oportunidade_sprint.origem_oportunidade
funis.unidade ←→ unidades.codigo_sprint
vendedores.id_unidade ←→ unidades.codigo_sprint
```

---

## 🚀 Como Usar

### **📥 Importação:**
```javascript
import FilterBar from '../components/FilterBar.jsx'
```

### **🎯 Exemplo de Uso:**
```javascript
function Dashboard() {
  // Estados dos filtros
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedFunnel, setSelectedFunnel] = useState('all')
  const [selectedSeller, setSelectedSeller] = useState('all')
  const [selectedOrigin, setSelectedOrigin] = useState('all')  // NOVO
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Callbacks para quando filtros mudam
  const handleUnitFilter = (unitCode) => {
    console.log('Filtrar por unidade:', unitCode)
    // Aplicar filtro nos dados...
  }
  
  const handleSellerFilter = (sellerId) => {
    console.log('Filtrar por vendedor:', sellerId)
    // Aplicar filtro nos dados...
  }
  
  const handleOriginFilter = (origin) => {  // NOVO
    console.log('Filtrar por origem:', origin)
    // Aplicar filtro nos dados...
  }

  return (
    <FilterBar
      selectedUnit={selectedUnit}
      setSelectedUnit={setSelectedUnit}
      selectedFunnel={selectedFunnel}
      setSelectedFunnel={setSelectedFunnel}
      selectedSeller={selectedSeller}
      setSelectedSeller={setSelectedSeller}
      selectedOrigin={selectedOrigin}          // NOVO
      setSelectedOrigin={setSelectedOrigin}    // NOVO
      selectedPeriod={selectedPeriod}
      setSelectedPeriod={setSelectedPeriod}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      onUnitFilterChange={handleUnitFilter}
      onSellerFilterChange={handleSellerFilter}
      onOriginFilterChange={handleOriginFilter}  // NOVO
      marketData={{ usd: 5.20, eur: 5.45, ibov: 125432 }}
    />
  )
}
```

---

## 🔧 Manutenção e Expansão

### **➕ Para Adicionar Novo Filtro:**

1. **Adicionar estado no componente pai**
2. **Criar função no FilterBarService.js** 
3. **Adicionar estado interno no FilterBar.jsx**
4. **Criar useEffect para carregar dados**
5. **Adicionar handler para mudanças**
6. **Criar HTML do dropdown**
7. **Adicionar prop e callback**

### **🗂️ Para Nova Tabela de Apoio:**

1. **Criar tabela no Supabase (schema `api`)**
2. **Configurar RLS e permissões**
3. **Criar função no FilterBarService.js**
4. **Adicionar à documentação**

---

## ⚠️ Notas Importantes

### **🔒 Segurança:**
- Todas as funções usam **Service Role Key** do Supabase
- **RLS habilitado** em todas as tabelas
- **Permissões configuradas** para roles: authenticated, anon, service_role

### **🎯 Performance:**
- **Filtros em cascata** - vendedores só carregam quando unidade é selecionada
- **Accordion behavior** - apenas um dropdown aberto por vez
- **Re-exports** mantidos no supabase.js para compatibilidade

### **🔄 Compatibilidade:**
- Componentes antigos que importam do `supabase.js` continuam funcionando
- Re-exports automáticos para `getUnidades`, `getFunisPorUnidade`, `getVendedores`, `getOrigens`

---

## 📚 Histórico de Mudanças

### **v1.1 - 2025-01-23:**
- ✅ **NOVO:** Adicionado filtro de **Origem das Oportunidades**
- ✅ **NOVO:** Criada tabela `api.origem_oportunidade`
- ✅ **REFACTOR:** Movidas funções para `FilterBarService.js`
- ✅ **CLEANUP:** Removidas funções duplicadas do `supabase.js`

### **v1.0 - Versão Inicial:**
- ✅ Filtros: Unidades, Funis, Vendedores, Períodos
- ✅ Indicadores de mercado
- ✅ Sistema de accordion
- ✅ Filtros em cascata

---

> **💡 Dica:** Este documento deve ser atualizado sempre que houver mudanças no componente FilterBar ou suas funções relacionadas.