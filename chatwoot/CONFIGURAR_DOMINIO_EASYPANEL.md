# 🌐 Como Configurar o Domínio no EasyPanel

## 📋 Passo a Passo

### 1. Deploy do Docker Compose
- Use o arquivo `docker-compose-easypanel-funcionando.yml` no EasyPanel
- Faça o deploy e aguarde os serviços iniciarem

### 2. Adicionar Domínio no EasyPanel

1. **Acesse o projeto Chatwoot no EasyPanel**
2. **Na seção "Domínios", clique em "Adicionar Domínio"**
3. **Configure o domínio:**

   **Aba "Detalhes":**
   - ✅ **HTTPS**: Ative (ligado)
   - **Host**: `chat.oficialmed.com.br`
   - **Caminho**: `/`
   
   **Destino:**
   - **Protocolo**: `HTTP`
   - **Porta**: `3000` ⚠️ **IMPORTANTE: Use a porta 3000, não 80!**
   - **Caminho**: `/`

4. **Aba "SSL":**
   - **Resolvedor de Certificados**: `letsencrypt`
   - **Domínio curinga**: Desligado (se não usar wildcard)

5. **Clique em "Salvar"**

### 3. Aguardar o SSL

- O EasyPanel vai gerar automaticamente o certificado Let's Encrypt
- Aguarde 2-5 minutos
- O certificado será renovado automaticamente

### 4. Verificar

- Acesse `https://chat.oficialmed.com.br`
- Você deve ver a tela de login/cadastro do Chatwoot

## ⚠️ Importante

- **Porta do serviço**: Use `3000` (não 80)
- **Nome do serviço**: O EasyPanel vai detectar automaticamente o serviço `chatwoot-web`
- **DNS**: Certifique-se de que `chat.oficialmed.com.br` está apontando para o IP do servidor

## 🔍 Verificar o Nome do Serviço

Se precisar verificar o nome exato do serviço:
1. No EasyPanel, vá em "Serviços" ou "Services"
2. Procure pelo serviço `chatwoot-web`
3. O nome completo será algo como `chatwoot_chatwoot-chatwoot-web-1`
4. Use esse nome no campo de destino se necessário


