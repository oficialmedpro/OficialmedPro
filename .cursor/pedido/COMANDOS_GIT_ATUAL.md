# 📝 Comandos Git - Usar Repositório Existente

## 🚀 Passo a Passo (Repositório: oficialmedpro/OficialmedPro)

### 1. Navegar para o repositório principal

```powershell
cd C:\oficialmed_pro\minha-pwa
```

### 2. Verificar se já está conectado com o GitHub

```powershell
git remote -v
```

**Se mostrar o repositório correto:**
```
origin  https://github.com/oficialmedpro/OficialmedPro.git (fetch)
origin  https://github.com/oficialmedpro/OficialmedPro.git (push)
```

**Se não mostrar ou estiver errado:**
```powershell
git remote remove origin
git remote add origin https://github.com/oficialmedpro/OficialmedPro.git
```

### 3. Adicionar e enviar os arquivos da pasta pedido

```powershell
# Adicionar arquivos da pasta .cursor/pedido
git add .cursor/pedido/

# Fazer commit
git commit -m "feat: Adiciona página de pré-checkout standalone"

# Enviar para o GitHub
git push origin main
```

**Se a branch principal for `master` ao invés de `main`:**
```powershell
git push origin master
```

---

## ✅ Depois de Enviar

Os arquivos estarão em: `https://github.com/oficialmedpro/OficialmedPro/tree/main/.cursor/pedido`

No Easypanel, configure:
- **Repository:** `oficialmedpro/OficialmedPro`
- **Branch:** `main` (ou `master`)
- **Build Path:** `.cursor/pedido` ← **IMPORTANTE!**
- **Output Directory:** `.cursor/pedido` ou `/` (depende do Easypanel)

---

## 🔧 Configurar no Easypanel

Siga o guia `EASYPANEL_SETUP.md`, mas use:

**Repository:** `oficialmedpro/OficialmedPro`  
**Branch:** `main` (ou `master`)  
**Build Path:** `.cursor/pedido`
