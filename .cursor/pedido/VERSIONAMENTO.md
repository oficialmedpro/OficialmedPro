# 📦 Sistema de Versionamento Automático

## Como Funciona

O sistema incrementa automaticamente a versão a cada commit. A versão é exibida no rodapé da página.

## Formato da Versão

```
OficialMed Pedidos V 1.2.1
```

- **1** = Major (mudanças grandes, incompatíveis)
- **2** = Minor (novas funcionalidades, compatível)
- **1** = Patch (correções, compatível)

## Como Usar

### Opção 1: Script Automático (Recomendado)

Use o script PowerShell que incrementa a versão e faz commit automaticamente:

```powershell
cd C:\oficialmed_pro\minha-pwa\.cursor\pedido
.\commit-with-version.ps1 "sua mensagem de commit aqui"
```

Este script:
1. ✅ Incrementa a versão (patch)
2. ✅ Adiciona os arquivos
3. ✅ Faz o commit
4. ✅ Faz o push

### Opção 2: Manual

Se preferir fazer manualmente:

```powershell
# 1. Incrementar versão
.\increment-version.ps1 patch

# 2. Adicionar arquivos
git add .cursor/pedido/

# 3. Commit
git commit -m "sua mensagem"

# 4. Push
git push
```

### Tipos de Incremento

```powershell
# Incrementar patch (padrão) - 1.2.1 -> 1.2.2
.\increment-version.ps1 patch

# Incrementar minor - 1.2.1 -> 1.3.0
.\increment-version.ps1 minor

# Incrementar major - 1.2.1 -> 2.0.0
.\increment-version.ps1 major
```

## Arquivos do Sistema

- `version.js` - Arquivo com a versão atual
- `increment-version.ps1` - Script para incrementar versão
- `commit-with-version.ps1` - Script completo (incrementa + commit + push)

## Exibição

A versão aparece automaticamente no rodapé da página, abaixo dos badges.

## Regra de Uso

**SEMPRE use o script `commit-with-version.ps1` antes de fazer commits no projeto pedido!**

Isso garante que:
- ✅ A versão seja incrementada automaticamente
- ✅ O arquivo version.js seja commitado
- ✅ A versão apareça corretamente no site
