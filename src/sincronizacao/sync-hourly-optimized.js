#!/usr/bin/env node

/**
 * 🚀 SINCRONIZAÇÃO OTIMIZADA - FUNIS 6 E 14
 * 
 * Versão otimizada que reduz o tempo de sincronização de 15-20 min para 3-5 min
 * Sincroniza oportunidades das últimas 48 horas de ambos os funis
 * 
 * Melhorias:
 * - Processamento em lotes maiores (20 ao invés de 5)
 * - Verificações em batch no Supabase
 * - Inserções em bulk
 * - Delays reduzidos (30-50ms ao invés de 100-200ms)
 * - Processamento paralelo de etapas
 * - Cache de verificações
 */

import { syncOptimized48Hours } from '../service/optimizedSyncService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Configurações
const CONFIG = {
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  },
  START_HOUR: 6,
  END_HOUR: 23,
  LOG_FILE: path.join(__dirname, 'hourly-sync-optimized.log')
};

// Função para log com timestamp
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
  } catch (error) {
    // Ignorar erros de log
  }
}

// Verificar se está no horário de funcionamento
function isWorkingHours() {
  if (process.env.FORCE_SYNC === 'true') {
    return true;
  }
  
  const now = new Date();
  const hour = now.getHours();
  return hour >= CONFIG.START_HOUR && hour <= CONFIG.END_HOUR;
}

// Inserir registro na tabela api.sincronizacao
async function insertSyncRecord(description) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/sincronizacao`;
    const payload = {
      created_at: new Date().toISOString(),
      data: new Date().toISOString(),
      descricao: description
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
        'apikey': CONFIG.SUPABASE.key,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      log('📝 Registro de sincronização salvo', 'INFO');
    } else {
      log(`⚠️ Falha ao salvar registro (HTTP ${response.status})`, 'ERROR');
    }
  } catch (error) {
    log(`⚠️ Erro ao registrar sincronização: ${error.message}`, 'ERROR');
  }
}

// Função principal
async function main() {
  // Verificar horário de funcionamento
  if (!isWorkingHours()) {
    const now = new Date();
    log(`Fora do horário de funcionamento (${now.getHours()}h). Execute entre ${CONFIG.START_HOUR}h e ${CONFIG.END_HOUR}h.`, 'INFO');
    process.exit(0);
  }
  
  log(`${colors.cyan}🚀 INICIANDO SINCRONIZAÇÃO OTIMIZADA - ${new Date().toLocaleString('pt-BR')}${colors.reset}`);
  log(`${colors.cyan}📊 Buscando oportunidades das últimas 48 horas${colors.reset}`);
  log(`${colors.magenta}⚡ Modo: OTIMIZADO (Batch + Paralelo + Cache)${colors.reset}`);
  
  // Verificar variáveis de ambiente
  if (!CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key) {
    log('ERRO: Variáveis de ambiente não encontradas', 'ERROR');
    process.exit(1);
  }
  
  try {
    // Executar sincronização otimizada
    const results = await syncOptimized48Hours({
      onProgress: (progress) => {
        if (progress.status && progress.stage) {
          log(`📍 ${progress.stage}: ${progress.status}`);
        }
      }
    });
    
    // Relatório final
    if (results.error) {
      log(`${colors.red}❌ ERRO NA SINCRONIZAÇÃO: ${results.error}${colors.reset}`, 'ERROR');
      process.exit(1);
    }
    
    log(`${colors.green}✅ SINCRONIZAÇÃO CONCLUÍDA em ${results.duration}s${colors.reset}`);
    log(`${colors.blue}📊 RESUMO: ${results.totalProcessed} processadas | ${results.totalInserted} inseridas | ${results.totalUpdated} atualizadas | ${results.totalSkipped} ignoradas | ${results.totalErrors} erros${colors.reset}`);
    log(`${colors.magenta}🚀 Velocidade: ~${Math.round(results.totalProcessed / results.duration)} ops/s${colors.reset}`);
    
    // Log por funil
    Object.entries(results.funnels).forEach(([funnelId, funnelData]) => {
      log(`${colors.cyan}📋 Funil ${funnelId} (${funnelData.name})${colors.reset}`);
      
      Object.entries(funnelData.stages).forEach(([stageId, stageData]) => {
        if (stageData.success) {
          log(`   ${stageData.stageName}: +${stageData.inserted} ~${stageData.updated} =${stageData.skipped} !${stageData.errors}`);
        }
      });
    });

    // Registrar na tabela sincronizacao
    const description = `Sync OTIMIZADA (${results.duration}s): processadas ${results.totalProcessed} | inseridas ${results.totalInserted} | atualizadas ${results.totalUpdated} | ignoradas ${results.totalSkipped} | erros ${results.totalErrors} | velocidade ~${Math.round(results.totalProcessed / results.duration)} ops/s`;
    await insertSyncRecord(description);
    
    log(`${colors.green}🎉 SINCRONIZAÇÃO OTIMIZADA FINALIZADA COM SUCESSO!${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}ERRO FATAL: ${error.message}${colors.reset}`, 'ERROR');
    log(error.stack, 'ERROR');
    process.exit(1);
  }
}

// Executar script
main().catch(error => {
  log(`ERRO FATAL: ${error.message}`, 'ERROR');
  process.exit(1);
});

export { main, CONFIG };


