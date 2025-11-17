# 🔧 Troubleshooting - Chatwoot no EasyPanel

## ❌ Erro: "Service is not reachable"

### ✅ Verificações Necessárias:

#### 1. **Verificar o Nome do Serviço no EasyPanel**

No campo "Compose Service" do domínio, use exatamente:
```
chatwoot-web
```

**NÃO use:**
- `chatwoot_chatwoot-chatwoot-web-1` (nome do container)
- `chatwoot-web-1` (nome do container)
- Qualquer outro nome

#### 2. **Verificar a Configuração do Domínio**

Na interface do EasyPanel, ao criar/editar o domínio:

**Aba "Detalhes":**
- ✅ **HTTPS**: Ativado
- **Host**: `chat.oficialmed.com.br`
- **Caminho**: `/`
- **Protocolo**: `HTTP`
- **Porta**: `3000` ⚠️ **MUITO IMPORTANTE!**
- **Caminho (destino)**: `/`
- **Compose Service**: `chatwoot-web` ⚠️ **Exatamente assim!**

**Aba "SSL":**
- **Resolvedor de Certificados**: `letsencrypt`

#### 3. **Verificar se o Serviço Está Rodando**

No EasyPanel, verifique:
1. Vá na seção de serviços/containers
2. Confirme que `chatwoot-web` está com status "Running" ou "Healthy"
3. Verifique os logs para garantir que não há erros

#### 4. **Verificar o DNS**

Certifique-se de que o DNS está apontando corretamente:
```bash
# No terminal, execute:
nslookup chat.oficialmed.com.br
# ou
dig chat.oficialmed.com.br
```

O resultado deve apontar para o IP do seu servidor EasyPanel.

#### 5. **Verificar Porta Interna do Container**

O Chatwoot está configurado para rodar na porta **3000** internamente. 
Confirme no docker-compose que o comando está correto:
```yaml
command: >
  sh -c "
  bundle exec rails db:chatwoot_prepare &&
  bundle exec rails s -p 3000 -b 0.0.0.0
  "
```

#### 6. **Reiniciar o Domínio no EasyPanel**

1. No EasyPanel, vá em "Domínios"
2. Edite o domínio `chat.oficialmed.com.br`
3. Salve novamente (mesmo sem mudar nada)
4. Isso força o EasyPanel a reconfigurar o roteamento

#### 7. **Verificar Logs do EasyPanel/Traefik**

Se possível, verifique os logs do Traefik ou do EasyPanel para ver se há erros de roteamento.

## 🔍 Checklist Rápido

- [ ] Serviço `chatwoot-web` está rodando?
- [ ] Campo "Compose Service" está como `chatwoot-web` (sem espaços, sem hífens extras)?
- [ ] Porta configurada é `3000`?
- [ ] Protocolo está como `HTTP`?
- [ ] HTTPS está ativado?
- [ ] DNS está apontando para o IP correto?
- [ ] Domínio foi salvo e aplicado no EasyPanel?

## 💡 Dica

Se nada funcionar, tente:
1. Deletar o domínio no EasyPanel
2. Aguardar 30 segundos
3. Criar novamente com as configurações corretas

