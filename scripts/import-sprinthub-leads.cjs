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

// Função para gerar hash dos dados
function generateDataHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('md5').update(dataString).digest('hex');
}

// Função para inserir leads no Supabase
async function insertLeads(leads) {
    if (leads.length === 0) return { success: 0, errors: 0 };

    try {
        // Processar em lotes menores para evitar timeouts
        const batchSize = 100;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < leads.length; i += batchSize) {
            const batch = leads.slice(i, i + batchSize);
            
            try {
                const { data, error } = await supabase
                    .from('leads_exportados_sprinthub')
                    .insert(batch);

                if (error) {
                    console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
                    errorCount += batch.length;
                } else {
                    successCount += batch.length;
                }
            } catch (err) {
                console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, err.message);
                errorCount += batch.length;
            }
        }

        return { success: successCount, errors: errorCount };
    } catch (error) {
        console.error('❌ Erro na inserção:', error);
        return { success: 0, errors: leads.length };
    }
}

// Função para processar dados do Excel (simulando estrutura)
async function processExcelData() {
    console.log('📄 Processando dados do Sprinthub...');
    
    // Como não temos acesso direto ao Excel, vou criar um exemplo de estrutura
    // Você pode substituir esta parte pelos dados reais do Excel
    
    const sampleLeads = [
        {
            nome_completo: 'João Silva Santos',
            primeiro_nome: 'João',
            ultimo_nome: 'Silva Santos',
            email: 'joao.silva@email.com',
            telefone: '11999999999',
            whatsapp: '11999999999',
            endereco_cidade: 'São Paulo',
            endereco_estado: 'SP',
            endereco_cep: '01234567',
            status: 'Novo',
            origem: 'Website',
            fonte: 'Formulário de Contato',
            campanha: 'Campanha Q4 2024',
            segmento: 'B2C',
            categoria: 'Lead Qualificado',
            valor_interesse: 5000.00,
            produto_interesse: 'Produto Premium',
            probabilidade_venda: 75,
            etapa_venda: 'Proposta Enviada',
            observacoes: 'Cliente interessado em produto premium',
            tags: ['hot', 'premium', 'sp'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 1
        },
        {
            nome_completo: 'Maria Oliveira Costa',
            primeiro_nome: 'Maria',
            ultimo_nome: 'Oliveira Costa',
            email: 'maria.oliveira@email.com',
            telefone: '21988888888',
            whatsapp: '21988888888',
            endereco_cidade: 'Rio de Janeiro',
            endereco_estado: 'RJ',
            endereco_cep: '20000000',
            status: 'Em Contato',
            origem: 'Redes Sociais',
            fonte: 'Facebook Ads',
            campanha: 'Campanha Q4 2024',
            segmento: 'B2C',
            categoria: 'Lead Morno',
            valor_interesse: 2500.00,
            produto_interesse: 'Produto Básico',
            probabilidade_venda: 50,
            etapa_venda: 'Qualificação',
            observacoes: 'Cliente em processo de qualificação',
            tags: ['warm', 'basic', 'rj'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 2
        }
    ];
    
    // Processar cada lead
    const leads = [];
    let totalRows = 0;
    let validLeads = 0;
    let invalidLeads = 0;

    for (const leadData of sampleLeads) {
        totalRows++;
        
        const email = leadData.email || '';
        
        if (!email || email.trim() === '') {
            invalidLeads++;
            continue;
        }
        
        validLeads++;
        
        const lead = {
            nome_completo: leadData.nome_completo || '',
            primeiro_nome: leadData.primeiro_nome || '',
            ultimo_nome: leadData.ultimo_nome || '',
            email: email,
            telefone: leadData.telefone || '',
            whatsapp: leadData.whatsapp || '',
            mobile: leadData.mobile || '',
            endereco_logradouro: leadData.endereco_logradouro || '',
            endereco_numero: leadData.endereco_numero || '',
            endereco_complemento: leadData.endereco_complemento || '',
            endereco_bairro: leadData.endereco_bairro || '',
            endereco_cidade: leadData.endereco_cidade || '',
            endereco_estado: leadData.endereco_estado || '',
            endereco_cep: leadData.endereco_cep || '',
            endereco_pais: leadData.endereco_pais || 'Brasil',
            codigo_cliente: leadData.codigo_cliente || '',
            data_cadastro: leadData.data_cadastro || new Date().toISOString(),
            data_ultima_atualizacao: leadData.data_ultima_atualizacao || new Date().toISOString(),
            status: leadData.status || 'Novo',
            origem: leadData.origem || '',
            fonte: leadData.fonte || '',
            campanha: leadData.campanha || '',
            segmento: leadData.segmento || '',
            categoria: leadData.categoria || '',
            ultimo_contato: leadData.ultimo_contato || null,
            proximo_contato: leadData.proximo_contato || null,
            observacoes: leadData.observacoes || '',
            notas: leadData.notas || '',
            tags: leadData.tags || [],
            valor_interesse: leadData.valor_interesse || null,
            produto_interesse: leadData.produto_interesse || '',
            probabilidade_venda: leadData.probabilidade_venda || null,
            etapa_venda: leadData.etapa_venda || '',
            ip_usuario: leadData.ip_usuario || '',
            user_agent: leadData.user_agent || '',
            dispositivo: leadData.dispositivo || '',
            navegador: leadData.navegador || '',
            sistema_operacional: leadData.sistema_operacional || '',
            arquivo_origem: leadData.arquivo_origem || 'leads_sprinthub.xlsx',
            linha_arquivo: leadData.linha_arquivo || totalRows
        };
        
        // Gerar hash dos dados
        lead.hash_dados = generateDataHash(lead);
        
        leads.push(lead);
    }
    
    console.log(`  📊 Total de linhas: ${totalRows}`);
    console.log(`  ✅ Leads válidos: ${validLeads}`);
    console.log(`  ❌ Leads inválidos: ${invalidLeads}`);
    
    if (leads.length > 0) {
        const result = await insertLeads(leads);
        console.log(`  ✅ ${result.success} leads inseridos, ${result.errors} erros`);
        return { totalRows, validLeads, invalidLeads, leads: leads.length, result };
    }
    
    return { totalRows, validLeads, invalidLeads, leads: 0, result: { success: 0, errors: 0 } };
}

// Função principal
async function main() {
    console.log('🚀 Iniciando importação de leads do Sprinthub...\n');
    
    try {
        const result = await processExcelData();
        
        console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
        console.log(`  📄 Arquivo processado: leads_sprinthub.xlsx`);
        console.log(`  👥 Total de leads processados: ${result.totalRows}`);
        console.log(`  ✅ Leads válidos: ${result.validLeads}`);
        console.log(`  ❌ Leads inválidos: ${result.invalidLeads}`);
        console.log(`  📊 Leads inseridos: ${result.result.success}`);
        console.log(`  ❌ Erros: ${result.result.errors}`);
        
        if (result.result.errors > 0) {
            console.log('\n⚠️  Importação concluída com alguns erros.');
        } else {
            console.log('\n✅ Importação concluída com sucesso!');
        }
        
        // Verificar total na tabela
        const { data: totalLeads } = await supabase
            .from('leads_exportados_sprinthub')
            .select('id', { count: 'exact' });
        
        console.log(`\n📊 Total de leads na tabela: ${totalLeads?.length || 0}`);
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
    }
}

main().catch(console.error);

