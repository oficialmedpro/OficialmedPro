#!/usr/bin/env node

/**
 * ⚡ SINCRONIZAÇÃO IMEDIATA
 * 
 * Comando rápido para sincronizar dados na hora
 * Usa o mesmo código do sync-hourly.js mas executa imediatamente
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env na raiz
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

console.log(`${colors.cyan}⚡ SINCRONIZAÇÃO IMEDIATA INICIADA${colors.reset}`);
console.log(`${colors.cyan}=================================${colors.reset}`);

// Criar uma versão modificada do sync-hourly que ignora verificação de horário
const syncScript = path.join(__dirname, 'sync-hourly.js');

const child = spawn('node', [syncScript], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    FORCE_SYNC: 'true' // Flag para ignorar verificação de horário
  }
});

// Função auxiliar: inserir registro de sincronização no Supabase
async function insertSyncRecord(description) {
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
      console.log(`${colors.yellow}⚠️ Falha ao registrar sincronização imediata (HTTP ${resp.status})${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.yellow}⚠️ Erro ao registrar sincronização imediata: ${err.message}${colors.reset}`);
  }
}

child.on('close', (code) => {
  if (code === 0) {
    console.log(`${colors.green}✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!${colors.reset}`);
    console.log(`${colors.blue}📊 Dados atualizados e prontos para visualização${colors.reset}`);
    // Registrar execução do wrapper (além do registro feito pelo sync-hourly)
    insertSyncRecord('Sync imediata concluída (wrapper): veja detalhes no registro do sync-hourly.');
  } else {
    console.log(`${colors.red}❌ Erro na sincronização (código ${code})${colors.reset}`);
    insertSyncRecord(`Sync imediata falhou (wrapper): código ${code}`);
  }
  process.exit(code);
});

child.on('error', (error) => {
  console.log(`${colors.red}❌ Erro ao executar: ${error.message}${colors.reset}`);
  insertSyncRecord(`Sync imediata erro (wrapper): ${error.message}`);
  process.exit(1);
});