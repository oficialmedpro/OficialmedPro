# 🔧 Como Configurar Analytics no Pré-Checkout

## ✅ Implementação Completa!

Todos os eventos de analytics foram implementados. Agora você só precisa configurar o Google Analytics.

---

## 📋 Passo a Passo

### 1. Obter Google Analytics ID (5 minutos)

1. Acesse: https://analytics.google.com
2. Faça login com sua conta Google
3. Se não tiver propriedade, crie uma:
   - Clique em **"Criar propriedade"**
   - Preencha os dados
   - Selecione **"Web"**
4. Vá em **Admin** (ícone de engrenagem) → **Data Streams**
5. Clique em **"Add stream"** → **"Web"**
6. Preencha:
   - **Website URL:** `https://pedido.oficialmed.com.br`
   - **Stream name:** "Pré-Checkout OficialMed"
7. Clique em **"Create stream"**
8. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

---

### 2. Configurar no Código

#### Opção A: Via config.js (Recomendado para desenvolvimento)

1. Abra o arquivo: `.cursor/pedido/config.js`
2. Encontre a linha:
   ```javascript
   GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',
   ```
3. Substitua `G-XXXXXXXXXX` pelo seu Measurement ID real
4. Salve o arquivo

#### Opção B: Via Variáveis de Ambiente (Recomendado para produção)

No seu servidor/hosting, configure a variável:
```
VITE_GA4_MEASUREMENT_ID=G-SEU-ID-AQUI
```

---

### 3. Atualizar HTML (se necessário)

Se você não usar variáveis de ambiente, edite o arquivo `index.html`:

1. Abra: `.cursor/pedido/index.html`
2. Encontre a linha:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```
3. Substitua `G-XXXXXXXXXX` pelo seu Measurement ID
4. Encontre também:
   ```javascript
   const GA4_ID = ... || 'G-XXXXXXXXXX';
   ```
5. Substitua também aqui

---

## ✅ Eventos Implementados

### Eventos Essenciais (Alta Prioridade):
- ✅ `page_view` - Visualização da página
- ✅ `formula_select` / `formula_deselect` - Seleção de produtos
- ✅ `finalizar_compra_click` - Clique em finalizar
- ✅ `checkout_redirect` - Redirecionamento para checkout
- ✅ `cart_abandonment` - Abandono de carrinho

### Eventos de Cálculo:
- ✅ `frete_calculated` - Cálculo do frete
- ✅ `total_updated` - Atualização do total
- ✅ `frete_gratis_achieved` - Frete grátis atingido

### Eventos de Ações:
- ✅ `download_pdf` - Download de PDF
- ✅ `download_image` - Download de imagem
- ✅ `print_page` - Impressão
- ✅ `font_increase` / `font_decrease` - Ajuste de fonte

### Eventos de Engajamento:
- ✅ `time_on_page` - Tempo na página (10s, 30s, 60s, 120s)
- ✅ `scroll_depth` - Profundidade de scroll (25%, 50%, 75%, 100%)

### Eventos de Erro:
- ✅ `page_load_error` - Erro ao carregar
- ✅ `link_expired` - Link expirado
- ✅ `finalizar_compra_error` - Erro ao finalizar

### Eventos de Badges:
- ✅ `badge_click` - Clique em badges
- ✅ `franqueado_link_click` - Clique no link "Seja um Franqueado"

---

## 🧪 Como Testar

### 1. Teste Básico

1. Abra a página de pré-checkout
2. Abra o **Console do Navegador** (F12)
3. Você verá logs: `📊 Analytics Event: page_view {...}`
4. Selecione/deselecione produtos → Verá `formula_select`
5. Clique em "Finalizar Compra" → Verá `finalizar_compra_click`

### 2. Verificar no Google Analytics

1. Acesse: https://analytics.google.com
2. Vá em **Reports** → **Realtime**
3. Abra a página de pré-checkout
4. Você deve ver eventos chegando em tempo real!

### 3. Testar Eventos Específicos

```javascript
// No console do navegador, você pode testar manualmente:
window.trackEvent('teste_evento', { teste: 'dados' });
```

---

## 📊 Onde Ver os Dados

### Google Analytics 4:

1. **Realtime** → Veja eventos em tempo real
2. **Events** → Veja todos os eventos
3. **Engagement** → Veja tempo na página, scroll, etc.

### Criar Funnel de Conversão:

1. Vá em **Explore** → **Funnel exploration**
2. Configure:
   - `page_view`
   - `formula_select`
   - `total_updated`
   - `finalizar_compra_click`
   - `checkout_redirect`

---

## 🔧 Troubleshooting

### Eventos não aparecem no GA4

1. **Verifique o Measurement ID:**
   - Está correto no `config.js`?
   - Está correto no `index.html`?

2. **Verifique o Console:**
   - Abra F12 → Console
   - Veja se há erros
   - Veja se os logs `📊 Analytics Event` aparecem

3. **Verifique o GA4:**
   - O stream está ativo?
   - O Measurement ID está correto?

4. **Aguarde alguns minutos:**
   - Eventos podem levar 1-2 minutos para aparecer no GA4

### Script do GA4 não carrega

- Verifique se há bloqueador de anúncios
- Verifique se o script está no `<head>` do HTML
- Verifique a conexão com a internet

---

## 📝 Próximos Passos

1. ✅ Configure o Measurement ID
2. ✅ Teste a página
3. ✅ Verifique no GA4 se os eventos chegam
4. ✅ Configure dashboards e relatórios no GA4
5. ✅ Monitore as métricas!

---

## 🎉 Pronto!

Todos os eventos estão implementados e prontos para uso. Basta configurar o Google Analytics ID e começar a rastrear!

**Dúvidas?** Consulte o arquivo `EVENTOS_ANALYTICS.md` para ver todos os eventos disponíveis.
