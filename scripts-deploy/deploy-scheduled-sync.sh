#!/bin/bash

# 🚀 SCRIPT DE DEPLOY DA SINCRONIZAÇÃO AUTOMÁTICA
# 
# Este script configura a sincronização automática na VPS
# Executa nos horários: 8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (Brasília)

echo "🚀 INICIANDO DEPLOY DA SINCRONIZAÇÃO AUTOMÁTICA"
echo "=============================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erro: Variáveis de ambiente não configuradas"
    echo "Configure VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o arquivo de sincronização existe
if [ ! -f "src/sincronizacao/sync-now.js" ]; then
    echo "❌ Erro: Arquivo sync-now.js não encontrado"
    exit 1
fi

echo "✅ Arquivos de sincronização encontrados"

# Criar script de inicialização da sincronização agendada
cat > start-scheduled-sync.js << 'EOF'
#!/usr/bin/env node

/**
 * 🕐 INICIADOR DA SINCRONIZAÇÃO AGENDADA
 * 
 * Este script inicia o serviço de sincronização agendada
 * Executa nos horários: 8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (Brasília)
 */

import scheduledSyncService from './src/service/scheduledSyncService.js';

console.log('🚀 Iniciando serviço de sincronização agendada...');
console.log('⏰ Horários: 8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (Brasília)');

// Iniciar o serviço
scheduledSyncService.start();

// Manter o processo rodando
process.on('SIGINT', () => {
    console.log('📴 Parando serviço de sincronização agendada...');
    scheduledSyncService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('📴 Parando serviço de sincronização agendada...');
    scheduledSyncService.stop();
    process.exit(0);
});

// Manter o processo vivo
setInterval(() => {
    // Verificar se o serviço ainda está rodando
    const status = scheduledSyncService.getStatus();
    if (!status.isRunning) {
        console.log('⚠️ Serviço parou inesperadamente, reiniciando...');
        scheduledSyncService.start();
    }
}, 60000); // Verificar a cada minuto
EOF

echo "✅ Script de inicialização criado"

# Tornar o script executável
chmod +x start-scheduled-sync.js

# Criar script de teste
cat > test-scheduled-sync.js << 'EOF'
#!/usr/bin/env node

/**
 * 🧪 TESTE DA SINCRONIZAÇÃO AGENDADA
 */

import scheduledSyncService from './src/service/scheduledSyncService.js';

console.log('🧪 TESTANDO SINCRONIZAÇÃO AGENDADA');
console.log('==================================');

// Testar status
const status = scheduledSyncService.getStatus();
console.log('📊 Status:', status);

// Testar próximos horários
const nextTimes = scheduledSyncService.getNextSyncTimes();
console.log('⏰ Próximos horários:', nextTimes);

// Testar sincronização forçada
console.log('🔄 Testando sincronização forçada...');
scheduledSyncService.forceSync().then(result => {
    console.log('✅ Resultado:', result);
    process.exit(0);
}).catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});
EOF

chmod +x test-scheduled-sync.js

echo "✅ Script de teste criado"

# Criar arquivo de configuração para o Portainer
cat > portainer-scheduled-sync.yml << 'EOF'
version: '3.8'

services:
  scheduled-sync:
    image: node:18-alpine
    container_name: oficialmed-scheduled-sync
    restart: unless-stopped
    working_dir: /app
    volumes:
      - .:/app
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_SERVICE_ROLE_KEY=${VITE_SUPABASE_SERVICE_ROLE_KEY}
      - VITE_SPRINTHUB_BASE_URL=${VITE_SPRINTHUB_BASE_URL}
      - VITE_SPRINTHUB_API_TOKEN=${VITE_SPRINTHUB_API_TOKEN}
      - VITE_SPRINTHUB_INSTANCE=${VITE_SPRINTHUB_INSTANCE}
    command: node start-scheduled-sync.js
    networks:
      - oficialmed-network
    depends_on:
      - api

  api:
    build: ./api
    container_name: oficialmed-api
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_SERVICE_ROLE_KEY=${VITE_SUPABASE_SERVICE_ROLE_KEY}
      - VITE_SPRINTHUB_BASE_URL=${VITE_SPRINTHUB_BASE_URL}
      - VITE_SPRINTHUB_API_TOKEN=${VITE_SPRINTHUB_API_TOKEN}
      - VITE_SPRINTHUB_INSTANCE=${VITE_SPRINTHUB_INSTANCE}
    networks:
      - oficialmed-network

networks:
  oficialmed-network:
    external: true
EOF

echo "✅ Arquivo de configuração do Portainer criado"

# Criar script de monitoramento
cat > monitor-scheduled-sync.sh << 'EOF'
#!/bin/bash

# 📊 MONITOR DA SINCRONIZAÇÃO AGENDADA

echo "📊 MONITOR DA SINCRONIZAÇÃO AGENDADA"
echo "===================================="

# Verificar se o processo está rodando
if pgrep -f "start-scheduled-sync.js" > /dev/null; then
    echo "✅ Serviço de sincronização agendada está rodando"
else
    echo "❌ Serviço de sincronização agendada NÃO está rodando"
fi

# Mostrar logs recentes
echo ""
echo "📋 Logs recentes:"
tail -n 20 src/sincronizacao/hourly-sync.log 2>/dev/null || echo "Nenhum log encontrado"

# Mostrar status
echo ""
echo "📊 Status atual:"
node -e "
import scheduledSyncService from './src/service/scheduledSyncService.js';
const status = scheduledSyncService.getStatus();
console.log('Rodando:', status.isRunning);
console.log('Última sync:', status.lastSyncTime);
console.log('Próxima sync:', status.nextSyncTime);
" 2>/dev/null || echo "Erro ao obter status"
EOF

chmod +x monitor-scheduled-sync.sh

echo "✅ Script de monitoramento criado"

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "===================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Teste o serviço: node test-scheduled-sync.js"
echo "2. Inicie o serviço: node start-scheduled-sync.js"
echo "3. Monitore: ./monitor-scheduled-sync.sh"
echo "4. Para Portainer: use portainer-scheduled-sync.yml"
echo ""
echo "⏰ HORÁRIOS DE SINCRONIZAÇÃO:"
echo "8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (Brasília)"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "- Iniciar: node start-scheduled-sync.js"
echo "- Testar: node test-scheduled-sync.js"
echo "- Monitorar: ./monitor-scheduled-sync.sh"
echo "- Parar: pkill -f start-scheduled-sync.js"
