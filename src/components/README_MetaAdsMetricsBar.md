# MetaAdsMetricsBar Component

## Descrição
Componente React que exibe a barra de métricas do Meta Ads Dashboard, incluindo logo, filtros de campanhas/grupos/anúncios e cards de métricas principais.

## Arquivos
- `MetaAdsMetricsBar.jsx` - Componente React
- `MetaAdsMetricsBar.css` - Estilos exclusivos do componente

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `isDarkMode` | boolean | `true` | Controla o tema escuro/claro |
| `formatCurrency` | function | - | Função para formatar valores monetários |
| `onFilterChange` | function | - | Callback para mudanças nos filtros |

## Dados Automáticos

O componente agora busca automaticamente dados reais do Meta Ads através do `metaAdsService`:

- **Saldo Atual**: Calculado baseado no gasto real das campanhas
- **Campanhas**: Contagem real de campanhas ativas, pausadas e concluídas
- **Grupos de Anúncios**: Estimativa baseada no número de campanhas
- **Anúncios**: Estimativa baseada no número de campanhas

## Filtros

### 1. **Filtro de Status** (Primeiro)
- **🟢 Ativos**: Mostra apenas campanhas, grupos e anúncios ativos (padrão)
- **🟡 Pausados**: Mostra apenas itens pausados
- **🔴 Concluídos**: Mostra apenas itens concluídos
- **🌐 Todos**: Mostra todos os itens independente do status

### 2. **Filtros Principais**
- **Campanhas**: Lista com nomes reais das campanhas
- **Grupos de Anúncios**: Lista com nomes dos grupos de anúncios
- **Anúncios**: Lista com nomes dos anúncios

**Por padrão, todos os filtros mostram apenas itens ATIVOS.**

## Exemplo de Uso

```jsx
import MetaAdsMetricsBar from '../components/MetaAdsMetricsBar';

// Uso básico
<MetaAdsMetricsBar />

// Uso com props personalizadas
<MetaAdsMetricsBar 
  isDarkMode={true}
  formatCurrency={formatCurrencyLocal}
  onFilterChange={(filterType, value) => {
    console.log(`Filtro ${filterType}: ${value}`);
    // Implementar lógica de filtro
  }}
/>
```

## Características

### Design
- Tema escuro por padrão com suporte a tema claro
- Background sólido com bordas arredondadas
- **Layout em uma linha**: Logo Meta + 4 filtros (Status, Campanhas, Grupos, Anúncios)
- Filtros interativos para campanhas, grupos e anúncios
- **Nota**: Os cards de métricas foram movidos para o componente `MetaAdsMetricsCards` separado

### Responsividade
- Layout flexível que se adapta a diferentes tamanhos de tela
- Em telas pequenas, os cards se reorganizam verticalmente
- Otimizado para mobile com espaçamentos ajustados

### CSS Exclusivo
- Todas as classes CSS são prefixadas com `.meta-ads-metrics-bar`
- Não interfere com outros componentes da aplicação
- Estilos isolados e reutilizáveis

## Integração

O componente foi extraído do `DashboardMetaAds.jsx` e pode ser usado em qualquer lugar da aplicação. Ele mantém a mesma aparência e funcionalidade, mas agora é mais modular e reutilizável.

## Dependências

- React
- Ícones SVG do Meta (meta-dark.svg, meta-light.svg)
- CSS customizado com animações e responsividade
- `metaAdsService` para integração com a API do Meta Ads

## Configuração

Para que o componente funcione corretamente, você precisa configurar as seguintes variáveis de ambiente:

```bash
# Meta Ads API Configuration
VITE_META_APP_ID=your_meta_app_id_here
VITE_META_BUSINESS_ID=your_meta_business_id_here
VITE_META_ACCESS_TOKEN=your_meta_access_token_here
```

### Como obter as credenciais:

1. **App ID**: Crie um app no [Facebook Developers](https://developers.facebook.com/)
2. **Business ID**: ID do seu Business Manager no Facebook
3. **Access Token**: Token com permissões `ads_read` e `business_management`

### Permissões necessárias:
- `ads_read` - Para ler dados de campanhas
- `business_management` - Para acessar o Business Manager
- `ads_management` - Para gerenciar campanhas (opcional)
