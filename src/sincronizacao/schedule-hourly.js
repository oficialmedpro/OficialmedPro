#!/usr/bin/env node

/**
 * 📅 AGENDADOR DE SINCRONIZAÇÃO HORÁRIA
 * 
 * Executa o sync-hourly.js de hora em hora entre 6h e 23h
 * Mantém o processo rodando continuamente
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env na raiz
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurações
const CONFIG = {
  SCRIPT_PATH: path.join(__dirname, 'sync-hourly.js'),
  START_HOUR: 6,  // 6h da manhã
  END_HOUR: 23,   // 11h da noite
  INTERVAL_MINUTES: 60, // 60 minutos = 1 hora
  LOG_FILE: path.join(__dirname, 'scheduler.log')
};

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função para log com timestamp
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [SCHEDULER] [${level}] ${message}`;
  
  console.log(`${colors.cyan}${logMessage}${colors.reset}`);
}

// Função auxiliar: inserir registro de sincronização do agendador no Supabase
async function insertSchedulerRecord(description) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    const resp = await fetch(`${supabaseUrl}/rest/v1/sincronizacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ created_at: new Date().toISOString(), data: new Date().toISOString(), descricao: description })
    });
    if (!resp.ok) {
      log(`Falha ao registrar scheduler (HTTP ${resp.status})`, 'ERROR');
    }
  } catch (err) {
    log(`Erro ao registrar scheduler: ${err.message}`, 'ERROR');
  }
}

// Verificar se está no horário de funcionamento
function isWorkingHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= CONFIG.START_HOUR && hour <= CONFIG.END_HOUR;
}

// Calcular próximo horário de execução
function getNextRunTime() {
  const now = new Date();
  const next = new Date(now);
  
  // Próximo horário cheio (minutos = 0)
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  
  // Se passou do horário de funcionamento, agendar para amanhã 6h
  if (next.getHours() > CONFIG.END_HOUR) {
    next.setDate(next.getDate() + 1);
    next.setHours(CONFIG.START_HOUR);
  }
  
  // Se é antes do horário de funcionamento hoje, agendar para 6h hoje
  if (next.getHours() < CONFIG.START_HOUR) {
    next.setHours(CONFIG.START_HOUR);
  }
  
  return next;
}

// Executar sincronização
function runSync() {
  return new Promise((resolve) => {
    log('🚀 Iniciando sincronização horária...');
    
    const child = spawn('node', [CONFIG.SCRIPT_PATH], {
      stdio: 'inherit',
      cwd: path.dirname(CONFIG.SCRIPT_PATH)
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ Sincronização concluída com sucesso`, 'SUCCESS');
        insertSchedulerRecord('Execução do scheduler concluída com sucesso (detalhes no registro do sync-hourly).');
      } else {
        log(`❌ Sincronização falhou com código ${code}`, 'ERROR');
        insertSchedulerRecord(`Execução do scheduler falhou: código ${code}`);
      }
      resolve(code);
    });
    
    child.on('error', (error) => {
      log(`❌ Erro ao executar sincronização: ${error.message}`, 'ERROR');
      insertSchedulerRecord(`Erro do scheduler ao iniciar sync: ${error.message}`);
      resolve(1);
    });
  });
}

// Função principal do agendador
async function scheduler() {
  log('📅 AGENDADOR DE SINCRONIZAÇÃO INICIADO');
  log(`⏰ Horário de funcionamento: ${CONFIG.START_HOUR}h às ${CONFIG.END_HOUR}h`);
  log(`🔄 Intervalo: ${CONFIG.INTERVAL_MINUTES} minutos`);
  
  while (true) {
    const now = new Date();
    const nextRun = getNextRunTime();
    const waitTime = nextRun.getTime() - now.getTime();
    
    log(`⏳ Próxima execução: ${nextRun.toLocaleString('pt-BR')} (em ${Math.round(waitTime / 60000)} minutos)`);
    
    // Aguardar até o próximo horário
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Verificar novamente se está no horário (caso o sistema tenha dormido)
    if (isWorkingHours()) {
      await runSync();
    } else {
      log('⏰ Fora do horário de funcionamento, pulando execução');
    }
  }
}

// Tratar sinais de sistema
process.on('SIGINT', () => {
  log('📴 Recebido SIGINT, finalizando agendador...', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('📴 Recebido SIGTERM, finalizando agendador...', 'INFO');
  process.exit(0);
});

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  log(`❌ Erro não capturado: ${error.message}`, 'ERROR');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Promise rejeitada: ${reason}`, 'ERROR');
  console.error('Promise rejeitada em:', promise);
  process.exit(1);
});

// Iniciar agendador
scheduler().catch(error => {
  log(`❌ Erro fatal no agendador: ${error.message}`, 'ERROR');
  process.exit(1);
});