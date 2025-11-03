# 📦 Deploy PWA Vendas - vendas.oficialmed.com.br

## ✅ Stack Pronta

O arquivo `stack-vendas-pwa.yml` está pronto para deploy no Portainer.

## 🚀 Como Deployar

### 1. Acessar Portainer
https://portainer.oficialmed.com.br

### 2. Criar Nova Stack

1. Vá em **Stacks** → **Add Stack**
2. Nome: `vendas-pwa`
3. Cole o conteúdo de `stack-vendas-pwa.yml`
4. Clique em **Deploy the stack**

### 3. Secrets Necessários

Os secrets já existem no Portainer (mesmos do beta):
- ✅ `VITE_SUPABASE_URL_CORRETO`
- ✅ `VITE_SUPABASE_SERVICE_ROLE_KEY`
- ✅ `VITE_SUPABASE_SCHEMA`

### 4. Verificar Deploy

- URL: https://vendas.oficialmed.com.br
- Certificado SSL: automático via Let's Encrypt

## ⚠️ Estado Atual

### ✅ Pronto
- Stack YAML criada
- Secrets configurados
- Build principal funcionando
- Usuários criados no banco
- Views SQL criadas

### ⏳ Pendente
- Componentes React de vendas (revertidos por problema de build)
- Frontend da aplicação

## 📋 O Que Vai Acontecer

Ao fazer deploy agora:
- ✅ Container vai subir
- ✅ Aplicação vai estar acessível
- ⚠️ Rota `/vendas` não vai existir (componentes removidos)
- ✅ Outras funcionalidades (beta, bi, etc.) funcionam

## 🎯 Próximos Passos

1. **Deploy da stack** (agora mesmo)
2. **Verificar aplicação** acessível
3. **Implementar frontend de vendas** (refatorado)
4. **Testar funcionalidades**

## 🔐 Credenciais de Acesso

Quando o frontend estiver pronto, usar:
- **Gabrielli**: `gabrielli` / `Gabrielli123@` (Supervisor)
- **Atendente**: `atendente.oficialmed` / `Atendente123@` (Atendente)

## 📝 Notas

- Stack usa a mesma imagem `oficialmedpro/oficialmed-pwa:latest` que beta e bi
- Todos usam os mesmos secrets
- Domínio: `vendas.oficialmed.com.br`
- HTTPS automático via Traefik

---

**Status**: Stack pronta para deploy! ✅





