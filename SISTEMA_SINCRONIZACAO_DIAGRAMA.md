# 🔄 Diagrama do Sistema de Sincronização Automática

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                      │
├─────────────────────────────────────────────────────────────────┤
│  TopMenuBar.jsx                                                │
│  ├── 🕐 AUTO SYNC Button                                       │
│  ├── 🔄 FORÇAR Button                                          │
│  ├── ⚡ SYNC AGORA Button                                      │
│  └── Status Display                                            │
├─────────────────────────────────────────────────────────────────┤
│  scheduledSyncService.js                                       │
│  ├── Timer (verifica a cada minuto)                            │
│  ├── Horários: 8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 │
│  └── API Calls to Backend                                      │
├─────────────────────────────────────────────────────────────────┤
│  notificationService.js                                        │
│  ├── Browser Notifications                                     │
│  ├── Notification History                                      │
│  └── Event Dispatching                                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP API Calls
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (API)                           │
├─────────────────────────────────────────────────────────────────┤
│  api/server.js                                                 │
│  ├── POST /api/sync-now                                        │
│  ├── GET /api/sync-status                                      │
│  └── Spawn sync-now.js process                                 │
├─────────────────────────────────────────────────────────────────┤
│  src/sincronizacao/sync-now.js                                 │
│  ├── Execute sync-hourly.js                                    │
│  ├── Process Funis 6 & 14                                      │
│  └── Update Supabase                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Database Operations
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                         │
│  ├── api.sincronizacao (logs)                                  │
│  ├── api.oportunidade_sprint (data)                            │
│  └── SprintHub API (source data)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Execução

### 1. Inicialização
```
User clicks "🕐 AUTO SYNC" 
    ↓
scheduledSyncService.start()
    ↓
Calculate next sync time
    ↓
Start timer (check every minute)
    ↓
Show status in UI
```

### 2. Verificação de Horário
```
Every minute:
    ↓
Check if current time matches sync times
    ↓
If match: execute sync
    ↓
If not: wait for next minute
```

### 3. Execução da Sincronização
```
Timer triggers sync
    ↓
scheduledSyncService.performSync()
    ↓
POST /api/sync-now
    ↓
Backend spawns sync-now.js
    ↓
sync-now.js executes sync-hourly.js
    ↓
Process data from SprintHub
    ↓
Update Supabase database
    ↓
Return result to frontend
    ↓
Update UI and send notifications
```

## Horários de Sincronização

```
Brasília Time (GMT-3):
┌─────────┬─────────┬─────────┬─────────┐
│ 08:00   │ 09:50   │ 11:50   │ 13:50   │
├─────────┼─────────┼─────────┼─────────┤
│ 15:50   │ 17:50   │ 19:50   │ 20:50   │
└─────────┴─────────┴─────────┴─────────┘

UTC Time (GMT+0):
┌─────────┬─────────┬─────────┬─────────┐
│ 11:00   │ 12:50   │ 14:50   │ 16:50   │
├─────────┼─────────┼─────────┼─────────┤
│ 18:50   │ 20:50   │ 22:50   │ 23:50   │
└─────────┴─────────┴─────────┴─────────┘
```

## Estados do Sistema

### 1. Parado
```
Status: ❌ Stopped
UI: Green "🕐 AUTO SYNC" button
Timer: Not running
Sync: Not executing
```

### 2. Rodando
```
Status: ✅ Running
UI: Red "⏹️ Parando..." button + "🔄 FORÇAR" button
Timer: Running (check every minute)
Sync: Waiting for scheduled time
```

### 3. Executando
```
Status: 🔄 Syncing
UI: "🔄 Executando..." button (disabled)
Timer: Paused
Sync: In progress
```

## Notificações

### Tipos de Notificação
```
🔄 Sincronização Iniciada
├── Quando: Sync starts
├── Tipo: Info
└── Ação: Show in UI + Browser notification

✅ Sincronização Concluída
├── Quando: Sync completes successfully
├── Tipo: Success
└── Ação: Update last sync time + Show results

❌ Erro na Sincronização
├── Quando: Sync fails
├── Tipo: Error
└── Ação: Show error message + Log error

⏰ Sincronização Agendada
├── Quando: Service starts
├── Tipo: Info
└── Ação: Show next sync time

⏹️ Sincronização Parada
├── Quando: Service stops
├── Tipo: Info
└── Ação: Update UI status
```

## Configuração de Deploy

### VPS Setup
```
1. Upload code to VPS
2. Run deploy-scheduled-sync.sh
3. Configure environment variables
4. Start service: node start-scheduled-sync.js
5. Monitor: ./monitor-scheduled-sync.sh
```

### Portainer Setup
```
1. Use portainer-scheduled-sync.yml
2. Configure environment variables
3. Deploy stack
4. Monitor logs in Portainer UI
```

## Monitoramento

### Logs
```
Frontend: Browser console
Backend: Docker logs
Sync: src/sincronizacao/hourly-sync.log
API: api/server.js console
```

### Status Checks
```
Frontend: scheduledSyncService.getStatus()
Backend: GET /api/sync-status
Database: api.sincronizacao table
```

## Troubleshooting

### Problemas Comuns
```
1. Sync not starting
   ├── Check environment variables
   ├── Check API endpoint
   └── Check browser console

2. Wrong sync times
   ├── Check timezone settings
   ├── Check browser time
   └── Check sync time calculation

3. Notifications not working
   ├── Check browser permissions
   ├── Check notification service
   └── Check console errors

4. Sync failing
   ├── Check SprintHub API
   ├── Check Supabase connection
   └── Check sync logs
```

## Segurança

### Permissions
```
- Admin only: Start/stop sync
- API authentication: Required
- Database access: Service role key
- Browser notifications: User permission
```

### Data Protection
```
- No sensitive data in logs
- Encrypted API calls
- Secure database connections
- User session validation
```
