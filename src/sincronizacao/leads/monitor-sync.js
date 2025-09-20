#!/usr/bin/env node

/**
 * 📊 MONITOR DE SINCRONIZAÇÃO - VERIFICAR PROGRESSO
 * 
 * Script para monitorar o progresso da sincronização em background
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
};

const CHECKPOINT_FILE = path.join(__dirname, 'checkpoint-conservative.json');

function monitorProgress() {
  try {
    if (!fs.existsSync(CHECKPOINT_FILE)) {
      console.log(`${colors.yellow}⚠️ Arquivo de checkpoint não encontrado${colors.reset}`);
      console.log(`${colors.blue}💡 A sincronização pode não ter começado ainda${colors.reset}`);
      return;
    }

    const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    
    const percentage = ((checkpoint.totalProcessed / checkpoint.estimatedTotal) * 100).toFixed(2);
    const elapsed = ((Date.now() - checkpoint.startTime) / 1000 / 60).toFixed(1);
    const rate = (checkpoint.totalProcessed / (elapsed || 1)).toFixed(1);
    const remaining = ((checkpoint.estimatedTotal - checkpoint.totalProcessed) / rate).toFixed(0);

    console.log(`${colors.cyan}📊 STATUS DA SINCRONIZAÇÃO EM BACKGROUND${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.blue}📈 Progresso: ${checkpoint.totalProcessed.toLocaleString()}/${checkpoint.estimatedTotal.toLocaleString()} (${percentage}%)${colors.reset}`);
    console.log(`${colors.blue}⏱️ Tempo decorrido: ${elapsed} minutos${colors.reset}`);
    console.log(`${colors.blue}📊 Velocidade: ${rate} leads/min${colors.reset}`);
    console.log(`${colors.blue}⏳ Tempo restante: ~${remaining} minutos${colors.reset}`);
    console.log(`${colors.blue}📄 Página atual: ${checkpoint.currentPage}${colors.reset}`);
    console.log('');
    console.log(`${colors.green}✅ Inseridos: ${checkpoint.totalInserted.toLocaleString()}${colors.reset}`);
    console.log(`${colors.blue}🔄 Atualizados: ${checkpoint.totalUpdated.toLocaleString()}${colors.reset}`);
    console.log(`${colors.yellow}⚪ Pulados: ${checkpoint.totalSkipped.toLocaleString()}${colors.reset}`);
    console.log(`${colors.red}❌ Erros: ${checkpoint.totalErrors.toLocaleString()}${colors.reset}`);
    console.log(`${colors.blue}🔄 Total API calls: ${checkpoint.totalApiCalls.toLocaleString()}${colors.reset}`);
    console.log('');
    console.log(`${colors.cyan}🕒 Última atualização: ${new Date(checkpoint.timestamp).toLocaleString()}${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Erro ao ler checkpoint:${colors.reset}`, error.message);
  }
}

// Executar monitoramento
monitorProgress();
