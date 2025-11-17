/**
 * 🧪 Script de Teste de Performance da Sincronização
 * 
 * Executa sincronização e mede tempo, velocidade e eficiência
 */

import { syncOptimized48Hours } from './src/service/optimizedSyncService.js';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function testSyncPerformance() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  🧪 TESTE DE PERFORMANCE - SINCRONIZAÇÃO OTIMIZADA ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.blue}📅 Início: ${new Date().toLocaleString('pt-BR')}${colors.reset}\n`);
  
  try {
    // Executar sincronização
    const results = await syncOptimized48Hours({
      onProgress: (progress) => {
        if (progress.status && progress.stage) {
          console.log(`${colors.yellow}📍 ${progress.stage}: ${progress.status}${colors.reset}`);
        }
      }
    });

    // Análise de resultados
    console.log(`\n${colors.green}╔════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║              📊 RESULTADOS DO TESTE                ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Tempo
    const minutos = Math.floor(results.duration / 60);
    const segundos = results.duration % 60;
    console.log(`${colors.cyan}⏱️  Tempo Total:${colors.reset} ${minutos}min ${segundos}s (${results.duration}s)`);
    
    // Velocidade
    const velocidade = Math.round(results.totalProcessed / results.duration);
    console.log(`${colors.magenta}🚀 Velocidade:${colors.reset} ~${velocidade} ops/s`);
    
    // Estatísticas
    console.log(`\n${colors.blue}📈 Estatísticas:${colors.reset}`);
    console.log(`   • Total processadas: ${results.totalProcessed}`);
    console.log(`   • Inseridas: ${colors.green}${results.totalInserted}${colors.reset}`);
    console.log(`   • Atualizadas: ${colors.yellow}${results.totalUpdated}${colors.reset}`);
    console.log(`   • Já atualizadas: ${results.totalSkipped}`);
    console.log(`   • Erros: ${results.totalErrors > 0 ? colors.red : colors.green}${results.totalErrors}${colors.reset}`);

    // Taxa de sucesso
    const taxaSucesso = results.totalProcessed > 0 
      ? ((results.totalProcessed - results.totalErrors) / results.totalProcessed * 100).toFixed(2)
      : 100;
    console.log(`\n${colors.green}✅ Taxa de Sucesso:${colors.reset} ${taxaSucesso}%`);

    // Eficiência
    const eficiencia = results.totalProcessed > 0
      ? ((results.totalInserted + results.totalUpdated) / results.totalProcessed * 100).toFixed(2)
      : 0;
    console.log(`${colors.cyan}📊 Taxa de Modificação:${colors.reset} ${eficiencia}% (dados novos/alterados)`);

    // Análise de performance
    console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║           🎯 ANÁLISE DE PERFORMANCE                ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

    if (results.duration <= 300) { // 5 minutos
      console.log(`${colors.green}🌟 EXCELENTE!${colors.reset} Sincronização muito rápida (≤ 5 min)`);
    } else if (results.duration <= 600) { // 10 minutos
      console.log(`${colors.yellow}✅ BOM!${colors.reset} Sincronização rápida (5-10 min)`);
    } else if (results.duration <= 900) { // 15 minutos
      console.log(`${colors.yellow}⚠️  REGULAR${colors.reset} Sincronização dentro do esperado (10-15 min)`);
    } else {
      console.log(`${colors.red}❌ LENTO${colors.reset} Sincronização ainda demorada (> 15 min)`);
      console.log(`${colors.yellow}💡 Dica: Verifique conexão e considere ajustar parâmetros${colors.reset}`);
    }

    if (velocidade >= 50) {
      console.log(`${colors.green}🚀 Velocidade ÓTIMA!${colors.reset} (≥ 50 ops/s)`);
    } else if (velocidade >= 20) {
      console.log(`${colors.cyan}✅ Velocidade BOA${colors.reset} (20-50 ops/s)`);
    } else {
      console.log(`${colors.yellow}⚠️  Velocidade pode melhorar${colors.reset} (< 20 ops/s)`);
    }

    // Comparação com versão antiga
    const tempoAntigoMin = 15; // 15 min (estimativa mínima)
    const tempoAntigoMax = 20; // 20 min (estimativa máxima)
    const tempoAntigoMedio = (tempoAntigoMin + tempoAntigoMax) / 2 * 60; // em segundos
    const melhoria = ((tempoAntigoMedio - results.duration) / tempoAntigoMedio * 100).toFixed(1);
    
    console.log(`\n${colors.cyan}📊 Comparação com versão antiga:${colors.reset}`);
    console.log(`   • Tempo anterior estimado: ${tempoAntigoMin}-${tempoAntigoMax} min`);
    console.log(`   • Tempo atual: ${minutos}min ${segundos}s`);
    console.log(`   • ${colors.green}Melhoria: ~${melhoria}% mais rápido!${colors.reset}`);

    console.log(`\n${colors.blue}📅 Fim: ${new Date().toLocaleString('pt-BR')}${colors.reset}`);
    console.log(`\n${colors.green}✅ Teste concluído com sucesso!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ ERRO NO TESTE:${colors.reset}`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar teste
console.log(`${colors.cyan}🔄 Iniciando teste de performance...${colors.reset}\n`);
testSyncPerformance().catch(error => {
  console.error(`${colors.red}ERRO FATAL:${colors.reset}`, error.message);
  process.exit(1);
});































