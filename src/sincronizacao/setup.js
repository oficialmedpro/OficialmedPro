#!/usr/bin/env node

/**
 * 🔧 SETUP E CONFIGURAÇÃO DOS SCRIPTS DE SINCRONIZAÇÃO
 * 
 * Script utilitário para verificar dependências e configurações
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSetup() {

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔧 SETUP - SCRIPTS DE SINCRONIZAÇÃO OFICIALMED${colors.reset}`);
console.log(`${colors.cyan}===============================================${colors.reset}`);
console.log('');

// Verificar se estamos na pasta correta
const currentDir = process.cwd();
const expectedPaths = [
  currentDir, // Pasta atual (minha-pwa)
  path.join(currentDir, '..', '..'), // Se executando de dentro de src/sincronizacao
];

let projectRoot = null;
for (const testPath of expectedPaths) {
  if (fs.existsSync(path.join(testPath, 'package.json')) || fs.existsSync(path.join(testPath, '.env'))) {
    projectRoot = testPath;
    break;
  }
}

if (!projectRoot) {
  projectRoot = currentDir; // Usar pasta atual como fallback
}

console.log(`${colors.blue}📁 Diretório do projeto: ${projectRoot}${colors.reset}`);

// Verificar arquivo .env
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  console.log(`${colors.green}✅ Arquivo .env encontrado${colors.reset}`);
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY=');
  const hasSprintHubToken = envContent.includes('VITE_SPRINTHUB_API_TOKEN=');
  
  if (hasSupabaseUrl && hasSupabaseKey && hasSprintHubToken) {
    console.log(`${colors.green}✅ Variáveis de ambiente configuradas${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️ Algumas variáveis de ambiente podem estar faltando${colors.reset}`);
  }
} else {
  console.log(`${colors.red}❌ Arquivo .env não encontrado em ${envPath}${colors.reset}`);
  console.log(`${colors.yellow}💡 Crie o arquivo .env com as configurações necessárias${colors.reset}`);
}

// Verificar Node.js
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`${colors.green}✅ Node.js: ${nodeVersion}${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}❌ Node.js não encontrado${colors.reset}`);
}

// Verificar npm
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`${colors.green}✅ npm: ${npmVersion}${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}❌ npm não encontrado${colors.reset}`);
}

// Verificar dependência dotenv
try {
  await import('dotenv');
  console.log(`${colors.green}✅ dotenv instalado${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}⚠️ dotenv não instalado${colors.reset}`);
  console.log(`${colors.blue}🔧 Para instalar: npm install dotenv${colors.reset}`);
}

// Verificar scripts disponíveis
const syncDir = path.join(projectRoot, 'src', 'sincronizacao');
if (fs.existsSync(syncDir)) {
  console.log(`${colors.green}✅ Pasta sincronização encontrada${colors.reset}`);
  
  const scripts = fs.readdirSync(syncDir).filter(file => file.endsWith('.js') && file !== 'setup.js');
  console.log(`${colors.blue}📄 Scripts disponíveis:${colors.reset}`);
  scripts.forEach(script => {
    console.log(`${colors.blue}   - ${script}${colors.reset}`);
  });
} else {
  console.log(`${colors.red}❌ Pasta sincronização não encontrada${colors.reset}`);
}

console.log('');
console.log(`${colors.cyan}🚀 COMANDOS DISPONÍVEIS:${colors.reset}`);
console.log(`${colors.blue}Instalar dependências:${colors.reset} npm install dotenv`);
console.log(`${colors.blue}Sincronizar Funil 14:${colors.reset} node src/sincronizacao/sync-funil14.js`);
console.log(`${colors.blue}Ver documentação:${colors.reset} cat src/sincronizacao/README.md`);
console.log('');
console.log(`${colors.green}✅ Setup concluído!${colors.reset}`);

}

// Executar o setup
runSetup().catch(console.error);