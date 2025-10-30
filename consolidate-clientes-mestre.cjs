const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'api'
    }
});

// Função para gerar hash dos dados para detectar mudanças
function generateDataHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('md5').update(dataString).digest('hex');
}

// Função para determinar a chave de identificação
function getIdentificationKey(record) {
    if (record.cpf && record.cpf.trim() !== '') {
        return `cpf_${record.cpf.trim()}`;
    }
    if (record.telefone && record.telefone.trim() !== '') {
        return `tel_${record.telefone.trim()}`;
    }
    if (record.email && record.email.trim() !== '') {
        return `email_${record.email.trim()}`;
    }
    return null;
}

// Função para consolidar dados de diferentes fontes
function consolidateClientData(existingClient, newData, source) {
    const consolidated = { ...existingClient };
    
    // Atualizar campos básicos se não existirem ou se novos dados forem mais completos
    if (!consolidated.nome_completo && newData.nome_completo) {
        consolidated.nome_completo = newData.nome_completo;
    }
    if (!consolidated.email && newData.email) {
        consolidated.email = newData.email;
    }
    if (!consolidated.telefone && newData.telefone) {
        consolidated.telefone = newData.telefone;
    }
    if (!consolidated.cpf && newData.cpf) {
        consolidated.cpf = newData.cpf;
    }
    
    // Atualizar endereço se não existir
    if (!consolidated.endereco_cidade && newData.endereco_cidade) {
        consolidated.endereco_cidade = newData.endereco_cidade;
    }
    if (!consolidated.endereco_estado && newData.endereco_estado) {
        consolidated.endereco_estado = newData.endereco_estado;
    }
    
    // Adicionar fonte aos dados consolidados
    if (!consolidated.fontes_dados) {
        consolidated.fontes_dados = [];
    }
    if (!consolidated.fontes_dados.includes(source)) {
        consolidated.fontes_dados.push(source);
    }
    
    // Atualizar campos específicos da fonte
    Object.keys(newData).forEach(key => {
        if (newData[key] && newData[key] !== '') {
            consolidated[key] = newData[key];
        }
    });
    
    // Atualizar timestamps
    consolidated.updated_at = new Date().toISOString();
    consolidated.data_ultima_atualizacao_leads = new Date().toISOString();
    
    return consolidated;
}

// Função para processar dados da tabela prime_clientes
async function processPrimeClientes() {
    console.log('🔄 Processando prime_clientes...');
    
    const { data: primeClientes, error } = await supabase
        .from('prime_clientes')
        .select('*');
    
    if (error) {
        console.error('❌ Erro ao buscar prime_clientes:', error);
        return { processed: 0, inserted: 0, updated: 0, errors: 0 };
    }
    
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const cliente of primeClientes) {
        try {
            const identificationKey = getIdentificationKey({
                cpf: cliente.cpf_cnpj,
                telefone: cliente.telefone,
                email: cliente.email
            });
            
            if (!identificationKey) {
                errors++;
                continue;
            }
            
            const clientData = {
                nome_completo: cliente.nome,
                cpf: cliente.cpf_cnpj,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco_logradouro: cliente.endereco_logradouro,
                endereco_numero: cliente.endereco_numero,
                endereco_cep: cliente.endereco_cep,
                endereco_cidade: cliente.endereco_cidade,
                endereco_estado: cliente.endereco_estado,
                endereco_observacao: cliente.endereco_observacao,
                data_nascimento: cliente.data_nascimento,
                sexo: cliente.sexo,
                codigo_cliente_original: cliente.codigo_cliente_original,
                total_orcamentos: cliente.total_orcamentos,
                total_orcamentos_aprovados: cliente.total_orcamentos_aprovados,
                total_orcamentos_entregues: cliente.total_orcamentos_entregues,
                valor_total_orcamentos: cliente.valor_total_orcamentos,
                valor_total_aprovados: cliente.valor_total_aprovados,
                valor_total_entregues: cliente.valor_total_entregues,
                valor_medio_orcamento: cliente.valor_medio_orcamento,
                valor_medio_aprovado: cliente.valor_medio_aprovado,
                valor_medio_entregue: cliente.valor_medio_entregue,
                primeira_compra: cliente.primeira_compra,
                ultima_compra: cliente.ultima_compra,
                ativo: cliente.ativo,
                score_rfv: cliente.score_rfv,
                chave_identificacao: identificationKey,
                fontes_dados: ['prime_clientes']
            };
            
            // Gerar hash após definir clientData
            clientData.hash_dados_leads = generateDataHash(clientData);
            
            // Verificar se cliente já existe
            const { data: existingClient } = await supabase
                .from('clientes_mestre')
                .select('*')
                .eq('chave_identificacao', identificationKey)
                .single();
            
            if (existingClient) {
                // Atualizar cliente existente
                const consolidatedData = consolidateClientData(existingClient, clientData, 'prime_clientes');
                const { error: updateError } = await supabase
                    .from('clientes_mestre')
                    .update(consolidatedData)
                    .eq('id', existingClient.id);
                
                if (updateError) {
                    console.error('❌ Erro ao atualizar cliente:', updateError);
                    errors++;
                } else {
                    updated++;
                }
            } else {
                // Inserir novo cliente
                const { error: insertError } = await supabase
                    .from('clientes_mestre')
                    .insert(clientData);
                
                if (insertError) {
                    console.error('❌ Erro ao inserir cliente:', insertError);
                    errors++;
                } else {
                    inserted++;
                }
            }
            
            processed++;
        } catch (err) {
            console.error('❌ Erro ao processar cliente:', err);
            errors++;
        }
    }
    
    return { processed, inserted, updated, errors };
}

// Função para processar dados da tabela greatpage_leads
async function processGreatpageLeads() {
    console.log('🔄 Processando greatpage_leads...');
    
    const { data: greatpageLeads, error } = await supabase
        .from('greatpage_leads')
        .select('*');
    
    if (error) {
        console.error('❌ Erro ao buscar greatpage_leads:', error);
        return { processed: 0, inserted: 0, updated: 0, errors: 0 };
    }
    
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const lead of greatpageLeads) {
        try {
            const identificationKey = getIdentificationKey({
                email: lead.email,
                telefone: lead.telefone
            });
            
            if (!identificationKey) {
                errors++;
                continue;
            }
            
            const clientData = {
                nome_completo: lead.nome_completo,
                email: lead.email,
                telefone: lead.telefone,
                politicas_privacidade: lead.politicas_privacidade,
                referral_source: lead.referral_source,
                dispositivo: lead.dispositivo,
                url: lead.url,
                ip_usuario: lead.ip_usuario,
                data_conversao: lead.data_conversao,
                id_formulario: lead.id_formulario,
                pais_usuario: lead.pais_usuario,
                regiao_usuario: lead.regiao_usuario,
                cidade_usuario: lead.cidade_usuario,
                planilha_tag: lead.planilha_tag,
                chave_identificacao: identificationKey,
                fontes_dados: ['greatpage_leads']
            };
            
            // Gerar hash após definir clientData
            clientData.hash_dados_leads = generateDataHash(clientData);
            
            // Verificar se cliente já existe
            const { data: existingClient } = await supabase
                .from('clientes_mestre')
                .select('*')
                .eq('chave_identificacao', identificationKey)
                .single();
            
            if (existingClient) {
                // Atualizar cliente existente
                const consolidatedData = consolidateClientData(existingClient, clientData, 'greatpage_leads');
                const { error: updateError } = await supabase
                    .from('clientes_mestre')
                    .update(consolidatedData)
                    .eq('id', existingClient.id);
                
                if (updateError) {
                    console.error('❌ Erro ao atualizar cliente:', updateError);
                    errors++;
                } else {
                    updated++;
                }
            } else {
                // Inserir novo cliente
                const { error: insertError } = await supabase
                    .from('clientes_mestre')
                    .insert(clientData);
                
                if (insertError) {
                    console.error('❌ Erro ao inserir cliente:', insertError);
                    errors++;
                } else {
                    inserted++;
                }
            }
            
            processed++;
        } catch (err) {
            console.error('❌ Erro ao processar lead:', err);
            errors++;
        }
    }
    
    return { processed, inserted, updated, errors };
}

// Função para processar dados da tabela blacklabs
async function processBlacklabs() {
    console.log('🔄 Processando blacklabs...');
    
    const { data: blacklabs, error } = await supabase
        .from('blacklabs')
        .select('*');
    
    if (error) {
        console.error('❌ Erro ao buscar blacklabs:', error);
        return { processed: 0, inserted: 0, updated: 0, errors: 0 };
    }
    
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const cliente of blacklabs) {
        try {
            const identificationKey = getIdentificationKey({
                cpf: cliente.cpf,
                telefone: cliente.telefone,
                email: cliente.email
            });
            
            if (!identificationKey) {
                errors++;
                continue;
            }
            
            const clientData = {
                nome_completo: cliente.cliente,
                cpf: cliente.cpf,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco_logradouro: cliente.rua_entrega,
                endereco_numero: cliente.numero_entrega,
                endereco_complemento: cliente.complemento,
                endereco_bairro: cliente.bairro,
                endereco_cidade: cliente.cidade,
                endereco_estado: cliente.estado,
                endereco_cep: cliente.cep,
                produtos_comprados: cliente.produto,
                chave_identificacao: identificationKey,
                fontes_dados: ['blacklabs']
            };
            
            // Gerar hash após definir clientData
            clientData.hash_dados_leads = generateDataHash(clientData);
            
            // Verificar se cliente já existe
            const { data: existingClient } = await supabase
                .from('clientes_mestre')
                .select('*')
                .eq('chave_identificacao', identificationKey)
                .single();
            
            if (existingClient) {
                // Atualizar cliente existente
                const consolidatedData = consolidateClientData(existingClient, clientData, 'blacklabs');
                const { error: updateError } = await supabase
                    .from('clientes_mestre')
                    .update(consolidatedData)
                    .eq('id', existingClient.id);
                
                if (updateError) {
                    console.error('❌ Erro ao atualizar cliente:', updateError);
                    errors++;
                } else {
                    updated++;
                }
            } else {
                // Inserir novo cliente
                const { error: insertError } = await supabase
                    .from('clientes_mestre')
                    .insert(clientData);
                
                if (insertError) {
                    console.error('❌ Erro ao inserir cliente:', insertError);
                    errors++;
                } else {
                    inserted++;
                }
            }
            
            processed++;
        } catch (err) {
            console.error('❌ Erro ao processar cliente blacklabs:', err);
            errors++;
        }
    }
    
    return { processed, inserted, updated, errors };
}

// Função para registrar log de sincronização
async function logSincronizacao(tabelaOrigem, stats, tempoExecucao) {
    const { error } = await supabase
        .from('log_sincronizacoes')
        .insert({
            tabela_origem: tabelaOrigem,
            registros_processados: stats.processed,
            registros_inseridos: stats.inserted,
            registros_atualizados: stats.updated,
            registros_erro: stats.errors,
            status: stats.errors > 0 ? 'parcial' : 'sucesso',
            tempo_execucao_segundos: tempoExecucao,
            observacoes: `Processados: ${stats.processed}, Inseridos: ${stats.inserted}, Atualizados: ${stats.updated}, Erros: ${stats.errors}`
        });
    
    if (error) {
        console.error('❌ Erro ao registrar log:', error);
    }
}

// Função principal
async function main() {
    console.log('🚀 Iniciando consolidação de clientes mestre...\n');
    
    const startTime = Date.now();
    
    try {
        // Processar cada tabela
        const primeStats = await processPrimeClientes();
        console.log(`✅ Prime Clientes: ${primeStats.processed} processados, ${primeStats.inserted} inseridos, ${primeStats.updated} atualizados, ${primeStats.errors} erros\n`);
        
        const greatpageStats = await processGreatpageLeads();
        console.log(`✅ Greatpage Leads: ${greatpageStats.processed} processados, ${greatpageStats.inserted} inseridos, ${greatpageStats.updated} atualizados, ${greatpageStats.errors} erros\n`);
        
        const blacklabsStats = await processBlacklabs();
        console.log(`✅ Blacklabs: ${blacklabsStats.processed} processados, ${blacklabsStats.inserted} inseridos, ${blacklabsStats.updated} atualizados, ${blacklabsStats.errors} erros\n`);
        
        const endTime = Date.now();
        const tempoExecucao = Math.round((endTime - startTime) / 1000);
        
        // Registrar logs
        await logSincronizacao('prime_clientes', primeStats, tempoExecucao);
        await logSincronizacao('greatpage_leads', greatpageStats, tempoExecucao);
        await logSincronizacao('blacklabs', blacklabsStats, tempoExecucao);
        
        // Resumo final
        const totalProcessed = primeStats.processed + greatpageStats.processed + blacklabsStats.processed;
        const totalInserted = primeStats.inserted + greatpageStats.inserted + blacklabsStats.inserted;
        const totalUpdated = primeStats.updated + greatpageStats.updated + blacklabsStats.updated;
        const totalErrors = primeStats.errors + greatpageStats.errors + blacklabsStats.errors;
        
        console.log('📊 RESUMO FINAL:');
        console.log(`  👥 Total processados: ${totalProcessed}`);
        console.log(`  ✅ Total inseridos: ${totalInserted}`);
        console.log(`  🔄 Total atualizados: ${totalUpdated}`);
        console.log(`  ❌ Total erros: ${totalErrors}`);
        console.log(`  ⏱️  Tempo de execução: ${tempoExecucao} segundos`);
        
        // Verificar total na tabela mestre
        const { data: totalClientes } = await supabase
            .from('clientes_mestre')
            .select('id', { count: 'exact' });
        
        console.log(`  📊 Total de clientes na tabela mestre: ${totalClientes?.length || 0}`);
        
    } catch (error) {
        console.error('❌ Erro durante a consolidação:', error);
    }
}

main().catch(console.error);
