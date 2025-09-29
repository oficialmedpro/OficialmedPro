# 🕐 Sistema de Sincronização Automática

Este documento descreve como usar o sistema de sincronização automática implementado no dashboard.

## 📋 Visão Geral

O sistema de sincronização automática executa sincronizações nos seguintes horários (horário de Brasília - GMT-3):
- **8:00** da manhã
- **9:50** da manhã  
- **11:50** da manhã
- **13:50** da tarde
- **15:50** da tarde
- **17:50** da tarde
- **19:50** da tarde
- **20:50** da tarde

## 🚀 Como Usar

### 1. Interface do Usuário

No TopMenuBar, você encontrará os seguintes botões:

#### 🕐 AUTO SYNC
- **Verde**: Clique para iniciar a sincronização automática
- **Vermelho**: Clique para parar a sincronização automática

#### 🔄 FORÇAR
- Aparece apenas quando a sincronização automática está ativa
- Permite executar uma sincronização imediatamente

#### ⚡ SYNC AGORA
- Botão existente para sincronização manual
- Continua funcionando normalmente

### 2. Status da Sincronização

O sistema mostra:
- **Última sincronização**: Quando foi a última vez que os dados foram atualizados
- **Próxima sincronização**: Quando será a próxima sincronização automática
- **Horários**: Lista dos próximos horários de sincronização

### 3. Notificações

O sistema envia notificações do navegador para:
- ✅ Início da sincronização
- ✅ Conclusão com sucesso
- ❌ Erros na sincronização
- ⏰ Próximos horários agendados
- ⏹️ Parada do serviço

## 🔧 Configuração Técnica

### Frontend
- **Serviço**: `src/service/scheduledSyncService.js`
- **Notificações**: `src/service/notificationService.js`
- **Interface**: `src/components/TopMenuBar.jsx`

### Backend
- **Endpoint**: `POST /api/sync-now`
- **Status**: `GET /api/sync-status`
- **Arquivo**: `api/server.js`

### Scripts de Deploy
- **Deploy**: `deploy-scheduled-sync.sh`
- **Teste**: `test-scheduled-sync.js`
- **Monitor**: `monitor-scheduled-sync.sh`

## 📊 Monitoramento

### Logs
Os logs são salvos em:
- `src/sincronizacao/hourly-sync.log`
- Console do navegador
- Console do servidor

### Status
Para verificar o status:
```bash
# Testar o serviço
node test-scheduled-sync.js

# Monitorar logs
./monitor-scheduled-sync.sh
```

## 🚀 Deploy na VPS

### 1. Preparação
```bash
# Executar o script de deploy
chmod +x deploy-scheduled-sync.sh
./deploy-scheduled-sync.sh
```

### 2. Teste
```bash
# Testar o serviço
node test-scheduled-sync.js

# Iniciar o serviço
node start-scheduled-sync.js
```

### 3. Portainer
Use o arquivo `portainer-scheduled-sync.yml` para configurar no Portainer.

## 🔄 Funcionamento

### 1. Inicialização
- O serviço verifica se está em um dos horários de sincronização
- Se não estiver, aguarda até o próximo horário
- Calcula automaticamente os próximos horários

### 2. Execução
- A cada minuto, verifica se é hora de sincronizar
- Executa a sincronização via API
- Registra o resultado no banco de dados
- Envia notificações apropriadas

### 3. Controle
- Pode ser iniciado/parado a qualquer momento
- Mantém estado entre sessões do navegador
- Funciona independentemente do usuário estar logado

## ⚠️ Considerações Importantes

### Horário
- O sistema usa horário de Brasília (GMT-3)
- Ajusta automaticamente para horário de verão
- Funciona 24/7, mas só sincroniza nos horários especificados

### Performance
- Sincroniza apenas dados das últimas 48 horas
- Processa em lotes para não sobrecarregar
- Usa cache para otimizar performance

### Segurança
- Requer permissões de administrador
- Usa autenticação via API
- Registra todas as operações

## 🐛 Troubleshooting

### Problemas Comuns

#### Sincronização não inicia
- Verificar se as variáveis de ambiente estão configuradas
- Verificar se o endpoint `/api/sync-now` está funcionando
- Verificar logs do console

#### Notificações não aparecem
- Verificar se o navegador permite notificações
- Verificar se o serviço está rodando
- Verificar console para erros

#### Horários incorretos
- Verificar se o sistema está usando horário de Brasília
- Verificar se o navegador está sincronizado
- Verificar logs para cálculos de horário

### Logs Úteis
```bash
# Ver logs de sincronização
tail -f src/sincronizacao/hourly-sync.log

# Ver logs do servidor
docker logs oficialmed-api

# Ver status do serviço
node -e "import('./src/service/scheduledSyncService.js').then(m => console.log(m.default.getStatus()))"
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs primeiro
2. Testar com `test-scheduled-sync.js`
3. Verificar configurações de ambiente
4. Consultar este documento

## 🔄 Atualizações

O sistema é atualizado automaticamente quando:
- O código é atualizado via Git
- A imagem Docker é reconstruída
- O serviço é reiniciado

Para aplicar atualizações:
1. Fazer commit das mudanças
2. Rebuild da imagem Docker
3. Restart do serviço no Portainer
