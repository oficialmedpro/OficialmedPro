# 📊 Plano de Implementação - Analytics no Pré-Checkout

## ⏱️ Previsão de Tempo

### Implementação Completa: **2-3 horas**

**Breakdown:**
- Setup inicial (Google Analytics): **15-20 min**
- Implementação dos eventos essenciais: **45-60 min**
- Implementação dos eventos secundários: **30-45 min**
- Testes e validação: **30-45 min**
- Ajustes finais: **15-20 min**

---

## 🎯 O Que EU Vou Fazer (Auto)

### 1. Criar arquivo de utilitário de analytics
- ✅ Função `trackEvent()` genérica
- ✅ Suporte para Google Analytics 4 (GA4)
- ✅ Suporte para Facebook Pixel (opcional)
- ✅ Fallback seguro (não quebra se analytics não estiver configurado)

### 2. Implementar eventos essenciais (Alta Prioridade)
- ✅ `page_view` - Ao carregar página
- ✅ `formula_select` / `formula_deselect` - Ao selecionar/deselecionar
- ✅ `finalizar_compra_click` - Ao clicar em finalizar
- ✅ `checkout_redirect` - Ao redirecionar
- ✅ `cart_abandonment` - Ao sair sem finalizar

### 3. Implementar eventos de cálculo
- ✅ `frete_calculated` - Ao calcular frete
- ✅ `total_updated` - Ao atualizar total
- ✅ `frete_gratis_achieved` - Ao atingir frete grátis

### 4. Implementar eventos de ações
- ✅ `download_pdf` - Ao baixar PDF
- ✅ `download_image` - Ao baixar imagem
- ✅ `print_page` - Ao imprimir

### 5. Implementar eventos de engajamento
- ✅ `time_on_page` - Tempo na página (marcos: 10s, 30s, 60s, 120s)
- ✅ `scroll_depth` - Profundidade de scroll (25%, 50%, 75%, 100%)

### 6. Implementar eventos de erro
- ✅ `page_load_error` - Erro ao carregar
- ✅ `link_expired` - Link expirado
- ✅ `finalizar_compra_error` - Erro ao finalizar

---

## 🔧 O Que VOCÊ Precisa Fazer

### 1. Obter ID do Google Analytics (5 min)
- Acesse: https://analytics.google.com
- Vá em **Admin** → **Data Streams**
- Selecione ou crie um stream
- Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

### 2. Adicionar script do GA4 no HTML (2 min)
- Adicionar o script do Google Analytics no `<head>` do `index.html`
- Ou me fornecer o ID e eu adiciono

### 3. Testar após implementação (10-15 min)
- Abrir a página
- Verificar no Google Analytics se os eventos estão chegando
- Testar alguns eventos manualmente

### 4. (Opcional) Configurar Facebook Pixel
- Se quiser rastrear também no Facebook
- Me fornecer o Pixel ID

---

## 📋 Checklist de Implementação

### Fase 1: Setup (15 min)
- [ ] Criar arquivo `analytics.js`
- [ ] Adicionar função `trackEvent()`
- [ ] Adicionar script do GA4 no HTML
- [ ] Testar conexão básica

### Fase 2: Eventos Essenciais (45 min)
- [ ] `page_view` - Carregamento
- [ ] `formula_select` / `formula_deselect`
- [ ] `finalizar_compra_click`
- [ ] `checkout_redirect`
- [ ] `cart_abandonment`

### Fase 3: Eventos Secundários (30 min)
- [ ] `frete_calculated`
- [ ] `total_updated`
- [ ] `frete_gratis_achieved`
- [ ] `download_pdf` / `download_image` / `print_page`

### Fase 4: Eventos de Engajamento (20 min)
- [ ] `time_on_page`
- [ ] `scroll_depth`

### Fase 5: Eventos de Erro (15 min)
- [ ] `page_load_error`
- [ ] `link_expired`
- [ ] `finalizar_compra_error`

### Fase 6: Testes (30 min)
- [ ] Testar todos os eventos
- [ ] Verificar no GA4
- [ ] Ajustar se necessário

---

## 🚀 Como Vamos Fazer

### Passo 1: Você me fornece
1. **Google Analytics ID** (ou me diz se quer que eu crie um exemplo)
2. **Confirmação** de quais eventos quer implementar (todos ou só os essenciais)

### Passo 2: Eu implemento
1. Crio o arquivo `analytics.js`
2. Adiciono o script do GA4 no HTML
3. Integro os eventos no `app.js`
4. Testo a estrutura

### Passo 3: Você testa
1. Abre a página
2. Verifica no GA4 se os eventos chegam
3. Me avisa se algo não funcionar

### Passo 4: Ajustes finais
1. Ajusto o que for necessário
2. Documento tudo

---

## 💡 Recomendação

**Começar com os eventos essenciais primeiro:**
- Implementar apenas os 5 eventos de alta prioridade
- Testar e validar
- Depois adicionar os demais

**Tempo estimado para essenciais:** 1 hora

---

## 📝 Próximos Passos

**Me diga:**
1. ✅ Você tem Google Analytics configurado? (Se sim, me passe o ID)
2. ✅ Quer implementar todos os eventos ou só os essenciais?
3. ✅ Quer também Facebook Pixel? (opcional)

**Depois eu:**
- ✅ Crio todos os arquivos necessários
- ✅ Implemento os eventos
- ✅ Testo a estrutura
- ✅ Documento tudo

---

**Pronto para começar? Me passe o Google Analytics ID e eu implemento tudo! 🚀**
