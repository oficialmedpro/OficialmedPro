#!/usr/bin/env node

/**
 * ============================================================================
 * CONSOLIDAÇÃO INTELIGENTE DE DADOS - Script Principal
 * ============================================================================
 *
 * Este script consolida dados de múltiplas fontes na tabela clientes_mestre
 *
 * Fontes processadas:
 * 1. leads (SprintHub) - Prioridade ALTA
 * 2. greatpage_leads - Prioridade ALTA
 * 3. blacklabs - Prioridade ALTA
 * 4. prime_clientes - Prioridade BAIXA (dados ruins)
 *
 * Estratégia:
 * - Deduplicação por CPF + telefone normalizado
 * - Hierarquia de qualidade de dados
 * - Tratamento especial para dados do Prime
 *
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

  // Remove tudo exceto números
  let num = telefone.replace(/\D/g, '');

  // Remove DDI 55 se presente
  if (num.startsWith('55')) {
    num = num.substring(2);
  }

  // Validar: deve ter 10 ou 11 dígitos
  if (num.length < 10 || num.length > 11) {
    return null;
  }

  return num;
}

function normalizarCPF(cpf) {
  if (!cpf) return null;
  return cpf.replace(/\D/g, '');
}

function gerarChave(cpf, telefone) {
  const cpfNorm = normalizarCPF(cpf);
  const telNorm = normalizarTelefone(telefone);

  // Prioridade: CPF + Tel > CPF > Tel
  if (cpfNorm && telNorm) {
    return `CPF:${cpfNorm}|TEL:${telNorm}`;
  }
  if (cpfNorm) {
    return `CPF:${cpfNorm}`;
  }
  if (telNorm) {
    return `TEL:${telNorm}`;
  }

  return null; // Sem chave única
}

function nomeEhRuim(nome) {
  if (!nome || nome === '') return true;
  if (nome === '...') return true;
  // Telefone como nome (8+ dígitos seguidos)
  if (/^\d{8,}$/.test(nome)) return true;
  return false;
}

function calcularQualidade(cliente) {
  let score = 0;

  // Campos essenciais (60 pontos)
  if (cliente.nome_completo && !nomeEhRuim(cliente.nome_completo)) score += 20;
  if (cliente.whatsapp) score += 20;
  if (cliente.email) score += 20;

  // Documentos (20 pontos)
  if (cliente.cpf) score += 10;
  if (cliente.rg) score += 10;

  // Endereço completo (10 pontos)
  if (cliente.endereco_rua && cliente.cidade && cliente.estado) score += 10;

  // Data nascimento (5 pontos)
  if (cliente.data_nascimento) score += 5;

  // Sexo (5 pontos)
  if (cliente.sexo) score += 5;

  return score;
}

// ============================================================================
// BUSCA E MERGE
// ============================================================================

async function buscarClienteExistente(chave, cpf, email, whatsapp) {
  const whatsappNorm = normalizarTelefone(whatsapp);

  // Buscar por múltiplos critérios
  const { data, error } = await supabase
    .from('clientes_mestre')
    .select('*')
    .or(`chave_identificacao.eq.${chave},cpf.eq.${cpf},email.eq.${email},whatsapp.eq.${whatsappNorm}`)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = não encontrado, OK
    throw error;
  }

  return data; // null se não encontrou
}

function mesclarDados(clienteExistente, novosDados, fonte) {
  // Hierarquia de qualidade:
  // Alta: sprinthub, blacklabs, google
  // Baixa: prime

  const prioridadeAlta = ['sprinthub', 'blacklabs', 'google'];
  const fonteEhAlta = prioridadeAlta.includes(fonte);

  const mesclado = { ...clienteExistente };

  // Nome: só sobrescrever se fonte for de alta prioridade
  if (fonteEhAlta && novosDados.nome_completo && !nomeEhRuim(novosDados.nome_completo)) {
    if (!mesclado.nome_completo || nomeEhRuim(mesclado.nome_completo)) {
      mesclado.nome_completo = novosDados.nome_completo;
    }
  }

  // Nome do Prime: SEMPRE salvar separadamente
  if (fonte === 'prime' && novosDados.nome_completo) {
    mesclado.nome_cliente_prime = novosDados.nome_completo;
    // Só usar se não tiver nome melhor E nome do Prime for bom
    if (!mesclado.nome_completo && !nomeEhRuim(novosDados.nome_completo)) {
      mesclado.nome_completo = novosDados.nome_completo;
    }
  }

  // Email: priorizar fontes de alta qualidade
  if (fonteEhAlta && novosDados.email) {
    if (!mesclado.email) {
      mesclado.email = novosDados.email;
    }
  } else if (!mesclado.email) {
    mesclado.email = novosDados.email;
  }

  // WhatsApp: sempre atualizar se vazio
  if (novosDados.whatsapp && !mesclado.whatsapp) {
    mesclado.whatsapp = normalizarTelefone(novosDados.whatsapp);
  }

  // CPF/RG: sempre preencher se vazio
  if (novosDados.cpf && !mesclado.cpf) {
    mesclado.cpf = normalizarCPF(novosDados.cpf);
  }
  if (novosDados.rg && !mesclado.rg) {
    mesclado.rg = novosDados.rg;
  }

  // Endereço: priorizar Sprint e Prime
  if ((fonte === 'sprinthub' || fonte === 'prime') && novosDados.endereco_rua) {
    if (!mesclado.endereco_rua) {
      mesclado.endereco_rua = novosDados.endereco_rua;
      mesclado.endereco_numero = novosDados.endereco_numero;
      mesclado.endereco_complemento = novosDados.endereco_complemento;
      mesclado.bairro = novosDados.bairro;
      mesclado.cidade = novosDados.cidade;
      mesclado.estado = novosDados.estado;
      mesclado.cep = novosDados.cep;
    }
  }

  // Data nascimento, sexo: preencher se vazio
  if (novosDados.data_nascimento && !mesclado.data_nascimento) {
    mesclado.data_nascimento = novosDados.data_nascimento;
  }
  if (novosDados.sexo && !mesclado.sexo) {
    mesclado.sexo = novosDados.sexo;
  }

  // Adicionar origem se não existe
  if (!mesclado.origem_marcas) {
    mesclado.origem_marcas = [];
  }
  if (!mesclado.origem_marcas.includes(fonte)) {
    mesclado.origem_marcas.push(fonte);
  }

  // Atualizar foreign key correspondente
  const fkMap = {
    sprinthub: 'id_sprinthub',
    prime: 'id_prime',
    google: 'id_greatpage',
    blacklabs: 'id_blacklabs'
  };

  if (fkMap[fonte]) {
    mesclado[fkMap[fonte]] = novosDados.id_original;
  }

  // Recalcular qualidade
  mesclado.qualidade_dados = calcularQualidade(mesclado);
  mesclado.data_ultima_atualizacao = new Date().toISOString();

  return mesclado;
}

// ============================================================================
// PROCESSAMENTO POR FONTE
// ============================================================================

async function processarLeadsSprintHub() {
  log('📊 Processando leads do SprintHub...');

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('id');

  if (error) throw error;

  for (const lead of leads) {
    try {
      const chave = gerarChave(lead.cpf, lead.whatsapp);

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
        data_nascimento: lead.data_nascimento,
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
        // Atualizar
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'sprinthub');

        await supabase
          .from('clientes_mestre')
          .update(mesclado)
          .eq('id', clienteExistente.id);

        stats.atualizados++;
      } else {
        // Inserir novo
        const novoCliente = {
          chave_identificacao: chave,
          ...dadosNormalizados,
          id_sprinthub: lead.id,
          origem_marcas: ['sprinthub'],
          qualidade_dados: calcularQualidade(dadosNormalizados),
          data_primeira_captura: new Date().toISOString()
        };

        // Remover id_original antes de inserir
        delete novoCliente.id_original;

        await supabase
          .from('clientes_mestre')
          .insert(novoCliente);

        stats.novos++;
      }

      stats.processados++;
      stats.porFonte.sprinthub++;

      if (stats.processados % 100 === 0) {
        log(`✅ SprintHub: ${stats.processados} processados (${stats.novos} novos, ${stats.atualizados} atualizados)`);
      }

    } catch (error) {
      log(`❌ Erro ao processar lead ${lead.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ SprintHub concluído: ${stats.porFonte.sprinthub} leads processados`);
}

async function processarGreatPage() {
  log('📊 Processando leads do GreatPage...');

  const { data: leads, error } = await supabase
    .from('greatpage_leads')
    .select('*')
    .order('id');

  if (error) throw error;

  for (const lead of leads) {
    try {
      const chave = gerarChave(lead.cpf, lead.whatsapp || lead.telefone);

      const clienteExistente = await buscarClienteExistente(
        chave,
        lead.cpf,
        lead.email,
        lead.whatsapp || lead.telefone
      );

      const dadosNormalizados = {
        id_original: lead.id,
        nome_completo: lead.nome,
        email: lead.email,
        whatsapp: lead.whatsapp || lead.telefone,
        cpf: lead.cpf
        // Adicionar outros campos conforme disponíveis na tabela
      };

      if (clienteExistente) {
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'google');
        await supabase
          .from('clientes_mestre')
          .update(mesclado)
          .eq('id', clienteExistente.id);
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

      if (stats.processados % 100 === 0) {
        log(`✅ GreatPage: ${stats.porFonte.google} processados`);
      }

    } catch (error) {
      log(`❌ Erro ao processar greatpage lead ${lead.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ GreatPage concluído: ${stats.porFonte.google} leads processados`);
}

async function processarPrime() {
  log('📊 Processando clientes do Prime (com tratamento especial)...');

  const { data: clientes, error } = await supabase
    .from('prime_clientes')
    .select('*')
    .order('id');

  if (error) throw error;

  for (const cliente of clientes) {
    try {
      const chave = gerarChave(cliente.cpf, cliente.telefone);

      const clienteExistente = await buscarClienteExistente(
        chave,
        cliente.cpf,
        cliente.email,
        cliente.telefone
      );

      const dadosNormalizados = {
        id_original: cliente.id,
        nome_completo: cliente.nome, // Será tratado por mesclarDados
        email: cliente.email,
        whatsapp: cliente.telefone,
        cpf: cliente.cpf,
        endereco_rua: cliente.endereco,
        cidade: cliente.cidade,
        estado: cliente.estado
        // Adicionar outros campos conforme disponíveis
      };

      if (clienteExistente) {
        const mesclado = mesclarDados(clienteExistente, dadosNormalizados, 'prime');
        await supabase
          .from('clientes_mestre')
          .update(mesclado)
          .eq('id', clienteExistente.id);
        stats.atualizados++;
      } else {
        const novoCliente = {
          chave_identificacao: chave,
          ...dadosNormalizados,
          nome_cliente_prime: cliente.nome,
          // Só usar nome do Prime se não for ruim
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

      if (stats.processados % 100 === 0) {
        log(`✅ Prime: ${stats.porFonte.prime} processados`);
      }

    } catch (error) {
      log(`❌ Erro ao processar prime cliente ${cliente.id}: ${error.message}`);
      stats.erros++;
    }
  }

  log(`✅ Prime concluído: ${stats.porFonte.prime} clientes processados`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('🚀 CONSOLIDAÇÃO DE DADOS - INÍCIO');
  log('='.repeat(60));

  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
  }

  try {
    // Processar fontes em ordem de prioridade
    await processarLeadsSprintHub(); // Alta prioridade
    await processarGreatPage();      // Alta prioridade
    // await processarBlackLabs();   // Alta prioridade - implementar se necessário
    await processarPrime();          // Baixa prioridade

    const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

    log('');
    log('='.repeat(60));
    log('✅ CONSOLIDAÇÃO CONCLUÍDA!');
    log('='.repeat(60));
    log(`⏱️  Tempo total: ${duration} minutos`);
    log(`📊 Total processado: ${stats.processados}`);
    log(`✨ Novos clientes: ${stats.novos}`);
    log(`🔄 Atualizados: ${stats.atualizados}`);
    log(`❌ Erros: ${stats.erros}`);
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

      log('');
      log('📊 Estatísticas da Base Consolidada:');
      log(`   Total de clientes: ${statsFinais.length}`);
      log(`   Qualidade média: ${qualidadeMedia.toFixed(1)}/100`);
      log(`   Clientes com múltiplas origens: ${multiplasOrigens} (${((multiplasOrigens/statsFinais.length)*100).toFixed(1)}%)`);
    }

  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
