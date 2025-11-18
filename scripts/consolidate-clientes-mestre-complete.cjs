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

// Função para processar dados em lotes grandes
async function processBatch(tableName, batchSize = 1000) {
    console.log(`🔄 Processando ${tableName}...`);
    
    let offset = 0;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    while (true) {
        // Buscar lote de dados
        const { data: records, error } = await supabase
            .from(tableName)
            .select('*')
            .range(offset, offset + batchSize - 1);
        
        if (error) {
            console.error(`❌ Erro ao buscar ${tableName}:`, error);
            break;
        }
        
        if (!records || records.length === 0) {
            break; // Não há mais dados
        }
        
        console.log(`  📦 Processando lote ${Math.floor(offset/batchSize) + 1}: ${records.length} registros`);
        
        // Processar cada registro do lote
        for (const record of records) {
            try {
                let identificationKey;
                let clientData;
                
                if (tableName === 'prime_clientes') {
                    identificationKey = getIdentificationKey({
                        cpf: record.cpf_cnpj,
                        telefone: record.telefone,
                        email: record.email
                    });
                    
                    if (!identificationKey) {
                        totalErrors++;
                        continue;
                    }
                    
                    clientData = {
                        nome_completo: record.nome,
                        cpf: record.cpf_cnpj,
                        email: record.email,
                        telefone: record.telefone,
                        endereco_logradouro: record.endereco_logradouro,
                        endereco_numero: record.endereco_numero,
                        endereco_cep: record.endereco_cep,
                        endereco_cidade: record.endereco_cidade,
                        endereco_estado: record.endereco_estado,
                        endereco_observacao: record.endereco_observacao,
                        data_nascimento: record.data_nascimento,
                        sexo: record.sexo,
                        codigo_cliente_original: record.codigo_cliente_original,
                        total_orcamentos: record.total_orcamentos,
                        total_orcamentos_aprovados: record.total_orcamentos_aprovados,
                        total_orcamentos_entregues: record.total_orcamentos_entregues,
                        valor_total_orcamentos: record.valor_total_orcamentos,
                        valor_total_aprovados: record.valor_total_aprovados,
                        valor_total_entregues: record.valor_total_entregues,
                        valor_medio_orcamento: record.valor_medio_orcamento,
                        valor_medio_aprovado: record.valor_medio_aprovado,
                        valor_medio_entregue: record.valor_medio_entregue,
                        primeira_compra: record.primeira_compra,
                        ultima_compra: record.ultima_compra,
                        ativo: record.ativo,
                        score_rfv: record.score_rfv,
                        chave_identificacao: identificationKey,
                        fontes_dados: ['prime_clientes']
                    };
                } else if (tableName === 'greatpage_leads') {
                    identificationKey = getIdentificationKey({
                        email: record.email,
                        telefone: record.telefone
                    });
                    
                    if (!identificationKey) {
                        totalErrors++;
                        continue;
                    }
                    
                    clientData = {
                        nome_completo: record.nome_completo,
                        email: record.email,
                        telefone: record.telefone,
                        politicas_privacidade: record.politicas_privacidade,
                        referral_source: record.referral_source,
                        dispositivo: record.dispositivo,
                        url: record.url,
                        ip_usuario: record.ip_usuario,
                        data_conversao: record.data_conversao,
                        id_formulario: record.id_formulario,
                        pais_usuario: record.pais_usuario,
                        regiao_usuario: record.regiao_usuario,
                        cidade_usuario: record.cidade_usuario,
                        planilha_tag: record.planilha_tag,
                        chave_identificacao: identificationKey,
                        fontes_dados: ['greatpage_leads']
                    };
                } else if (tableName === 'blacklabs') {
                    identificationKey = getIdentificationKey({
                        cpf: record.cpf,
                        telefone: record.telefone,
                        email: record.email
                    });
                    
                    if (!identificationKey) {
                        totalErrors++;
                        continue;
                    }
                    
                    clientData = {
                        nome_completo: record.cliente,
                        cpf: record.cpf,
                        email: record.email,
                        telefone: record.telefone,
                        endereco_logradouro: record.rua_entrega,
                        endereco_numero: record.numero_entrega,
                        endereco_complemento: record.complemento,
                        endereco_bairro: record.bairro,
                        endereco_cidade: record.cidade,
                        endereco_estado: record.estado,
                        endereco_cep: record.cep,
                        produtos_comprados: record.produto,
                        chave_identificacao: identificationKey,
                        fontes_dados: ['blacklabs']
                    };
                } else if (tableName === 'leads') {
                    identificationKey = getIdentificationKey({
                        cpf: record.cpf,
                        telefone: record.phone || record.whatsapp || record.mobile,
                        email: record.email
                    });
                    
                    if (!identificationKey) {
                        totalErrors++;
                        continue;
                    }
                    
                    clientData = {
                        nome_completo: record.firstname ? `${record.firstname} ${record.lastname || ''}`.trim() : '',
                        primeiro_nome: record.firstname,
                        ultimo_nome: record.lastname,
                        cpf: record.cpf,
                        email: record.email,
                        telefone: record.phone,
                        whatsapp: record.whatsapp,
                        mobile: record.mobile,
                        endereco_logradouro: record.address,
                        endereco_cidade: record.city,
                        endereco_estado: record.state,
                        endereco_pais: record.country,
                        endereco_cep: record.zipcode,
                        endereco_bairro: record.bairro,
                        endereco_complemento: record.complemento,
                        endereco_numero: record.numero_entrega,
                        rua_entrega: record.rua_entrega,
                        company: record.company,
                        points: record.points,
                        owner: record.owner,
                        stage: record.stage,
                        preferred_locale: record.preferred_locale,
                        user_access: record.user_access,
                        department_access: record.department_access,
                        ignore_sub_departments: record.ignore_sub_departments,
                        last_active: record.last_active,
                        created_by: record.created_by,
                        created_by_name: record.created_by_name,
                        created_by_type: record.created_by_type,
                        updated_by: record.updated_by,
                        updated_by_name: record.updated_by_name,
                        third_party_data: record.third_party_data,
                        capital_de_investimento: record.capital_de_investimento,
                        tipo_de_compra: record.tipo_de_compra,
                        pedidos_shopify: record.pedidos_shopify,
                        categoria: record.categoria,
                        classificacao_google: record.classificacao_google,
                        grau_de_interesse: record.grau_de_interesse,
                        star_score: record.star_score,
                        avaliacao_atendente: record.avaliacao_atendente,
                        avaliacao_atendimento: record.avaliacao_atendimento,
                        qualificacao_callix: record.qualificacao_callix,
                        origem: record.origem,
                        origem_manipulacao: record.origem_manipulacao,
                        lista_de_origem: record.lista_de_origem,
                        criativo: record.criativo,
                        plataforma: record.plataforma,
                        redes_sociais: record.redes_sociais,
                        site: record.site,
                        atendente: record.atendente,
                        atendente_atual: record.atendente_atual,
                        feedback: record.feedback,
                        observacao: record.observacao,
                        observacoes_do_lead: record.observacoes_do_lead,
                        comportamento_da_ia: record.comportamento_da_ia,
                        retorno: record.retorno,
                        prescritor: record.prescritor,
                        produto: record.produto,
                        drogaria: record.drograria,
                        data_recompra: record.data_recompra,
                        mes_que_entrou: record.mes_que_entrou,
                        arquivo_receita: record.arquivo_receita,
                        id_t56: record.id_t56,
                        empresa: record.empresa,
                        sexo: record.sexo,
                        data_de_nascimento: record.data_de_nascimento,
                        objetivos_do_cliente: record.objetivos_do_cliente,
                        perfil_do_cliente: record.perfil_do_cliente,
                        recebedor: record.recebedor,
                        whatsapp_remote_lid: record.whatsapp_remote_lid,
                        status: record.status,
                        sh_status: record.sh_status,
                        data_do_contato: record.data_do_contato,
                        segmento: record.segmento,
                        enviado_callix: record.enviado_callix,
                        data_envio_callix: record.data_envio_callix,
                        callix_id: record.callix_id,
                        status_callix: record.status_callix,
                        descricao_formula: record.descricao_formula,
                        data_ultima_compra: record.data_ultima_compra,
                        chave_identificacao: identificationKey,
                        fontes_dados: ['leads']
                    };
                }
                
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
                    const consolidatedData = consolidateClientData(existingClient, clientData, tableName);
                    const { error: updateError } = await supabase
                        .from('clientes_mestre')
                        .update(consolidatedData)
                        .eq('id', existingClient.id);
                    
                    if (updateError) {
                        console.error('❌ Erro ao atualizar cliente:', updateError);
                        totalErrors++;
                    } else {
                        totalUpdated++;
                    }
                } else {
                    // Inserir novo cliente
                    const { error: insertError } = await supabase
                        .from('clientes_mestre')
                        .insert(clientData);
                    
                    if (insertError) {
                        console.error('❌ Erro ao inserir cliente:', insertError);
                        totalErrors++;
                    } else {
                        totalInserted++;
                    }
                }
                
                totalProcessed++;
            } catch (err) {
                console.error('❌ Erro ao processar registro:', err);
                totalErrors++;
            }
        }
        
        offset += batchSize;
    }
    
    return { processed: totalProcessed, inserted: totalInserted, updated: totalUpdated, errors: totalErrors };
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
    console.log('🚀 Iniciando consolidação completa de clientes mestre...\n');
    
    const startTime = Date.now();
    
    try {
        // Processar cada tabela
        const primeStats = await processBatch('prime_clientes');
        console.log(`✅ Prime Clientes: ${primeStats.processed} processados, ${primeStats.inserted} inseridos, ${primeStats.updated} atualizados, ${primeStats.errors} erros\n`);
        
        const greatpageStats = await processBatch('greatpage_leads');
        console.log(`✅ Greatpage Leads: ${greatpageStats.processed} processados, ${greatpageStats.inserted} inseridos, ${greatpageStats.updated} atualizados, ${greatpageStats.errors} erros\n`);
        
        const blacklabsStats = await processBatch('blacklabs');
        console.log(`✅ Blacklabs: ${blacklabsStats.processed} processados, ${blacklabsStats.inserted} inseridos, ${blacklabsStats.updated} atualizados, ${blacklabsStats.errors} erros\n`);
        
        const leadsStats = await processBatch('leads');
        console.log(`✅ Leads: ${leadsStats.processed} processados, ${leadsStats.inserted} inseridos, ${leadsStats.updated} atualizados, ${leadsStats.errors} erros\n`);
        
        const endTime = Date.now();
        const tempoExecucao = Math.round((endTime - startTime) / 1000);
        
        // Registrar logs
        await logSincronizacao('prime_clientes', primeStats, tempoExecucao);
        await logSincronizacao('greatpage_leads', greatpageStats, tempoExecucao);
        await logSincronizacao('blacklabs', blacklabsStats, tempoExecucao);
        await logSincronizacao('leads', leadsStats, tempoExecucao);
        
        // Resumo final
        const totalProcessed = primeStats.processed + greatpageStats.processed + blacklabsStats.processed + leadsStats.processed;
        const totalInserted = primeStats.inserted + greatpageStats.inserted + blacklabsStats.inserted + leadsStats.inserted;
        const totalUpdated = primeStats.updated + greatpageStats.updated + blacklabsStats.updated + leadsStats.updated;
        const totalErrors = primeStats.errors + greatpageStats.errors + blacklabsStats.errors + leadsStats.errors;
        
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

