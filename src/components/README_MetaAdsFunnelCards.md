# MetaAdsFunnelCards Component

## Descrição
Componente React que exibe os cards de métricas de performance do Meta Ads com sparkline area charts, baseado na tela 28.

## Arquivos
- `MetaAdsFunnelCards.jsx` - Componente React
- `MetaAdsFunnelCards.css` - Estilos exclusivos do componente

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `items` | array | FUNNEL_CARDS_DATA | Array com dados dos cards de métricas |
| `children` | ReactNode | - | Conteúdo opcional entre o header e o grid de cards |

## Estrutura dos Items

```javascript
{
  id: "investimento",
  title: "Investimento",
  value: "R$ 3.561,12",
  delta: "+ 39,7%",
  deltaDirection: "up",
  colorKey: "investimento",
  data: GEN(20, 30, 12),
  conversionRate: "100%"
}
```

## Exemplo de Uso

```jsx
import MetaAdsFunnelCards from '../components/MetaAdsFunnelCards';
import MetaAdsMetricsCards from '../components/MetaAdsMetricsCards';

// Uso básico
<MetaAdsFunnelCards />

// Uso com children (para inserir conteúdo entre header e grid)
<MetaAdsFunnelCards>
  <MetaAdsMetricsCards 
    isDarkMode={true}
    formatCurrency={formatCurrencyLocal}
    metaData={{...}}
  />
</MetaAdsFunnelCards>
```

## Características

### Design
- **Header**: Título "Métricas de Performance Meta Ads" + período "Últimos 30 dias"
- **Cards**: 5 cards com métricas principais (Investimento, Leads, Cliques, Impressões, Alcance)
- **Sparklines**: Gráficos de área com cores personalizadas para cada métrica
- **Tema**: Escuro por padrão com suporte a tema claro

### Layout
- **Header**: Título e período em linha horizontal
- **Children**: Conteúdo opcional entre header e grid
- **Grid**: 5 cards distribuídos horizontalmente com setas entre eles
- **Responsivo**: Em mobile, cards se reorganizam conforme necessário

### Cards de Métricas
1. **Investimento**: Valor monetário + tendência + sparkline verde
2. **Leads**: Contagem + tendência + sparkline azul
3. **Cliques**: Contagem + tendência + sparkline vermelho
4. **Impressões**: Contagem + tendência + sparkline laranja
5. **Alcance**: Contagem + tendência + sparkline roxo

## Integração

O componente foi criado para ser usado no dashboard do Meta Ads. Quando usado com `children`, permite inserir conteúdo (como o `MetaAdsMetricsCards`) entre o header e o grid de cards.

## Dependências

- React
- CSS customizado com animações e responsividade
- SVG para sparklines e setas

## Responsividade

- **Desktop**: Cards em linha horizontal com setas
- **Tablet**: Mantém layout com espaçamentos ajustados
- **Mobile**: Cards se reorganizam conforme necessário
