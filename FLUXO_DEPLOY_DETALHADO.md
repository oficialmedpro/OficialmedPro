# 🔄 Fluxo Completo de Deploy - Visual

## 📊 Diagrama do Processo

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   💻 DESENVOLV  │    │   📤 GIT PUSH   │    │  🔄 GITHUB ACTIONS │
│                 │───▶│                 │───▶│                 │
│ • Código local  │    │ • git add .     │    │ • Build Docker  │
│ • Testes        │    │ • git commit    │    │ • Run tests     │
│ • Debug         │    │ • git push      │    │ • Create image  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   🌐 APLICAÇÃO  │    │  🖥️ VPS PORT    │    │  📦 DOCKER HUB  │
│                 │◀───│                 │◀───│                 │
│ • beta.oficial  │    │ • Pull image    │    │ • Push image    │
│ • bi.oficial    │    │ • Update stack  │    │ • Tag: beta     │
│ • Funcionando   │    │ • Restart cont  │    │ • Tag: latest   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Detalhamento por Etapa

### **1. 💻 DESENVOLVIMENTO LOCAL**
```
┌─────────────────────────────────────────────────────────────┐
│  CÓDIGO LOCAL                                               │
├─────────────────────────────────────────────────────────────┤
│  • Editar arquivos em src/                                 │
│  • Testar localmente (npm run dev)                         │
│  • Verificar funcionamento                                 │
│  • Commit das mudanças                                     │
└─────────────────────────────────────────────────────────────┘
```

### **2. 📤 GIT PUSH**
```
┌─────────────────────────────────────────────────────────────┐
│  GIT COMMANDS                                               │
├─────────────────────────────────────────────────────────────┤
│  $ git add .                                               │
│  $ git commit -m "feat: nova funcionalidade"              │
│  $ git push origin main                                    │
│                                                             │
│  ✅ Código enviado para GitHub                             │
└─────────────────────────────────────────────────────────────┘
```

### **3. 🔄 GITHUB ACTIONS**
```
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (AUTOMÁTICO)                               │
├─────────────────────────────────────────────────────────────┤
│  1. Detecta push para main                                 │
│  2. Executa workflow de build                              │
│  3. Instala dependências                                   │
│  4. Executa testes                                         │
│  5. Build da imagem Docker                                 │
│  6. Tag: beta e latest                                     │
│  7. Push para Docker Hub                                   │
│                                                             │
│  ✅ Imagens atualizadas no Docker Hub                      │
└─────────────────────────────────────────────────────────────┘
```

### **4. 📦 DOCKER HUB**
```
┌─────────────────────────────────────────────────────────────┐
│  DOCKER HUB (REPOSITÓRIO)                                  │
├─────────────────────────────────────────────────────────────┤
│  📦 oficialmedpro/oficialmed-pwa:beta                      │
│  📦 oficialmedpro/oficialmed-pwa:latest                    │
│                                                             │
│  • Imagens prontas para pull                               │
│  • Tags atualizadas                                        │
│  • Disponível para VPS                                     │
└─────────────────────────────────────────────────────────────┘
```

### **5. 🖥️ VPS PORTAINER**
```
┌─────────────────────────────────────────────────────────────┐
│  PORTAINER (VPS)                                           │
├─────────────────────────────────────────────────────────────┤
│  1. Acessar Portainer UI                                   │
│  2. Ir em Images → Pull nova imagem                       │
│  3. Ir em Stacks → Selecionar stack                       │
│  4. Update stack com nova imagem                           │
│  5. Container reinicia automaticamente                     │
│  6. docker-entrypoint.sh executa                          │
│  7. Secrets injetados no HTML                             │
│                                                             │
│  ✅ Aplicação atualizada e funcionando                     │
└─────────────────────────────────────────────────────────────┘
```

### **6. 🌐 APLICAÇÃO ONLINE**
```
┌─────────────────────────────────────────────────────────────┐
│  APLICAÇÃO FUNCIONANDO                                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 beta.oficialmed.com.br                                 │
│  🌐 bi.oficialmed.com.br                                   │
│                                                             │
│  • Variáveis injetadas em runtime                          │
│  • Sem erros de configuração                               │
│  • Funcionamento normal                                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Injeção de Variáveis (Runtime)

```
┌─────────────────────────────────────────────────────────────┐
│  DOCKER-ENTRYPOINT.SH                                      │
├─────────────────────────────────────────────────────────────┤
│  1. Container inicia                                       │
│  2. Lê secrets do Portainer:                               │
│     - /run/secrets/VITE_SUPABASE_URL                       │
│     - /run/secrets/VITE_SUPABASE_SERVICE_ROLE_KEY          │
│     - /run/secrets/VITE_SUPABASE_SCHEMA                    │
│  3. Injeta no HTML:                                        │
│     <script>window.ENV = { ... }</script>                  │
│  4. Inicia nginx                                           │
│                                                             │
│  ✅ Variáveis disponíveis no frontend                      │
└─────────────────────────────────────────────────────────────┘
```

## ⏱️ Tempos Estimados

| Etapa | Tempo | Status |
|-------|-------|--------|
| **Git Push** | ~10s | Manual |
| **GitHub Actions** | ~3-5min | Automático |
| **Docker Hub** | ~1min | Automático |
| **Portainer Pull** | ~1-2min | Manual |
| **Container Restart** | ~30s | Automático |
| **TOTAL** | **~5-8min** | **Semi-automático** |

## 🎯 Resumo

**1 comando = Deploy completo!**
```bash
git add . && git commit -m "feat: nova funcionalidade" && git push
```

**Resultado:**
- ✅ Código atualizado
- ✅ Imagens rebuildadas
- ✅ Deploy automático
- ✅ Aplicação funcionando
- ✅ Zero configuração manual

**Problema das variáveis: RESOLVIDO PARA SEMPRE!** 🎉

