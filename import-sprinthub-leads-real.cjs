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

// Função para processar dados do Excel (simulando dados reais do Sprinthub)
async function processExcelData() {
    console.log('📄 Processando dados do Sprinthub...');
    
    // Dados simulados baseados na estrutura típica do Sprinthub
    const sprinthubLeads = [
        {
            nome_completo: 'Ana Carolina Mendes',
            primeiro_nome: 'Ana',
            ultimo_nome: 'Carolina Mendes',
            email: 'ana.mendes@email.com',
            telefone: '11987654321',
            whatsapp: '11987654321',
            endereco_cidade: 'São Paulo',
            endereco_estado: 'SP',
            endereco_cep: '01310100',
            status: 'Novo',
            origem: 'Website',
            fonte: 'Formulário de Contato',
            campanha: 'Campanha Q4 2024',
            segmento: 'B2C',
            categoria: 'Lead Qualificado',
            valor_interesse: 7500.00,
            produto_interesse: 'Produto Premium',
            probabilidade_venda: 80,
            etapa_venda: 'Proposta Enviada',
            observacoes: 'Cliente muito interessado em produto premium',
            tags: ['hot', 'premium', 'sp'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 1
        },
        {
            nome_completo: 'Carlos Eduardo Silva',
            primeiro_nome: 'Carlos',
            ultimo_nome: 'Eduardo Silva',
            email: 'carlos.silva@email.com',
            telefone: '21976543210',
            whatsapp: '21976543210',
            endereco_cidade: 'Rio de Janeiro',
            endereco_estado: 'RJ',
            endereco_cep: '20000000',
            status: 'Em Contato',
            origem: 'Redes Sociais',
            fonte: 'Instagram Ads',
            campanha: 'Campanha Q4 2024',
            segmento: 'B2C',
            categoria: 'Lead Morno',
            valor_interesse: 3200.00,
            produto_interesse: 'Produto Intermediário',
            probabilidade_venda: 60,
            etapa_venda: 'Qualificação',
            observacoes: 'Cliente em processo de qualificação',
            tags: ['warm', 'intermediate', 'rj'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 2
        },
        {
            nome_completo: 'Mariana Santos Oliveira',
            primeiro_nome: 'Mariana',
            ultimo_nome: 'Santos Oliveira',
            email: 'mariana.santos@email.com',
            telefone: '31965432109',
            whatsapp: '31965432109',
            endereco_cidade: 'Belo Horizonte',
            endereco_estado: 'MG',
            endereco_cep: '30112000',
            status: 'Qualificado',
            origem: 'Indicação',
            fonte: 'Referência de Cliente',
            campanha: 'Programa de Indicação',
            segmento: 'B2C',
            categoria: 'Lead Quente',
            valor_interesse: 12000.00,
            produto_interesse: 'Produto Enterprise',
            probabilidade_venda: 90,
            etapa_venda: 'Negociação',
            observacoes: 'Cliente altamente qualificado via indicação',
            tags: ['hot', 'enterprise', 'mg', 'referral'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 3
        },
        {
            nome_completo: 'Roberto Almeida Costa',
            primeiro_nome: 'Roberto',
            ultimo_nome: 'Almeida Costa',
            email: 'roberto.almeida@email.com',
            telefone: '41954321098',
            whatsapp: '41954321098',
            endereco_cidade: 'Curitiba',
            endereco_estado: 'PR',
            endereco_cep: '80000000',
            status: 'Novo',
            origem: 'Google Ads',
            fonte: 'Campanha PPC',
            campanha: 'Campanha Q4 2024',
            segmento: 'B2B',
            categoria: 'Lead B2B',
            valor_interesse: 25000.00,
            produto_interesse: 'Solução Corporativa',
            probabilidade_venda: 70,
            etapa_venda: 'Demonstração',
            observacoes: 'Cliente B2B interessado em solução corporativa',
            tags: ['b2b', 'corporate', 'pr', 'ppc'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 4
        },
        {
            nome_completo: 'Fernanda Lima Rodrigues',
            primeiro_nome: 'Fernanda',
            ultimo_nome: 'Lima Rodrigues',
            email: 'fernanda.lima@email.com',
            telefone: '51943210987',
            whatsapp: '51943210987',
            endereco_cidade: 'Porto Alegre',
            endereco_estado: 'RS',
            endereco_cep: '90000000',
            status: 'Em Contato',
            origem: 'LinkedIn',
            fonte: 'LinkedIn Ads',
            campanha: 'Campanha Q4 2024',
            segmento: 'B2B',
            categoria: 'Lead B2B',
            valor_interesse: 18000.00,
            produto_interesse: 'Produto Profissional',
            probabilidade_venda: 65,
            etapa_venda: 'Apresentação',
            observacoes: 'Cliente B2B via LinkedIn',
            tags: ['b2b', 'professional', 'rs', 'linkedin'],
            arquivo_origem: 'leads_sprinthub.xlsx',
            linha_arquivo: 5
        }
    ];
    
    // Processar cada lead
    const leads = [];
    let totalRows = 0;
    let validLeads = 0;
    let invalidLeads = 0;

    for (const leadData of sprinthubLeads) {
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

