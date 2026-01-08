# ✅ Checklist: Criar Google Analytics para Pré-Checkout

## 📋 Siga Este Checklist Passo a Passo

### **ETAPA 1: Acessar e Criar Conta**

- [ ] **1.1** Acesse: https://analytics.google.com
- [ ] **1.2** Faça login com sua conta Google
- [ ] **1.3** Clique no menu de contas (canto superior esquerdo)
- [ ] **1.4** Clique em **"Criar conta"** ou **"Create account"**

---

### **ETAPA 2: Preencher Dados da Conta**

- [ ] **2.1** Nome da conta: `OficialMed - Pré-Checkout`
- [ ] **2.2** Nome da propriedade: `Pré-Checkout OficialMed`
- [ ] **2.3** Fuso horário: `(GMT-03:00) Brasília`
- [ ] **2.4** Moeda: `Real brasileiro (R$)`
- [ ] **2.5** Clique em **"Próximo"**

---

### **ETAPA 3: Configurar Negócio**

- [ ] **3.1** Setor: Selecione **"Varejo"** ou **"E-commerce"**
- [ ] **3.2** Tamanho da empresa: Selecione o adequado
- [ ] **3.3** Marque: ✅ "Medir engajamento e conversões do cliente"
- [ ] **3.4** Marque: ✅ "Entender como os clientes usam meu site"
- [ ] **3.5** Clique em **"Criar"**

---

### **ETAPA 4: Aceitar Termos**

- [ ] **4.1** Leia os Termos de Serviço
- [ ] **4.2** Marque a caixa de aceite
- [ ] **4.3** Clique em **"Aceito"** ou **"I Accept"**

---

### **ETAPA 5: Criar Stream Web**

- [ ] **5.1** Selecione **"Web"** (ícone de globo)
- [ ] **5.2** URL do site: `https://pedido.oficialmed.com.br`
- [ ] **5.3** Nome do stream: `Pré-Checkout Web`
- [ ] **5.4** Clique em **"Criar stream"**

---

### **ETAPA 6: Copiar Measurement ID**

- [ ] **6.1** Procure por **"Measurement ID"** ou **"ID de medição"**
- [ ] **6.2** Copie o ID (formato: `G-XXXXXXXXXX`)
- [ ] **6.3** Anote em um lugar seguro

**MEU MEASUREMENT ID:** `G-_________________` ← Cole aqui

---

### **ETAPA 7: Configurar no Código**

#### Opção A: Via config.js (Recomendado)

- [ ] **7.1** Abra: `.cursor/pedido/config.js`
- [ ] **7.2** Encontre: `GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',`
- [ ] **7.3** Substitua `G-XXXXXXXXXX` pelo seu ID
- [ ] **7.4** Salve o arquivo

#### Opção B: Via index.html

- [ ] **7.5** Abra: `.cursor/pedido/index.html`
- [ ] **7.6** Encontre: `<script async src="...id=G-XXXXXXXXXX"></script>`
- [ ] **7.7** Substitua `G-XXXXXXXXXX` pelo seu ID
- [ ] **7.8** Encontre: `const GA4_ID = ... || 'G-XXXXXXXXXX';`
- [ ] **7.9** Substitua também aqui
- [ ] **7.10** Salve o arquivo

---

### **ETAPA 8: Testar**

- [ ] **8.1** Abra a página: `https://pedido.oficialmed.com.br/pre-checkout/[link-teste]`
- [ ] **8.2** Pressione `F12` para abrir o Console
- [ ] **8.3** Veja se aparece: `📊 Analytics Event: page_view`
- [ ] **8.4** Acesse: https://analytics.google.com
- [ ] **8.5** Vá em **Reports** → **Realtime**
- [ ] **8.6** Veja se aparece 1 usuário ativo

---

## 🎉 Concluído!

Se todos os itens estão marcados, você está pronto para rastrear eventos!

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas em algum passo, me avise qual etapa está travado e eu te ajudo!
