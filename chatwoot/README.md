# 📚 Chatwoot - Documentação Completa

## 🎯 Visão Geral

Este diretório contém toda a documentação e configurações do Chatwoot instalado no EasyPanel para a OficialMed.

**Status:** ✅ **FUNCIONANDO**  
**URL:** https://chat.oficialmed.com.br  
**Data de Instalação:** 17/11/2025

---

## 📖 Documentação Disponível

### 📘 Documentação Principal

1. **[DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)**
   - Documentação completa do projeto
   - Status atual da instalação
   - Configurações realizadas
   - Comandos úteis
   - Troubleshooting
   - **👉 LEIA PRIMEIRO**

2. **[GUIA_CODIGO_FONTE_LOGO.md](./GUIA_CODIGO_FONTE_LOGO.md)**
   - Como instalar código-fonte
   - Como personalizar logo e branding
   - Passo a passo detalhado
   - **👉 PRÓXIMO PASSO RECOMENDADO**

### 🔧 Guias de Configuração

3. **[CONFIGURAR_DOMINIO_EASYPANEL.md](./CONFIGURAR_DOMINIO_EASYPANEL.md)**
   - Como configurar domínio no EasyPanel
   - Configuração de SSL
   - Roteamento

4. **[VARIAVEIS_AMBIENTE_EASYPANEL.txt](./VARIAVEIS_AMBIENTE_EASYPANEL.txt)**
   - Lista de variáveis de ambiente
   - Valores configurados
   - Pronto para copiar/colar no EasyPanel

### 🐛 Troubleshooting

5. **[TROUBLESHOOTING_EASYPANEL.md](./TROUBLESHOOTING_EASYPANEL.md)**
   - Problemas comuns e soluções
   - Erro 502 Bad Gateway
   - Problemas de rede

6. **[DIAGNOSTICO_SSH.md](./DIAGNOSTICO_SSH.md)**
   - Comandos de diagnóstico via SSH
   - Verificação de serviços
   - Logs e debugging

7. **[COMANDOS_DIAGNOSTICO.txt](./COMANDOS_DIAGNOSTICO.txt)**
   - Lista rápida de comandos úteis
   - Para copiar/colar no terminal

---

## 📁 Arquivos de Configuração

### Docker Compose

- **[docker-compose-easypanel-funcionando.yml](./docker-compose-easypanel-funcionando.yml)**
  - ⭐ **ARQUIVO PRINCIPAL** - Usado no EasyPanel
  - Configuração completa e funcional
  - Com rede `easypanel` configurada

- **[docker-compose-final.yml](./docker-compose-final.yml)**
  - Versão alternativa (com labels Traefik)
  - Não usado atualmente

- **[docker-compose-easypanel-simples.yml](./docker-compose-easypanel-simples.yml)**
  - Versão simplificada
  - Sem configurações de rede externa

---

## 🚀 Início Rápido

### Para Continuar o Trabalho

1. **Ler primeiro:** [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)
2. **Próximo passo:** [GUIA_CODIGO_FONTE_LOGO.md](./GUIA_CODIGO_FONTE_LOGO.md)

### Para Resolver Problemas

1. Verificar: [TROUBLESHOOTING_EASYPANEL.md](./TROUBLESHOOTING_EASYPANEL.md)
2. Diagnosticar: [DIAGNOSTICO_SSH.md](./DIAGNOSTICO_SSH.md)

---

## ✅ Status Atual

### O Que Está Funcionando

- ✅ Chatwoot instalado e rodando
- ✅ Domínio `chat.oficialmed.com.br` configurado
- ✅ SSL/HTTPS funcionando
- ✅ Todos os serviços operacionais (Web, Worker, Cron, PostgreSQL, Redis)
- ✅ Rede `easypanel` configurada corretamente
- ✅ Setup inicial completo

### Próximos Passos

- [ ] Instalar código-fonte do Chatwoot
- [ ] Personalizar logo e branding
- [ ] Configurar integração com CRM
- [ ] Configurar canais (WhatsApp, etc.)

---

## 🔑 Informações Importantes

### Credenciais e Tokens

- **SECRET_KEY_BASE:** Já gerado e configurado
- **API Access Token:** Gerar no painel do Chatwoot
- **Senhas do Banco:** Configuradas nas variáveis de ambiente

### Localização no Servidor

- **Código do Projeto:** `/etc/easypanel/projects/chatwoot/`
- **Docker Compose:** Configurado no EasyPanel
- **Logs:** Acessíveis via EasyPanel ou SSH

### Rede Docker

- **Rede `easypanel`:** Externa, compartilhada com Traefik
- **Rede `default`:** Interna do projeto

---

## 📞 Suporte

### Documentação Oficial

- **Chatwoot Docs:** https://www.chatwoot.com/docs/
- **API Docs:** https://www.chatwoot.com/developers/api/
- **GitHub:** https://github.com/chatwoot/chatwoot

### Comandos Rápidos

```bash
# Ver logs
docker logs chatwoot_chatwoot-chatwoot-web-1 --tail 50 -f

# Acessar container
docker exec -it chatwoot_chatwoot-chatwoot-web-1 bash

# Verificar status
docker ps | grep chatwoot
```

---

## 📝 Notas para Próxima IA

### Contexto Importante

1. **Ambiente:** EasyPanel (gerencia Docker Compose automaticamente)
2. **Rede:** Usar rede `easypanel` para Traefik acessar
3. **Código-Fonte:** Ainda não instalado (usando imagem oficial)
4. **Personalização:** Logos e branding ainda não aplicados

### Arquivos Principais

- **docker-compose-easypanel-funcionando.yml** - Arquivo ativo
- **DOCUMENTACAO_COMPLETA.md** - Documentação principal
- **GUIA_CODIGO_FONTE_LOGO.md** - Próximo passo

### Problemas Resolvidos

1. ✅ Erro de rede (OficialMed não encontrada) - Resolvido usando rede `easypanel`
2. ✅ Erro 502 Bad Gateway - Resolvido conectando à rede correta
3. ✅ Extensão vector do PostgreSQL - Resolvido usando `pgvector/pgvector:pg14`
4. ✅ Bash não encontrado - Resolvido usando `sh` ao invés de `bash`

---

**Última Atualização:** 17/11/2025  
**Versão do Chatwoot:** 2.0.0 (imagem oficial)  
**Status:** ✅ Funcionando - Pronto para personalização
