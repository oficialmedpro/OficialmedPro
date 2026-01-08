# 📊 Guia Completo: Criar Google Analytics para Pré-Checkout

## 🎯 Objetivo

Criar uma conta e propriedade do Google Analytics 4 (GA4) especificamente para rastrear a página de pré-checkout.

---

## 📋 Passo a Passo Completo

### **PASSO 1: Acessar Google Analytics** (1 minuto)

1. Acesse: **https://analytics.google.com**
2. Faça login com sua conta Google (use a conta da empresa OficialMed)
3. Se já tiver uma conta, você verá a tela inicial

---

### **PASSO 2: Criar Nova Conta** (3 minutos)

1. **No canto superior esquerdo**, clique no menu de contas (mostra "Oficial Med - Site" ou similar)
2. Clique em **"Criar conta"** ou **"Create account"** (se estiver em inglês)
3. Preencha o formulário:

   **Nome da conta:**
   ```
   OficialMed - Pré-Checkout
   ```

   **Nome da propriedade:**
   ```
   Pré-Checkout OficialMed
   ```

   **Fuso horário:**
   ```
   (GMT-03:00) Brasília
   ```

   **Moeda:**
   ```
   Real brasileiro (R$)
   ```

4. Clique em **"Próximo"** ou **"Next"**

---

### **PASSO 3: Configurar Propriedade** (2 minutos)

1. **Informações do negócio:**
   - **Setor:** Selecione "Varejo" ou "E-commerce"
   - **Tamanho da empresa:** Selecione o tamanho adequado
   - **Como você pretende usar o Google Analytics:** 
     - ✅ Marque "Medir engajamento e conversões do cliente"
     - ✅ Marque "Entender como os clientes usam meu site"

2. Clique em **"Criar"** ou **"Create"**

3. **Aceite os Termos de Serviço:**
   - Leia e aceite os termos
   - Clique em **"Aceito"** ou **"I Accept"**

---

### **PASSO 4: Criar Stream de Dados (Web)** (3 minutos)

1. Você será direcionado para criar um **Data Stream** (Fluxo de Dados)

2. Selecione **"Web"** (ícone de globo)

3. Preencha o formulário:

   **URL do site:**
   ```
   https://pedido.oficialmed.com.br
   ```

   **Nome do stream:**
   ```
   Pré-Checkout Web
   ```

4. Clique em **"Criar stream"** ou **"Create stream"**

---

### **PASSO 5: Obter Measurement ID** (1 minuto)

1. Após criar o stream, você verá uma página com as informações

2. **Copie o Measurement ID:**
   - Procure por **"Measurement ID"** ou **"ID de medição"**
   - Formato: `G-XXXXXXXXXX` (exemplo: `G-ABC123XYZ`)
   - **COPIE ESSE ID!** Você vai precisar dele

3. **Anote também:**
   - **Stream Name:** Pré-Checkout Web
   - **Website URL:** https://pedido.oficialmed.com.br

---

### **PASSO 6: Configurar no Código** (2 minutos)

Agora que você tem o Measurement ID, vamos configurar:

#### Opção A: Editar config.js

1. Abra o arquivo: `.cursor/pedido/config.js`
2. Encontre a linha:
   ```javascript
   GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',
   ```
3. Substitua `G-XXXXXXXXXX` pelo seu Measurement ID real
4. Salve o arquivo

#### Opção B: Editar index.html (se não usar config.js)

1. Abra o arquivo: `.cursor/pedido/index.html`
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

## ✅ Checklist Final

- [ ] Conta criada no Google Analytics
- [ ] Propriedade criada
- [ ] Stream Web criado
- [ ] Measurement ID copiado
- [ ] Measurement ID configurado no `config.js`
- [ ] Measurement ID configurado no `index.html` (se necessário)

---

## 🧪 Testar

1. **Abra a página de pré-checkout:**
   ```
   https://pedido.oficialmed.com.br/pre-checkout/[qualquer-link]
   ```

2. **Abra o Console do Navegador:**
   - Pressione `F12`
   - Vá na aba **Console**

3. **Verifique os logs:**
   - Você deve ver: `📊 Analytics Event: page_view {...}`
   - Se aparecer, está funcionando!

4. **Verifique no Google Analytics:**
   - Acesse: https://analytics.google.com
   - Vá em **Reports** → **Realtime**
   - Você deve ver 1 usuário ativo!

---

## 📊 O Que Você Verá no GA4

### Realtime (Tempo Real):
- Usuários ativos agora
- Eventos chegando em tempo real
- Páginas visualizadas

### Events (Eventos):
- Todos os eventos que implementamos
- `page_view`, `formula_select`, `finalizar_compra_click`, etc.

### Engagement (Engajamento):
- Tempo na página
- Scroll depth
- Taxa de engajamento

---

## 🎯 Próximos Passos Após Configurar

1. **Aguarde 24-48 horas** para dados históricos
2. **Configure relatórios personalizados:**
   - Funnel de conversão
   - Análise de produtos
   - Análise de abandono
3. **Configure alertas:**
   - Quando houver muitos erros
   - Quando a taxa de conversão cair

---

## 🔧 Troubleshooting

### "Não consigo ver eventos no GA4"

1. **Verifique o Measurement ID:**
   - Está correto no `config.js`?
   - Está correto no `index.html`?

2. **Verifique o Console:**
   - Abra F12 → Console
   - Veja se há erros
   - Veja se os logs aparecem

3. **Aguarde alguns minutos:**
   - Eventos podem levar 1-2 minutos para aparecer

4. **Verifique bloqueadores:**
   - Desative bloqueadores de anúncios
   - Verifique se o script do GA4 está carregando

---

## 📝 Resumo Rápido

1. ✅ Acesse https://analytics.google.com
2. ✅ Crie conta: "OficialMed - Pré-Checkout"
3. ✅ Crie propriedade: "Pré-Checkout OficialMed"
4. ✅ Crie stream Web: URL = https://pedido.oficialmed.com.br
5. ✅ Copie o Measurement ID (G-XXXXXXXXXX)
6. ✅ Cole no `config.js` e `index.html`
7. ✅ Teste!

---

**Pronto! Agora você tem um Google Analytics dedicado para rastrear o pré-checkout! 🎉**
