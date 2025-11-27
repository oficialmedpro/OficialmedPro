# 🎨 Guia: Instalar Código-Fonte e Personalizar Logo

## 📋 Objetivo

Este guia mostra como:
1. Instalar o código-fonte do Chatwoot no servidor
2. Configurar o Docker Compose para usar o código-fonte
3. Personalizar o logo e branding

---

## 🔧 Passo 1: Clonar Código-Fonte no Servidor

### 1.1. Acessar o Servidor via SSH

```bash
ssh root@srv1109021
```

### 1.2. Navegar para a Pasta do Projeto

```bash
cd /etc/easypanel/projects/chatwoot
```

### 1.3. Clonar o Repositório do Chatwoot

```bash
# Clonar o repositório
git clone https://github.com/chatwoot/chatwoot.git source

# Entrar na pasta
cd source

# Verificar versão atual (opcional - usar versão estável)
git tag | tail -10

# Se quiser usar uma versão específica (recomendado)
git checkout v2.0.0  # Substitua pela versão desejada
```

### 1.4. Verificar Estrutura

```bash
# Ver estrutura básica
ls -la

# Verificar se tem Dockerfile
ls -la Dockerfile
```

---

## 🐳 Passo 2: Modificar Docker Compose

### 2.1. Editar o Arquivo

No seu projeto local, editar: `chatwoot/docker-compose-easypanel-funcionando.yml`

### 2.2. Modificar Serviço chatwoot-web

**ANTES (usando imagem oficial):**
```yaml
chatwoot-web:
  image: chatwoot/chatwoot:latest
  restart: unless-stopped
  # ...
```

**DEPOIS (usando build local):**
```yaml
chatwoot-web:
  # Comentar a imagem oficial
  # image: chatwoot/chatwoot:latest
  
  # Adicionar build
  build:
    context: ./source
    dockerfile: Dockerfile
  
  restart: unless-stopped
  # ... resto da configuração ...
```

### 2.3. Modificar Serviço chatwoot-worker

**ANTES:**
```yaml
chatwoot-worker:
  image: chatwoot/chatwoot:latest
  # ...
```

**DEPOIS:**
```yaml
chatwoot-worker:
  # image: chatwoot/chatwoot:latest
  build:
    context: ./source
    dockerfile: Dockerfile
  # ...
```

### 2.4. Modificar Serviço chatwoot-cron

**ANTES:**
```yaml
chatwoot-cron:
  image: chatwoot/chatwoot:latest
  # ...
```

**DEPOIS:**
```yaml
chatwoot-cron:
  # image: chatwoot/chatwoot:latest
  build:
    context: ./source
    dockerfile: Dockerfile
  # ...
```

### 2.5. Ajustar Caminho do Context (se necessário)

O EasyPanel pode ter uma estrutura diferente. Verificar o caminho correto:

**Opção 1: Se o código está em `./source` (relativo ao docker-compose)**
```yaml
build:
  context: ./source
  dockerfile: Dockerfile
```

**Opção 2: Se o código está em outro lugar**
```yaml
build:
  context: /etc/easypanel/projects/chatwoot/code/source
  dockerfile: Dockerfile
```

**⚠️ IMPORTANTE:** O caminho deve ser relativo ao local onde o docker-compose está sendo executado pelo EasyPanel.

---

## 🎨 Passo 3: Personalizar Logo

### 3.1. Preparar Logos da OficialMed

Preparar os seguintes arquivos:
- Logo SVG para dashboard (recomendado: 200x50px)
- Logo SVG para widget (recomendado: 150x40px)
- Favicon ICO (32x32px ou 16x16px)

### 3.2. Localizar Arquivos de Logo no Código-Fonte

No servidor, os arquivos de logo ficam em:

```bash
# Logo do Dashboard (painel admin)
/etc/easypanel/projects/chatwoot/code/source/app/javascript/dashboard/assets/images/logo/

# Logo do Widget (chat para clientes)
/etc/easypanel/projects/chatwoot/code/source/app/javascript/widget/assets/images/logo/

# Favicon
/etc/easypanel/projects/chatwoot/code/source/public/favicon.ico
```

### 3.3. Substituir Logos

#### 3.3.1. Logo do Dashboard

```bash
# Fazer backup do logo original
cd /etc/easypanel/projects/chatwoot/code/source/app/javascript/dashboard/assets/images/logo/
cp chatwoot-logo.svg chatwoot-logo.svg.backup

# Substituir pelo logo da OficialMed
# (copiar seu logo para este local)
# Exemplo: scp logo-oficialmed.svg root@srv1109021:/etc/easypanel/projects/chatwoot/code/source/app/javascript/dashboard/assets/images/logo/chatwoot-logo.svg
```

#### 3.3.2. Logo do Widget

```bash
# Fazer backup
cd /etc/easypanel/projects/chatwoot/code/source/app/javascript/widget/assets/images/logo/
cp chatwoot-logo.svg chatwoot-logo.svg.backup

# Substituir pelo logo da OficialMed
# (copiar seu logo para este local)
```

#### 3.3.3. Favicon

```bash
# Fazer backup
cd /etc/easypanel/projects/chatwoot/code/source/public/
cp favicon.ico favicon.ico.backup

# Substituir pelo favicon da OficialMed
```

### 3.4. Verificar Nome dos Arquivos

Os arquivos devem ter exatamente estes nomes:
- Dashboard: `chatwoot-logo.svg`
- Widget: `chatwoot-logo.svg`
- Favicon: `favicon.ico`

Se seus arquivos tiverem nomes diferentes, renomeie:

```bash
# Exemplo
mv logo-oficialmed.svg chatwoot-logo.svg
```

---

## 🎨 Passo 4: Personalizar Cores e Branding

### 4.1. Localizar Arquivos de Tema

```bash
cd /etc/easypanel/projects/chatwoot/code/source/app/javascript/dashboard/theme/
```

### 4.2. Ajustar Cores Principais

Editar arquivo de tema (geralmente `colors.js` ou similar):

```javascript
// Exemplo de cores da OficialMed
export const colors = {
  primary: '#SUA_COR_PRIMARIA',  // Cor principal da OficialMed
  secondary: '#SUA_COR_SECUNDARIA',
  // ... outras cores
};
```

### 4.3. Adicionar CSS Customizado

Criar arquivo: `app/javascript/dashboard/assets/styles/custom.css`

```css
/* Estilos customizados da OficialMed */
:root {
  --primary-color: #SUA_COR_PRIMARIA;
  --secondary-color: #SUA_COR_SECUNDARIA;
}

/* Personalizações adicionais */
```

### 4.4. Importar CSS Customizado

No arquivo principal do dashboard, adicionar:

```javascript
import './assets/styles/custom.css';
```

---

## 🚀 Passo 5: Fazer Deploy

### 5.1. Atualizar Docker Compose no EasyPanel

1. Copiar o conteúdo do arquivo `docker-compose-easypanel-funcionando.yml` atualizado
2. Colar no EasyPanel (seção Docker Compose)
3. Salvar

### 5.2. Fazer Deploy

1. No EasyPanel, clicar em "Deploy" ou "Save & Deploy"
2. Aguardar o build (pode demorar 5-15 minutos na primeira vez)
3. Monitorar os logs

### 5.3. Verificar Build

No EasyPanel, verificar os logs do deploy. Deve aparecer:
```
Building chatwoot-web...
Step 1/20 : FROM ...
...
Successfully built ...
```

---

## ✅ Passo 6: Verificar Personalização

### 6.1. Verificar Logo no Dashboard

1. Acessar: `https://chat.oficialmed.com.br`
2. Fazer login
3. Verificar se o logo da OficialMed aparece no topo

### 6.2. Verificar Logo no Widget

1. Criar um inbox de teste
2. Obter código do widget
3. Testar em uma página HTML
4. Verificar se o logo aparece no widget

### 6.3. Verificar Favicon

1. Acessar o site
2. Verificar se o favicon da OficialMed aparece na aba do navegador

---

## 🔄 Passo 7: Manter Código Atualizado

### 7.1. Atualizar Código-Fonte

```bash
cd /etc/easypanel/projects/chatwoot/code/source
git pull origin main
```

### 7.2. Preservar Personalizações

**IMPORTANTE:** Antes de fazer `git pull`, fazer backup das personalizações:

```bash
# Fazer backup dos logos
cp app/javascript/dashboard/assets/images/logo/chatwoot-logo.svg ~/backup-logo-dashboard.svg
cp app/javascript/widget/assets/images/logo/chatwoot-logo.svg ~/backup-logo-widget.svg
cp public/favicon.ico ~/backup-favicon.ico

# Fazer pull
git pull origin main

# Restaurar logos (se foram sobrescritos)
cp ~/backup-logo-dashboard.svg app/javascript/dashboard/assets/images/logo/chatwoot-logo.svg
cp ~/backup-logo-widget.svg app/javascript/widget/assets/images/logo/chatwoot-logo.svg
cp ~/backup-favicon.ico public/favicon.ico
```

### 7.3. Usar Git para Rastrear Personalizações

Melhor prática: criar um branch para as personalizações:

```bash
# Criar branch para personalizações
git checkout -b oficialmed-customizations

# Fazer commit das alterações
git add app/javascript/dashboard/assets/images/logo/
git add app/javascript/widget/assets/images/logo/
git add public/favicon.ico
git commit -m "Personalização: Logos e branding OficialMed"

# Quando atualizar, fazer merge:
git checkout main
git pull origin main
git checkout oficialmed-customizations
git merge main
```

---

## 🐛 Troubleshooting

### Problema: Build Falha com Erro de Caminho

**Erro:** `unable to prepare context: path "/caminho/errado" not found`

**Solução:**
1. Verificar o caminho exato no servidor:
   ```bash
   ls -la /etc/easypanel/projects/chatwoot/code/source
   ```
2. Ajustar o `context` no docker-compose
3. Tentar caminho absoluto ou relativo

### Problema: Logo Não Aparece Após Deploy

**Solução:**
1. Verificar se o arquivo foi substituído corretamente
2. Verificar se o nome do arquivo está correto
3. Limpar cache do navegador (Ctrl+Shift+R)
4. Verificar logs do build para ver se o arquivo foi incluído

### Problema: Build Demora Muito

**Solução:**
- Normal na primeira vez (pode levar 15-20 minutos)
- Builds subsequentes são mais rápidos (cache do Docker)
- Verificar recursos do servidor (CPU/RAM)

---

## 📝 Checklist Final

- [ ] Código-fonte clonado no servidor
- [ ] Docker Compose modificado para usar build
- [ ] Logos da OficialMed preparados (SVG)
- [ ] Favicon preparado (ICO)
- [ ] Logos substituídos no código-fonte
- [ ] Favicon substituído
- [ ] Cores ajustadas (opcional)
- [ ] Docker Compose atualizado no EasyPanel
- [ ] Deploy realizado com sucesso
- [ ] Logo verificado no dashboard
- [ ] Logo verificado no widget
- [ ] Favicon verificado
- [ ] Backup das personalizações feito

---

## 📞 Próximos Passos Após Personalização

1. **Integração com CRM:** Ver `DOCUMENTACAO_COMPLETA.md`
2. **Configurar Canais:** WhatsApp, Facebook, etc.
3. **Configurar Webhooks:** Para sincronização com CRM
4. **Testar Funcionalidades:** Garantir que tudo funciona

---

**Última Atualização:** 17/11/2025  
**Status:** ✅ Pronto para implementação




