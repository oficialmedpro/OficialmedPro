const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
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

// Função para converter data brasileira (DD/MM/YYYY) para ISO
function convertBrazilianDate(dateString) {
    if (!dateString || dateString.trim() === '') {
        return null;
    }
    
    try {
        // Formato: DD/MM/YYYY HH:mm
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00';
        
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        
        // Criar data no formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
        const isoDate = new Date(year, month - 1, day, hour || 0, minute || 0);
        
        // Verificar se a data é válida
        if (isNaN(isoDate.getTime())) {
            console.log(`⚠️  Data inválida: ${dateString}`);
            return null;
        }
        
        return isoDate.toISOString();
    } catch (error) {
        console.log(`⚠️  Erro ao converter data: ${dateString}`);
        return null;
    }
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

// Função para processar arquivo Excel
async function processExcelFile() {
    const filePath = path.join(__dirname, 'planilha sprint', 'leads_sprinthub.xlsx');
    
    console.log(`📄 Processando arquivo: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ Arquivo Excel não encontrado!');
        return { totalRows: 0, validLeads: 0, invalidLeads: 0, leads: 0, result: { success: 0, errors: 0 } };
    }
    
    try {
        // Ler arquivo Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Primeira planilha
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Total de linhas no Excel: ${jsonData.length}`);
        console.log(`📋 Colunas encontradas:`, Object.keys(jsonData[0] || {}));
        
        const leads = [];
        let totalRows = 0;
        let validLeads = 0;
        let invalidLeads = 0;

        for (const row of jsonData) {
            totalRows++;
            
            const email = row['Email'] || row['email'] || row['E-mail'] || '';
            const telefone = row['Telefone Celular'] || row['telefone'] || row['Phone'] || row['phone'] || '';
            const whatsapp = row['WhatsApp'] || row['whatsapp'] || '';
            
            // Inserir TODOS os leads sem validação
            validLeads++;
            
            const lead = {
                nome_completo: (row['Nome'] || '') + ' ' + (row['Sobrenome'] || ''),
                primeiro_nome: row['Nome'] || '',
                ultimo_nome: row['Sobrenome'] || '',
                email: email,
                telefone: telefone,
                whatsapp: whatsapp,
                mobile: telefone || whatsapp,
                endereco_logradouro: '',
                endereco_numero: '',
                endereco_complemento: '',
                endereco_bairro: '',
                endereco_cidade: '',
                endereco_estado: '',
                endereco_cep: '',
                endereco_pais: 'Brasil',
                codigo_cliente: '',
                data_cadastro: new Date().toISOString(),
                data_ultima_atualizacao: new Date().toISOString(),
                status: 'Novo',
                origem: row['Fonte (Nome)'] || row['Fonte'] || '',
                fonte: row['Fonte (Nome)'] || row['Fonte'] || '',
                campanha: '',
                segmento: '',
                categoria: '',
                ultimo_contato: null,
                proximo_contato: null,
                observacoes: '',
                notas: '',
                tags: [],
                valor_interesse: null,
                produto_interesse: '',
                probabilidade_venda: null,
                etapa_venda: '',
                ip_usuario: '',
                user_agent: '',
                dispositivo: '',
                navegador: '',
                sistema_operacional: '',
                arquivo_origem: 'leads_sprinthub.xlsx',
                linha_arquivo: totalRows
            };
            
            // Gerar hash dos dados
            lead.hash_dados = generateDataHash(lead);
            
            leads.push(lead);
        }
        
        console.log(`  📊 Total de linhas processadas: ${totalRows}`);
        console.log(`  ✅ Leads válidos: ${validLeads}`);
        console.log(`  ❌ Leads inválidos: ${invalidLeads}`);
        
        if (leads.length > 0) {
            const result = await insertLeads(leads);
            console.log(`  ✅ ${result.success} leads inseridos, ${result.errors} erros`);
            return { totalRows, validLeads, invalidLeads, leads: leads.length, result };
        }
        
        return { totalRows, validLeads, invalidLeads, leads: 0, result: { success: 0, errors: 0 } };
        
    } catch (error) {
        console.error('❌ Erro ao processar arquivo Excel:', error);
        return { totalRows: 0, validLeads: 0, invalidLeads: 0, leads: 0, result: { success: 0, errors: 1 } };
    }
}

// Função principal
async function main() {
    console.log('🚀 Iniciando importação real de leads do Sprinthub...\n');
    
    try {
        const result = await processExcelFile();
        
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
