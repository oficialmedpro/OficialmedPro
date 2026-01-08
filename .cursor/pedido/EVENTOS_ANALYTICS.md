# 📊 Eventos de Analytics - Página de Pré-Checkout

## 🎯 Visão Geral

Esta documentação lista todos os eventos que podem ser rastreados na página de pré-checkout usando Google Analytics, Facebook Pixel, ou outras ferramentas de analytics.

---

## 📋 Eventos Principais

### 1. **Eventos de Carregamento e Visualização**

#### `page_view`
- **Quando:** Página carregada com sucesso
- **Dados:**
  ```javascript
  {
    event: 'page_view',
    page_title: 'Orçamento OficialMed',
    page_location: window.location.href,
    link_id: 'abc123',
    orcamento_codigo: '260100271',
    cliente: 'Lucas Marketing'
  }
  ```

#### `page_load_error`
- **Quando:** Erro ao carregar o orçamento
- **Dados:**
  ```javascript
  {
    event: 'page_load_error',
    error_type: 'link_expirado' | 'link_invalido' | 'erro_carregamento',
    error_message: 'Mensagem do erro'
  }
  ```

#### `splash_view`
- **Quando:** Usuário acessa sem linkId (página inicial)
- **Dados:**
  ```javascript
  {
    event: 'splash_view',
    page_location: window.location.href
  }
  ```

---

### 2. **Eventos de Interação com Fórmulas**

#### `formula_select`
- **Quando:** Usuário seleciona uma fórmula
- **Dados:**
  ```javascript
  {
    event: 'formula_select',
    formula_numero: 1,
    formula_valor: 241.46,
    total_formulas_selecionadas: 2,
    subtotal: 241.46
  }
  ```

#### `formula_deselect`
- **Quando:** Usuário deseleciona uma fórmula
- **Dados:**
  ```javascript
  {
    event: 'formula_deselect',
    formula_numero: 1,
    formula_valor: 241.46,
    total_formulas_selecionadas: 1,
    subtotal: 150.00
  }
  ```

#### `formula_view`
- **Quando:** Fórmula é renderizada na tela (scroll into view)
- **Dados:**
  ```javascript
  {
    event: 'formula_view',
    formula_numero: 1,
    formula_valor: 241.46
  }
  ```

---

### 3. **Eventos de Cálculo de Valores**

#### `frete_calculated`
- **Quando:** Frete é calculado (ao selecionar/deselecionar produtos)
- **Dados:**
  ```javascript
  {
    event: 'frete_calculated',
    subtotal: 241.46,
    frete: 30.00,
    frete_gratis: false,
    total: 271.46
  }
  ```

#### `total_updated`
- **Quando:** Total é atualizado
- **Dados:**
  ```javascript
  {
    event: 'total_updated',
    subtotal: 241.46,
    frete: 30.00,
    total: 271.46,
    quantidade_produtos: 1
  }
  ```

#### `frete_gratis_achieved`
- **Quando:** Usuário atinge frete grátis (>= R$ 300)
- **Dados:**
  ```javascript
  {
    event: 'frete_gratis_achieved',
    subtotal: 350.00,
    total: 350.00,
    quantidade_produtos: 2
  }
  ```

---

### 4. **Eventos de Ações da Toolbar**

#### `font_increase`
- **Quando:** Usuário clica em A+ (aumentar fonte)
- **Dados:**
  ```javascript
  {
    event: 'font_increase',
    font_scale: 1.1
  }
  ```

#### `font_decrease`
- **Quando:** Usuário clica em A- (diminuir fonte)
- **Dados:**
  ```javascript
  {
    event: 'font_decrease',
    font_scale: 0.9
  }
  ```

#### `download_image`
- **Quando:** Usuário baixa imagem do orçamento
- **Dados:**
  ```javascript
  {
    event: 'download_image',
    orcamento_codigo: '260100271',
    cliente: 'Lucas Marketing'
  }
  ```

#### `download_pdf`
- **Quando:** Usuário baixa PDF do orçamento
- **Dados:**
  ```javascript
  {
    event: 'download_pdf',
    orcamento_codigo: '260100271',
    cliente: 'Lucas Marketing'
  }
  ```

#### `print_page`
- **Quando:** Usuário imprime a página
- **Dados:**
  ```javascript
  {
    event: 'print_page',
    orcamento_codigo: '260100271',
    cliente: 'Lucas Marketing'
  }
  ```

---

### 5. **Eventos de Finalização**

#### `finalizar_compra_click`
- **Quando:** Usuário clica no botão "Finalizar Compra"
- **Dados:**
  ```javascript
  {
    event: 'finalizar_compra_click',
    subtotal: 241.46,
    frete: 30.00,
    total: 271.46,
    quantidade_produtos: 1,
    formulas_selecionadas: [1]
  }
  ```

#### `finalizar_compra_success`
- **Quando:** Checkout é gerado com sucesso
- **Dados:**
  ```javascript
  {
    event: 'finalizar_compra_success',
    checkout_url: 'https://...',
    subtotal: 241.46,
    frete: 30.00,
    total: 271.46
  }
  ```

#### `finalizar_compra_error`
- **Quando:** Erro ao gerar checkout
- **Dados:**
  ```javascript
  {
    event: 'finalizar_compra_error',
    error_message: 'Erro ao processar',
    subtotal: 241.46,
    frete: 30.00,
    total: 271.46
  }
  ```

#### `checkout_redirect`
- **Quando:** Usuário é redirecionado para checkout
- **Dados:**
  ```javascript
  {
    event: 'checkout_redirect',
    checkout_url: 'https://...',
    total: 271.46
  }
  ```

---

### 6. **Eventos de Badges e Links Externos**

#### `badge_click`
- **Quando:** Usuário clica em um badge
- **Dados:**
  ```javascript
  {
    event: 'badge_click',
    badge_type: 'reclame_aqui' | 'gptw' | 'abf' | 'franqueado',
    badge_url: 'https://...'
  }
  ```

#### `franqueado_link_click`
- **Quando:** Usuário clica no link "Seja um Franqueado"
- **Dados:**
  ```javascript
  {
    event: 'franqueado_link_click',
    link_url: 'https://oficialmed.sprinthub.site/r/seja-um-franqueado'
  }
  ```

---

### 7. **Eventos de Engajamento**

#### `scroll_depth`
- **Quando:** Usuário rola a página
- **Dados:**
  ```javascript
  {
    event: 'scroll_depth',
    depth_percentage: 25, // 25%, 50%, 75%, 100%
    scroll_position: 500
  }
  ```

#### `time_on_page`
- **Quando:** Usuário permanece na página por X segundos
- **Dados:**
  ```javascript
  {
    event: 'time_on_page',
    seconds: 30,
    milestones: [10, 30, 60, 120] // marcos atingidos
  }
  ```

#### `formula_interaction`
- **Quando:** Usuário interage com uma fórmula (hover, click)
- **Dados:**
  ```javascript
  {
    event: 'formula_interaction',
    interaction_type: 'hover' | 'click',
    formula_numero: 1
  }
  ```

---

### 8. **Eventos de Abandono**

#### `cart_abandonment`
- **Quando:** Usuário sai da página sem finalizar
- **Dados:**
  ```javascript
  {
    event: 'cart_abandonment',
    subtotal: 241.46,
    frete: 30.00,
    total: 271.46,
    quantidade_produtos: 1,
    time_on_page: 120,
    formulas_selecionadas: [1]
  }
  ```

#### `page_exit`
- **Quando:** Usuário está saindo da página
- **Dados:**
  ```javascript
  {
    event: 'page_exit',
    time_on_page: 180,
    formulas_selecionadas: [1],
    total: 271.46
  }
  ```

---

### 9. **Eventos de Validação**

#### `formula_selection_validation`
- **Quando:** Usuário tenta finalizar sem selecionar produtos
- **Dados:**
  ```javascript
  {
    event: 'formula_selection_validation',
    error: 'nenhuma_formula_selecionada',
    formulas_disponiveis: 2
  }
  ```

#### `link_expired`
- **Quando:** Link do orçamento expirou
- **Dados:**
  ```javascript
  {
    event: 'link_expired',
    link_id: 'abc123',
    expires_at: '2026-01-08T10:00:00Z'
  }
  ```

---

## 🎯 Eventos Recomendados para Conversão

### Funnel de Conversão:

1. **`page_view`** → Usuário acessou
2. **`formula_select`** → Usuário selecionou produto
3. **`total_updated`** → Usuário viu o total
4. **`finalizar_compra_click`** → Usuário clicou em finalizar
5. **`checkout_redirect`** → Usuário foi para checkout

### Eventos de Micro-Conversão:

- **`frete_gratis_achieved`** → Usuário atingiu frete grátis
- **`download_pdf`** → Usuário baixou PDF (interesse)
- **`time_on_page`** (60s+) → Engajamento alto

---

## 📊 Métricas Importantes

### Taxa de Conversão:
```
Conversões = finalizar_compra_click / page_view
```

### Taxa de Abandono:
```
Abandono = cart_abandonment / page_view
```

### Taxa de Seleção de Produtos:
```
Seleção = formula_select / page_view
```

### Tempo Médio até Conversão:
```
Tempo = média(time_on_page) onde finalizar_compra_click = true
```

---

## 🔧 Implementação

### Google Analytics 4 (GA4)

```javascript
// Exemplo de implementação
function trackEvent(eventName, eventData) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, eventData);
  }
  
  // Facebook Pixel (opcional)
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, eventData);
  }
}
```

### Exemplo de Uso:

```javascript
// Ao selecionar fórmula
trackEvent('formula_select', {
  formula_numero: 1,
  formula_valor: 241.46,
  total_formulas_selecionadas: 1,
  subtotal: 241.46
});

// Ao finalizar compra
trackEvent('finalizar_compra_click', {
  subtotal: 241.46,
  frete: 30.00,
  total: 271.46,
  quantidade_produtos: 1
});
```

---

## 📈 Dashboards Recomendados

1. **Funnel de Conversão**
   - Visualizações → Seleções → Finalizações

2. **Análise de Produtos**
   - Fórmulas mais selecionadas
   - Fórmulas mais deselecionadas

3. **Análise de Frete**
   - Quantos usuários atingem frete grátis
   - Impacto do frete na conversão

4. **Análise de Engajamento**
   - Tempo médio na página
   - Taxa de download de PDF
   - Taxa de impressão

5. **Análise de Abandono**
   - Pontos de abandono
   - Motivos de abandono (valores, frete, etc.)

---

## 🎯 Prioridades de Implementação

### Alta Prioridade (Essenciais):
1. ✅ `page_view`
2. ✅ `formula_select` / `formula_deselect`
3. ✅ `finalizar_compra_click`
4. ✅ `checkout_redirect`
5. ✅ `cart_abandonment`

### Média Prioridade (Importantes):
6. ✅ `frete_calculated`
7. ✅ `total_updated`
8. ✅ `download_pdf`
9. ✅ `time_on_page`

### Baixa Prioridade (Nice to Have):
10. ✅ `font_increase` / `font_decrease`
11. ✅ `badge_click`
12. ✅ `scroll_depth`

---

**Última atualização:** 08/01/2026
