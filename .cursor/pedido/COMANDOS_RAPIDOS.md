# ⚡ Comandos Rápidos - Repositório Existente

## 🚀 Enviar Arquivos

```powershell
cd C:\oficialmed_pro\minha-pwa
git add .cursor/pedido/
git commit -m "feat: Adiciona página de pré-checkout standalone"
git push origin main
```

**Se usar branch `master`:**
```powershell
git push origin master
```

---

## ⚙️ Configuração no Easypanel

**Repository:** `oficialmedpro/OficialmedPro`  
**Branch:** `main` (ou `master`)  
**Build Path:** `.cursor/pedido` ← **MUITO IMPORTANTE!**

---

## 📝 Editar config.js

Depois de enviar, edite no GitHub:
1. Acesse: https://github.com/oficialmedpro/OficialmedPro/tree/main/.cursor/pedido
2. Clique em `config.js`
3. Clique em "Edit" (lápis)
4. Cole sua chave do Supabase
5. Commit
