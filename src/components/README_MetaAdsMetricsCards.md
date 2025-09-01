# MetaAdsMetricsCards Component

## Descrição
Componente React que exibe os 4 cards de métricas do Meta Ads em um card separado com header, seguindo o mesmo estilo do `funnel-cards-header`.

## Arquivos
- `MetaAdsMetricsCards.jsx` - Componente React
- `MetaAdsMetricsCards.css` - Estilos exclusivos do componente

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `isDarkMode` | boolean | `true` | Controla o tema escuro/claro |
| `formatCurrency` | function | - | Função para formatar valores monetários |
| `metaData` | object | - | Objeto com os dados das métricas |

### Estrutura do metaData
```javascript
{
  balance: 42483.35,        // Saldo atual
  balanceChange: '-15.0%',  // Mudança percentual do saldo
  campaigns: 18,            // Total de campanhas
  activeCampaigns: 9,       // Campanhas ativas
  adSets: 18,               // Total de grupos de anúncios
  activeAdSets: 18,         // Grupos de anúncios ativos
  ads: 45,                  // Total de anúncios
  activeAds: 45             // Anúncios ativos
}
```

## Exemplo de Uso

```jsx
import MetaAdsMetricsCards from '../components/MetaAdsMetricsCards';

// Uso básico
<MetaAdsMetricsCards />

// Uso com props personalizadas
<MetaAdsMetricsCards 
  isDarkMode={true}
  formatCurrency={formatCurrencyLocal}
  metaData={{
    balance: 42483.35,
    balanceChange: '-15.0%',
    campaigns: 18,
    activeCampaigns: 9,
    adSets: 18,
    activeAdSets: 18,
    ads: 45,
    activeAds: 45
  }}
/>
```

## Características

### Design
- **Cards**: 4 cards individuais com métricas principais
- **Estilo**: Visual limpo sem header, foco nos cards de métricas
- **Tema**: Escuro por padrão com suporte a tema claro

### Layout
- **Content**: 4 cards distribuídos horizontalmente
- **Responsivo**: Em mobile, cards ficam em coluna vertical

### Cards de Métricas
1. **💰 Saldo Atual**: Valor monetário + indicador de mudança
2. **📊 Campanhas**: Total + contagem de ativas
3. **🎯 Conjuntos**: Total + contagem de ativos
4. **🖼️ Anúncios**: Total + contagem de ativos

## Integração

O componente foi criado para ser usado no dashboard do Meta Ads, posicionado **entre** o `funnel-cards-header` e o `funnel-cards-grid` dentro do `MetaAdsFunnelCards` para manter a hierarquia visual.

## Dependências

- React
- CSS customizado com animações e responsividade
- Estilo limpo e minimalista

## Responsividade

- **Desktop**: Cards em linha horizontal
- **Tablet**: Mantém layout com espaçamentos ajustados
- **Mobile**: Cards em coluna vertical
- **Muito pequeno**: Cards ocupam 100% da largura
