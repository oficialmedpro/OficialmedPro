# GoogleAdsCampaignMetrics Component

## Descrição

Componente especializado para exibir métricas individuais de campanhas do Google Ads de forma organizada e visualmente atrativa.

## Funcionalidades

### ✅ Melhorias Implementadas

1. **Exibição Clara das Métricas**: Todas as métricas do log agora são exibidas corretamente no frontend
2. **Design Moderno**: Interface responsiva com gradientes e animações
3. **Métricas Organizadas**: Separação entre métricas principais e expandidas
4. **Modo Debug**: Informações de debug visíveis apenas em desenvolvimento
5. **Formatação Brasileira**: Valores em Real (R$) e formatação numérica brasileira

### 📊 Métricas Exibidas

#### Principais (Sempre Visíveis)
- **Impressões**: Número de visualizações
- **Cliques**: Interações com o anúncio
- **Gasto Total**: Custo total da campanha em R$
- **CTR**: Taxa de cliques (%)

#### Expandidas (Ao clicar em "Expandir")
- **Conversões**: Número de conversões
- **Valor Conversões**: Valor total das conversões em R$
- **Taxa Conversão**: Percentual de conversão
- **CPA**: Custo por aquisição
- **CPC Médio**: Custo médio por clique
- **Orçamento**: Orçamento definido
- **Utilização Orçamento**: % do orçamento utilizado

## Uso

```tsx
import GoogleAdsCampaignMetrics from './GoogleAdsCampaignMetrics';

// Uso básico
<GoogleAdsCampaignMetrics 
  campaign={googleAdsCampaign}
  expanded={false}
/>

// Expandido por padrão
<GoogleAdsCampaignMetrics 
  campaign={googleAdsCampaign}
  expanded={true}
/>
```

## Exemplo dos Dados que Resolve

### ❌ Problema Anterior
```
Log mostrando:
43. [Geral] Pesquisa - 22/11:
   🎯 Status: ENABLED
   👀 Impressões: 14.696
   🖱️  Cliques: 1.851
   💰 Custo: R$ 2147.22
   🎯 CTR: 0.13%
   🔄 Conversões: 307.993199
   💵 Valor Conversões: R$ 165.99

Frontend mostrando: 0 ou undefined
```

### ✅ Solução Atual
```
Frontend agora exibe corretamente:
👀 Impressões: 14.696
🖱️ Cliques: 1.851
💰 Gasto Total: R$ 2.147,22
🎯 CTR: 0,13%
🔄 Conversões: 308
💵 Valor Conversões: R$ 165,99
```

## Características Técnicas

- **TypeScript**: Tipagem completa
- **Responsivo**: Funciona em dispositivos móveis
- **Acessibilidade**: Suporte a leitores de tela
- **Performance**: Renderização otimizada
- **Debug**: Logs detalhados no console (desenvolvimento)

## Integração

O componente está integrado na página de anúncios (`AnunciosPage.tsx`) e substitui automaticamente o `CampaignCard` quando a aba "Google Ads" está ativa.

## Estilização

O CSS (`GoogleAdsCampaignMetrics.css`) inclui:
- Design responsivo
- Tema escuro
- Animações suaves
- Cores específicas por tipo de métrica
- Suporte a modo de alto contraste
