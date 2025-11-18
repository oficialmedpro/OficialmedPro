# Deploy Direto do Git no Portainer (Sem GitHub Actions)

## 🎯 Solução: Build Direto do Git

O Portainer pode fazer build direto do seu repositório Git, sem precisar do GitHub Actions nem Docker Hub!

## 📋 Passo a Passo

### 1. Acesse o Portainer
- Vá para seu Portainer
- Acesse **Containers** ou **Stacks**

### 2. Criar Container/Stack
- Clique em **"Add container"** ou **"Add stack"**
- Escolha **"Build from Git repository"**

### 3. Configurar Build
```
Repository URL: https://github.com/oficialmedpro/OficialmedPro.git
Reference: main
Dockerfile path: Dockerfile
```

### 4. Configurar Variáveis de Ambiente
Adicione estas variáveis no Portainer:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
VITE_SUPABASE_SCHEMA=api
```

### 5. Configurar Portas
```
Container Port: 80
Host Port: 3000 (ou qualquer porta livre)
```

### 6. Deploy
- Clique em **"Deploy"**
- O Portainer vai:
  1. Fazer clone do Git
  2. Fazer build da imagem
  3. Subir o container
  4. Tudo automaticamente!

## 🔧 Vantagens

✅ **Sem GitHub Actions** - Build direto no Portainer
✅ **Sem Docker Hub** - Não precisa publicar imagem
✅ **Mais rápido** - Build local no Portainer
✅ **Mais simples** - Menos configurações
✅ **Controle total** - Você vê o build em tempo real

## 📝 Dockerfile Otimizado para Portainer

O Dockerfile atual já está otimizado para isso! Ele:
- Tem valores padrão para as variáveis
- Funciona sem secrets do GitHub
- Build direto do Git

## 🚀 Próximos Passos

1. Acesse seu Portainer
2. Crie um novo container com "Build from Git"
3. Use a URL do seu repositório
4. Configure as variáveis de ambiente
5. Deploy!

Isso vai resolver o problema dos GitHub Actions e Docker Hub! 🎉
