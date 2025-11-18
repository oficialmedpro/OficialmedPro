#!/usr/bin/env node

/**
 * ============================================================================
 * RELATÓRIOS PRÁTICOS - Clientes Consolidados
 * ============================================================================
 *
 * Uso:
 *   node relatorios-clientes.cjs                    - Dashboard completo
 *   node relatorios-clientes.cjs completude         - Completude dos dados
 *   node relatorios-clientes.cjs origens            - Análise de origens
 *   node relatorios-clientes.cjs apenas-sprint      - Lista para adicionar no Prime
 *   node relatorios-clientes.cjs apenas-prime       - Lista para adicionar no Sprint
 *   node relatorios-clientes.cjs exportar-sprint    - Exportar CSV apenas Sprint
 *   node relatorios-clientes.cjs exportar-prime     - Exportar CSV apenas Prime
 *
 * ============================================================================
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

const comando = process.argv[2] || 'dashboard';

// ============================================================================
// RELATÓRIOS
// ============================================================================

async function dashboardCompleto() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('           📊 DASHBOARD DE CLIENTES CONSOLIDADOS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data } = await supabase.from('dashboard_principal').select('*');

  data.forEach(row => {
    console.log(`${row.metrica.padEnd(40)} ${row.valor.padStart(10)} ${row.percentual.padStart(10)}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

async function completudeDados() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('              📋 COMPLETUDE DOS DADOS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data } = await supabase.from('stats_completude_dados').select('*').single();

  console.log(`Total de clientes: ${data.total_clientes.toLocaleString()}\n`);

  console.log('Campos preenchidos:');
  console.log(`  Nome:              ${data.com_nome.toLocaleString().padStart(7)} (${data.perc_com_nome}%)`);
  console.log(`  Email:             ${data.com_email.toLocaleString().padStart(7)} (${data.perc_com_email}%)`);
  console.log(`  WhatsApp:          ${data.com_whatsapp.toLocaleString().padStart(7)} (${data.perc_com_whatsapp}%)`);
  console.log(`  Telefone:          ${data.com_telefone.toLocaleString().padStart(7)} (${data.perc_com_telefone}%)`);
  console.log(`  CPF:               ${data.com_cpf.toLocaleString().padStart(7)} (${data.perc_com_cpf}%)`);
  console.log(`  Data Nascimento:   ${data.com_data_nascimento.toLocaleString().padStart(7)} (${data.perc_com_data_nascimento}%)`);
  console.log(`  Endereço Completo: ${data.com_endereco.toLocaleString().padStart(7)} (${data.perc_com_endereco}%)`);
  console.log('');
  console.log(`✅ DADOS 100% COMPLETOS: ${data.com_dados_completos.toLocaleString()} (${data.perc_dados_completos}%)`);

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

async function analiseOrigens() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('        🔍 ANÁLISE DE ORIGENS (Sprint vs Prime)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data } = await supabase.from('stats_por_origem').select('*').single();

  console.log(`Total de clientes: ${data.total_clientes.toLocaleString()}\n`);

  console.log('Por origem:');
  console.log(`  SprintHub:  ${data.no_sprinthub.toLocaleString().padStart(7)} (${data.perc_no_sprinthub}%)`);
  console.log(`  Prime:      ${data.no_prime.toLocaleString().padStart(7)} (${data.perc_no_prime}%)`);
  console.log(`  GreatPage:  ${data.no_greatpage.toLocaleString().padStart(7)} (${data.perc_no_greatpage}%)`);
  console.log(`  BlackLabs:  ${data.no_blacklabs.toLocaleString().padStart(7)} (${data.perc_no_blacklabs}%)`);
  console.log('');
  console.log(`Em ambos (Sprint E Prime): ${data.em_ambos_sprint_prime.toLocaleString()}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`⚠️  APENAS NO SPRINT (adicionar no Prime):  ${data.apenas_sprint.toLocaleString()}`);
  console.log(`⚠️  APENAS NO PRIME (adicionar no Sprint):  ${data.apenas_prime.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════');

  console.log('\nPara ver as listas:');
  console.log('  node relatorios-clientes.cjs apenas-sprint');
  console.log('  node relatorios-clientes.cjs apenas-prime');

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

async function listaApenasSprit() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📋 CLIENTES APENAS NO SPRINT (Adicionar no Prime)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data, count } = await supabase
    .from('clientes_apenas_sprint')
    .select('*', { count: 'exact' })
    .limit(50);

  console.log(`Total: ${count.toLocaleString()} clientes\n`);
  console.log('Mostrando os 50 primeiros (ordenados por qualidade):\n');

  console.log('ID      Sprint ID  Nome                           Email                        WhatsApp       CPF          Qualidade');
  console.log('─'.repeat(140));

  data.forEach(c => {
    console.log(
      `${c.id.toString().padEnd(7)} ` +
      `${(c.id_sprinthub || '').toString().padEnd(10)} ` +
      `${(c.nome_completo || '').substring(0, 30).padEnd(30)} ` +
      `${(c.email || '').substring(0, 28).padEnd(28)} ` +
      `${(c.whatsapp || '').padEnd(14)} ` +
      `${(c.cpf || '').padEnd(12)} ` +
      `${c.qualidade_dados}/100`
    );
  });

  console.log('\nPara exportar para CSV:');
  console.log('  node relatorios-clientes.cjs exportar-sprint');

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

async function listaApenasPrime() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📋 CLIENTES APENAS NO PRIME (Adicionar no Sprint)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data, count } = await supabase
    .from('clientes_apenas_prime')
    .select('*', { count: 'exact' })
    .limit(50);

  console.log(`Total: ${count.toLocaleString()} clientes\n`);
  console.log('Mostrando os 50 primeiros (ordenados por qualidade):\n');

  console.log('ID      Prime ID   Nome                           Email                        WhatsApp       CPF          Qualidade');
  console.log('─'.repeat(140));

  data.forEach(c => {
    console.log(
      `${c.id.toString().padEnd(7)} ` +
      `${(c.id_prime || '').toString().padEnd(10)} ` +
      `${(c.nome_completo || '').substring(0, 30).padEnd(30)} ` +
      `${(c.email || '').substring(0, 28).padEnd(28)} ` +
      `${(c.whatsapp || '').padEnd(14)} ` +
      `${(c.cpf || '').padEnd(12)} ` +
      `${c.qualidade_dados}/100`
    );
  });

  console.log('\nPara exportar para CSV:');
  console.log('  node relatorios-clientes.cjs exportar-prime');

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

async function exportarApenasSprint() {
  console.log('\n📥 Exportando clientes APENAS NO SPRINT...');

  const { data } = await supabase
    .from('clientes_apenas_sprint')
    .select('*');

  const filename = `clientes_apenas_sprint_${new Date().toISOString().split('T')[0]}.csv`;

  const csv = [
    'id,id_sprinthub,nome_completo,email,whatsapp,cpf,data_nascimento,endereco_rua,cidade,estado,qualidade_dados',
    ...data.map(c =>
      `${c.id},${c.id_sprinthub || ''},"${c.nome_completo || ''}","${c.email || ''}",${c.whatsapp || ''},${c.cpf || ''},${c.data_nascimento || ''},"${c.endereco_rua || ''}","${c.cidade || '"}","${c.estado || ''}",${c.qualidade_dados}`
    )
  ].join('\n');

  fs.writeFileSync(filename, csv);

  console.log(`✅ Exportado ${data.length.toLocaleString()} clientes para: ${filename}\n`);
}

async function exportarApenasPrime() {
  console.log('\n📥 Exportando clientes APENAS NO PRIME...');

  const { data } = await supabase
    .from('clientes_apenas_prime')
    .select('*');

  const filename = `clientes_apenas_prime_${new Date().toISOString().split('T')[0]}.csv`;

  const csv = [
    'id,id_prime,nome_completo,email,whatsapp,cpf,data_nascimento,endereco_rua,cidade,estado,qualidade_dados',
    ...data.map(c =>
      `${c.id},${c.id_prime || ''},"${c.nome_completo || ''}","${c.email || ''}",${c.whatsapp || ''},${c.cpf || ''},${c.data_nascimento || ''},"${c.endereco_rua || ''}","${c.cidade || '"}","${c.estado || '"}",${c.qualidade_dados}`
    )
  ].join('\n');

  fs.writeFileSync(filename, csv);

  console.log(`✅ Exportado ${data.length.toLocaleString()} clientes para: ${filename}\n`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    switch (comando) {
      case 'dashboard':
        await dashboardCompleto();
        break;

      case 'completude':
        await completudeDados();
        break;

      case 'origens':
        await analiseOrigens();
        break;

      case 'apenas-sprint':
        await listaApenasSprit();
        break;

      case 'apenas-prime':
        await listaApenasPrime();
        break;

      case 'exportar-sprint':
        await exportarApenasSprint();
        break;

      case 'exportar-prime':
        await exportarApenasPrime();
        break;

      case 'help':
      case '--help':
      case '-h':
        console.log('\nUso:');
        console.log('  node relatorios-clientes.cjs [comando]\n');
        console.log('Comandos:');
        console.log('  dashboard          - Dashboard completo (padrão)');
        console.log('  completude         - Completude dos dados');
        console.log('  origens            - Análise de origens Sprint/Prime');
        console.log('  apenas-sprint      - Lista clientes só no Sprint');
        console.log('  apenas-prime       - Lista clientes só no Prime');
        console.log('  exportar-sprint    - Exportar CSV apenas Sprint');
        console.log('  exportar-prime     - Exportar CSV apenas Prime');
        console.log('');
        break;

      default:
        console.log(`\n❌ Comando desconhecido: ${comando}`);
        console.log('Use: node relatorios-clientes.cjs help\n');
    }

  } catch (error) {
    console.error(`\n❌ Erro: ${error.message}\n`);
    process.exit(1);
  }
}

main();
