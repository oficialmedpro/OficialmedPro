#!/usr/bin/env node

/**
 * ============================================================================
 * CONSOLIDAÇÃO INTELIGENTE DE DADOS - Script de Produção
 * ============================================================================
 *
 * Consolida dados de múltiplas fontes na tabela clientes_mestre
 *
 * Fontes:
 * 1. leads (SprintHub) - 76k registros - ALTA prioridade
 * 2. greatpage_leads - 27k registros - ALTA prioridade
 * 3. blacklabs - 6k registros - ALTA prioridade
 * 4. prime_clientes - 37k registros - BAIXA prioridade (dados ruins)
 *
 * Total: ~148k registros
 * ============================================================================
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

const stats = {
  processados: 0,
  novos: 0,
  atualizados: 0,
  erros: 0,
  semChave: 0,
  porFonte: {
    sprinthub: 0,
    google: 0,
    blacklabs: 0,
    prime: 0
  },
  startTime: Date.now()
};

const LOG_FILE = 'consolidacao.log';

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function log(msg) {
  const ts = new Date().toISOString();
  const message = `[${ts}] ${msg}`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

function normalizarTelefone(telefone) {
  if (!telefone) return null;
  let num = telefone.toString().replace(/\D/g, '');
  if (num.startsWith('55')) num = num.substring(2);
  if (num.length < 10 || num.length > 11) return null;
  return num;
}

function normalizarCPF(cpf) {
  if (!cpf) return null;
  const num = cpf.toString().replace(/\D/g, '');
  if (num.length !== 11) return null; // CPF deve ter 11 dígitos
  return num;
}

function gerarChave(cpf, telefone) {
  const cpfNorm = normalizarCPF(cpf);
  const telNorm = normalizarTelefone(telefone);

  if (cpfNorm && telNorm) return `CPF:${cpfNorm}|TEL:${telNorm}`;
  if (cpfNorm) return `CPF:${cpfNorm}`;
  if (telNorm) return `TEL:${telNorm}`;

  return null;
}

function nomeEhRuim(nome) {
  if (!nome || nome === '') return true;
  if (nome === '...') return true;
  if (/^\d{8,}$/.test(nome)) return true; // Telefone como nome
  return false;
}

function calcularQualidade(cliente) {
  let score = 0;
  if (cliente.nome_completo && !nomeEhRuim(cliente.nome_completo)) score += 20;
  if (cliente.whatsapp) score += 20;
  if (cliente.email) score += 20;
  if (cliente.cpf) score += 10;
  if (cliente.rg) score += 10;
  if (cliente.endereco_rua && cliente.cidade && cliente.estado) score += 10;
  if (cliente.data_nascimento) score += 5;
  if (cliente.sexo) score += 5;
  return score;
}

// ============================================================================
// BUSCA E MERGE
// ============================================================================

async function buscarClienteExistente(chave, cpf, email, whatsapp) {
  try {
    if (!chave && !cpf && !email && !whatsapp) return null;

    const conditions = [];
    if (chave) conditions.push(`chave_identificacao.eq.${chave}`);
    if (cpf) conditions.push(`cpf.eq.${normalizarCPF(cpf)}`);
    if (email) conditions.push(`email.eq.${email}`);
    if (whatsapp) conditions.push(`whatsapp.eq.${normalizarTelefone(whatsapp)}`);

    const { data, error } = await supabase
      .from('clientes_mestre')
      .select('*')
      .or(conditions.join(','))
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;

  } catch (error) {
    log(`⚠️ Erro ao buscar cliente: ${error.message}`);
    return null;
  }
}

function mesclarDados(clienteExistente, novosDados, fonte) {
  const prioridadeAlta = ['sprinthub', 'blacklabs', 'google'];
  const fonteEhAlta = prioridadeAlta.includes(fonte);

  const mesclado = { ...clienteExistente };

  // Nome: priorizar fontes de alta qualidade
  if (fonteEhAlta && novosDados.nome_completo && !nomeEhRuim(novosDados.nome_completo)) {
    if (!mesclado.nome_completo || nomeEhRuim(mesclado.nome_completo)) {
      mesclado.nome_completo = novosDados.nome_completo;
    }
  }

  // Nome do Prime: SEMPRE salvar separadamente
  if (fonte === 'prime' && novosDados.nome_completo) {
    mesclado.nome_cliente_prime = novosDados.nome_completo;
    if (!mesclado.nome_completo && !nomeEhRuim(novosDados.nome_completo)) {
      mesclado.nome_completo = novosDados.nome_completo;
    }
  }

  // Email: preencher se vazio ou fonte é de alta prioridade
  if (novosDados.email) {
    if (!mesclado.email || fonteEhAlta) {
      mesclado.email = novosDados.email;
    }
  }

  // WhatsApp/Telefone
  if (novosDados.whatsapp && !mesclado.whatsapp) {
    mesclado.whatsapp = normalizarTelefone(novosDados.whatsapp);
  }
  if (novosDados.telefone && !mesclado.telefone) {
    mesclado.telefone = novosDados.telefone;
  }

  // CPF/RG
  if (novosDados.cpf && !mesclado.cpf) {
    mesclado.cpf = normalizarCPF(novosDados.cpf);
  }
  if (novosDados.rg && !mesclado.rg) {
    mesclado.rg = novosDados.rg;
  }

  // Endereço: preencher se vazio
  if (novosDados.endereco_rua && !mesclado.endereco_rua) {
    mesclado.endereco_rua = novosDados.endereco_rua;
    mesclado.endereco_numero = novosDados.endereco_numero;
    mesclado.endereco_complemento = novosDados.endereco_complemento;
    mesclado.bairro = novosDados.bairro;
    mesclado.cidade = novosDados.cidade;
    mesclado.estado = novosDados.estado;
    mesclado.cep = novosDados.cep;
  }

  // Data nascimento, sexo
  if (novosDados.data_nascimento && !mesclado.data_nascimento) {
    mesclado.data_nascimento = novosDados.data_nascimento;
  }
  if (novosDados.sexo && !mesclado.sexo) {
    mesclado.sexo = novosDados.sexo;
  }

  // Adicionar origem
  if (!mesclado.origem_marcas) mesclado.origem_marcas = [];
  if (!mesclado.origem_marcas.includes(fonte)) {
    mesclado.origem_marcas.push(fonte);
  }

  // Atualizar foreign key
  const fkMap = {
    sprinthub: 'id_sprinthub',
    prime: 'id_prime',
    google: 'id_greatpage',
    blacklabs: 'id_blacklabs'
  };

  if (fkMap[fonte] && novosDados.id_original) {
    mesclado[fkMap[fonte]] = novosDados.id_original;
  }

  mesclado.qualidade_dados = calcularQualidade(mesclado);
  mesclado.data_ultima_atualizacao = new Date().toISOString();

  return mesclado;
}

// ============================================================================
// PROCESSAMENTO POR FONTE
// ============================================================================

async function processarLeadsSprintHub() {
  log('\n📊 Processando leads do SprintHub...');

  // Buscar TODOS os registros (sem limite de 1000)
  let allLeads = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, firstname, lastname, email, whatsapp, phone, mobile, cpf, rg, data_de_nascimento, sexo, address, numero_entrega, complemento, bairro, city, state, zipcode')
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    allLeads = allLeads.concat(leads);
    hasMore = leads.length === pageSize;
    page++;

    if (hasMore) {
      log(`📥 Buscando leads: ${allLeads.length} carregados...`);
    }
  }

  const leads = allLeads;
  log(`📥 Total de ${leads.length} leads do SprintHub para processar`);

  for (const lead of leads) {
    try {
      const chave = gerarChave(lead.cpf, lead.whatsapp);
      if (!chave) stats.semChave++;

      const clienteExistente = await buscarClienteExistente(
        chave,
        lead.cpf,
        lead.email,
        lead.whatsapp
      );

      const dadosNormalizados = {
        id_original: lead.id,
        nome_completo: lead.firstname && lead.lastname
          ? `${lead.firstname} ${lead.lastname}`.trim()
          : lead.firstname || null,
        email: lead.email,
        whatsapp: lead.whatsapp,
        telefone: lead.phone || lead.mobile,
        cpf: lead.cpf,
        rg: lead.rg,
        data_nascimento: lead.data_de_nascimento,
        sexo: lead.sexo,
        endereco_rua: lead.address,
        endereco_numero: lead.numero_entrega,
        endereco_complemento: lead.complemento,
        bairro: lead.bairro,
        cidade: lead.city,
        estado: lead.state,
        cep: lead.zipcode
      };

      if (clienteExistente) {
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'sprinthub');
        await supabase.from('clientes_mestre').update(mesclado).eq('id', clienteExistente.id);
        stats.atualizados++;
      } else {
        const novoCliente = {
          chave_identificacao: chave,
          ...dadosNormalizados,
          id_sprinthub: lead.id,
          origem_marcas: ['sprinthub'],
          qualidade_dados: calcularQualidade(dadosNormalizados),
          data_primeira_captura: new Date().toISOString()
        };
        delete novoCliente.id_original;
        await supabase.from('clientes_mestre').insert(novoCliente);
        stats.novos++;
      }

      stats.processados++;
      stats.porFonte.sprinthub++;

      if (stats.processados % 500 === 0) {
        log(`✅ Sprint: ${stats.porFonte.sprinthub} | Total: ${stats.processados} (${stats.novos} novos, ${stats.atualizados} atualizados)`);
      }

    } catch (error) {
      log(`❌ Erro lead ${lead.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ SprintHub concluído: ${stats.porFonte.sprinthub} leads`);
}

async function processarGreatPage() {
  log('\n📊 Processando leads do GreatPage...');

  // Buscar TODOS os registros (sem limite de 1000)
  let allLeads = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: leads, error } = await supabase
      .from('greatpage_leads')
      .select('id, nome_completo, email, telefone, cidade_usuario, regiao_usuario')
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    allLeads = allLeads.concat(leads);
    hasMore = leads.length === pageSize;
    page++;
  }

  const leads = allLeads;
  log(`📥 Total de ${leads.length} leads do GreatPage para processar`);

  for (const lead of leads) {
    try {
      const chave = gerarChave(null, lead.telefone);
      if (!chave) stats.semChave++;

      const clienteExistente = await buscarClienteExistente(
        chave,
        null,
        lead.email,
        lead.telefone
      );

      const dadosNormalizados = {
        id_original: lead.id,
        nome_completo: lead.nome_completo,
        email: lead.email,
        whatsapp: lead.telefone,
        cidade: lead.cidade_usuario,
        estado: lead.regiao_usuario
      };

      if (clienteExistente) {
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'google');
        await supabase.from('clientes_mestre').update(mesclado).eq('id', clienteExistente.id);
        stats.atualizados++;
      } else {
        const novoCliente = {
          chave_identificacao: chave,
          ...dadosNormalizados,
          id_greatpage: lead.id,
          origem_marcas: ['google'],
          qualidade_dados: calcularQualidade(dadosNormalizados),
          data_primeira_captura: new Date().toISOString()
        };
        delete novoCliente.id_original;
        await supabase.from('clientes_mestre').insert(novoCliente);
        stats.novos++;
      }

      stats.processados++;
      stats.porFonte.google++;

      if (stats.processados % 500 === 0) {
        log(`✅ GreatPage: ${stats.porFonte.google} | Total: ${stats.processados}`);
      }

    } catch (error) {
      log(`❌ Erro greatpage ${lead.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ GreatPage concluído: ${stats.porFonte.google} leads`);
}

async function processarBlackLabs() {
  log('\n📊 Processando leads do BlackLabs...');

  // Buscar TODOS os registros (sem limite de 1000)
  let allLeads = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: leads, error } = await supabase
      .from('blacklabs')
      .select('id, cliente, cpf, email, telefone, rua_entrega, numero_entrega, bairro, complemento, cidade, estado, cep')
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    allLeads = allLeads.concat(leads);
    hasMore = leads.length === pageSize;
    page++;
  }

  const leads = allLeads;
  log(`📥 Total de ${leads.length} leads do BlackLabs para processar`);

  for (const lead of leads) {
    try {
      const chave = gerarChave(lead.cpf, lead.telefone);
      if (!chave) stats.semChave++;

      const clienteExistente = await buscarClienteExistente(
        chave,
        lead.cpf,
        lead.email,
        lead.telefone
      );

      const dadosNormalizados = {
        id_original: lead.id,
        nome_completo: lead.cliente,
        cpf: lead.cpf,
        email: lead.email,
        whatsapp: lead.telefone,
        endereco_rua: lead.rua_entrega,
        endereco_numero: lead.numero_entrega,
        bairro: lead.bairro,
        endereco_complemento: lead.complemento,
        cidade: lead.cidade,
        estado: lead.estado,
        cep: lead.cep
      };

      if (clienteExistente) {
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'blacklabs');
        await supabase.from('clientes_mestre').update(mesclado).eq('id', clienteExistente.id);
        stats.atualizados++;
      } else {
        const novoCliente = {
          chave_identificacao: chave,
          ...dadosNormalizados,
          id_blacklabs: lead.id,
          origem_marcas: ['blacklabs'],
          qualidade_dados: calcularQualidade(dadosNormalizados),
          data_primeira_captura: new Date().toISOString()
        };
        delete novoCliente.id_original;
        await supabase.from('clientes_mestre').insert(novoCliente);
        stats.novos++;
      }

      stats.processados++;
      stats.porFonte.blacklabs++;

      if (stats.processados % 500 === 0) {
        log(`✅ BlackLabs: ${stats.porFonte.blacklabs} | Total: ${stats.processados}`);
      }

    } catch (error) {
      log(`❌ Erro blacklabs ${lead.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ BlackLabs concluído: ${stats.porFonte.blacklabs} leads`);
}

async function processarPrime() {
  log('\n📊 Processando clientes do Prime (BAIXA prioridade - dados ruins)...');

  // Buscar TODOS os registros (sem limite de 1000)
  let allClientes = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: clientes, error } = await supabase
      .from('prime_clientes')
      .select('id, nome, cpf_cnpj, data_nascimento, sexo, email, telefone, endereco_logradouro, endereco_numero, endereco_cep, endereco_cidade, endereco_estado, endereco_observacao')
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    allClientes = allClientes.concat(clientes);
    hasMore = clientes.length === pageSize;
    page++;
  }

  const clientes = allClientes;
  log(`📥 Total de ${clientes.length} clientes do Prime para processar`);

  for (const cliente of clientes) {
    try {
      const chave = gerarChave(cliente.cpf_cnpj, cliente.telefone);
      if (!chave) stats.semChave++;

      const clienteExistente = await buscarClienteExistente(
        chave,
        cliente.cpf_cnpj,
        cliente.email,
        cliente.telefone
      );

      const dadosNormalizados = {
        id_original: cliente.id,
        nome_completo: cliente.nome,
        cpf: cliente.cpf_cnpj,
        data_nascimento: cliente.data_nascimento,
        sexo: cliente.sexo,
        email: cliente.email,
        whatsapp: cliente.telefone,
        endereco_rua: cliente.endereco_logradouro,
        endereco_numero: cliente.endereco_numero,
        cep: cliente.endereco_cep,
        cidade: cliente.endereco_cidade,
        estado: cliente.endereco_estado,
        endereco_complemento: cliente.endereco_observacao
      };

      if (clienteExistente) {
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'prime');
        await supabase.from('clientes_mestre').update(mesclado).eq('id', clienteExistente.id);
        stats.atualizados++;
      } else {
        const novoCliente = {
          chave_identificacao: chave,
          ...dadosNormalizados,
          nome_cliente_prime: cliente.nome,
          nome_completo: nomeEhRuim(cliente.nome) ? null : cliente.nome,
          id_prime: cliente.id,
          origem_marcas: ['prime'],
          qualidade_dados: calcularQualidade(dadosNormalizados),
          data_primeira_captura: new Date().toISOString()
        };
        delete novoCliente.id_original;
        await supabase.from('clientes_mestre').insert(novoCliente);
        stats.novos++;
      }

      stats.processados++;
      stats.porFonte.prime++;

      if (stats.processados % 500 === 0) {
        log(`✅ Prime: ${stats.porFonte.prime} | Total: ${stats.processados}`);
      }

    } catch (error) {
      log(`❌ Erro prime ${cliente.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ Prime concluído: ${stats.porFonte.prime} clientes`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('🚀 CONSOLIDAÇÃO DE DADOS - INÍCIO');
  log('='.repeat(60));

  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

  try {
    // Processar em ordem de prioridade
    await processarLeadsSprintHub(); // ALTA
    await processarGreatPage();      // ALTA
    await processarBlackLabs();      // ALTA
    await processarPrime();          // BAIXA

    const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

    log('\n' + '='.repeat(60));
    log('✅ CONSOLIDAÇÃO CONCLUÍDA!');
    log('='.repeat(60));
    log(`⏱️  Tempo total: ${duration} minutos`);
    log(`📊 Total processado: ${stats.processados}`);
    log(`✨ Novos clientes: ${stats.novos}`);
    log(`🔄 Atualizados: ${stats.atualizados}`);
    log(`❌ Erros: ${stats.erros}`);
    log(`⚠️  Sem chave única: ${stats.semChave}`);
    log('');
    log('📈 Por fonte:');
    log(`   SprintHub: ${stats.porFonte.sprinthub}`);
    log(`   GreatPage: ${stats.porFonte.google}`);
    log(`   BlackLabs: ${stats.porFonte.blacklabs}`);
    log(`   Prime: ${stats.porFonte.prime}`);
    log('='.repeat(60));

    // Estatísticas finais
    const { data: statsFinais } = await supabase
      .from('clientes_mestre')
      .select('qualidade_dados, origem_marcas');

    if (statsFinais) {
      const qualidadeMedia = statsFinais.reduce((sum, c) => sum + (c.qualidade_dados || 0), 0) / statsFinais.length;
      const multiplasOrigens = statsFinais.filter(c => c.origem_marcas && c.origem_marcas.length > 1).length;
      const altaQualidade = statsFinais.filter(c => c.qualidade_dados >= 80).length;

      log('');
      log('📊 Estatísticas da Base Consolidada:');
      log(`   Total de clientes: ${statsFinais.length}`);
      log(`   Qualidade média: ${qualidadeMedia.toFixed(1)}/100`);
      log(`   Alta qualidade (≥80): ${altaQualidade} (${((altaQualidade/statsFinais.length)*100).toFixed(1)}%)`);
      log(`   Múltiplas origens: ${multiplasOrigens} (${((multiplasOrigens/statsFinais.length)*100).toFixed(1)}%)`);
    }

  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
