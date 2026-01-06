# 📝 Comandos Git para Publicar no GitHub

## 🚀 Passo a Passo Rápido

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `pedido-pre-checkout` (ou o que preferir)
3. **NÃO** marque "Add README"
4. Clique em **"Create repository"**

### 2. Executar no Terminal (na pasta `.cursor/pedido`)

```powershell
# Navegar para a pasta (se ainda não estiver)
cd C:\oficialmed_pro\minha-pwa\.cursor\pedido

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit: Página de pré-checkout"

# Conectar com GitHub (SUBSTITUA pelos seus dados)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Exemplo:
# git remote add origin https://github.com/oficialmed/pedido-pre-checkout.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

### 3. Se pedir login no GitHub

- Use seu usuário e senha do GitHub
- Ou crie um Personal Access Token:
  1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
  2. Generate new token
  3. Selecione escopo `repo`
  4. Use o token como senha

---

## ✅ Depois de Enviar

Siga o guia `EASYPANEL_SETUP.md` para configurar no Easypanel!
