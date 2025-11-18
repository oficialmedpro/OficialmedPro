const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
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

// Mapeamento de pastas para tags
const folderToTag = {
    'OficialMed Franchising': 'oficialmed_franchising',
    'OficialMed Franchising - Atualizado': 'oficialmed_franchising_atualizado',
    'OMS_Apucarana': 'oms_apucarana',
    'OMS_Curitiba': 'oms_curitiba',
    'OMS_Goiania': 'oms_goiania',
    'OMS_Itapetinga': 'oms_itapetinga',
    'OMS_Maringa': 'oms_maringa',
    'OMS_Ponta_Grossa': 'oms_ponta_grossa',
    'OMS_Rio do Sul': 'oms_rio_do_sul',
    'LP01 - Rio Preto CTA01': 'lp01_rio_preto_cta01',
    'LP01 - Rio Preto CTA02': 'lp01_rio_preto_cta02',
    'LP02 - Rio Preto CTA01': 'lp02_rio_preto_cta01',
    'Facebook': 'facebook',
    'Apucarana_OFM': 'apucarana_ofm',
    'Pedido de Manipulado': 'pedido_manipulado'
};

// Função para processar um arquivo CSV
async function processCSVFile(filePath, planilhaTag, fileName) {
    return new Promise((resolve, reject) => {
        const leads = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Mapear campos do CSV para a estrutura da tabela
                const lead = {
                    nome_completo: row['Nome Completo'] || row['Nome'] || null,
                    email: row['E-mail'] || row['E-mail'] || null,
                    telefone: row['Telefone'] || null,
                    politicas_privacidade: row['Políticas de privacidade'] === 'true' || row['Políticas de privacidade'] === true,
                    referral_source: row['Referral source'] || null,
                    dispositivo: row['Dispositivo'] || null,
                    url: row['URL'] || null,
                    ip_usuario: row['IP do Usuario'] || row['IP do Usuário'] || null,
                    data_conversao: row['Data de conversão'] && row['Data de conversão'] !== 'Data de conversão' ? row['Data de conversão'] : null,
                    id_formulario: row['Id do formulário'] || null,
                    pais_usuario: row['País do Usuário'] || row['País do Usuário'] || 'BR',
                    regiao_usuario: row['Região do Usuário'] || row['Região do Usuário'] || null,
                    cidade_usuario: row['Cidade do Usuário'] || row['Cidade do Usuário'] || null,
                    planilha_tag: planilhaTag,
                    arquivo_origem: fileName
                };

                // Validar se tem pelo menos email
                if (lead.email && lead.email.trim() !== '') {
                    leads.push(lead);
                }
            })
            .on('end', () => {
                resolve(leads);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
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
                    .from('greatpage_leads')
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

// Função principal para processar todas as planilhas
async function importAllLeads() {
    const planilhasPath = path.join(__dirname, 'Planilha Greatpages');
    
    if (!fs.existsSync(planilhasPath)) {
        console.error('❌ Pasta "Planilha Greatpages" não encontrada');
        return;
    }

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let filesProcessed = 0;

    console.log('🚀 Iniciando importação de leads das planilhas Greatpages...\n');

    // Processar cada pasta
    const folders = fs.readdirSync(planilhasPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folder of folders) {
        const planilhaTag = folderToTag[folder] || folder.toLowerCase().replace(/\s+/g, '_');
        const folderPath = path.join(planilhasPath, folder);
        
        console.log(`📁 Processando pasta: ${folder} (tag: ${planilhaTag})`);

        // Encontrar todos os arquivos CSV na pasta
        const csvFiles = fs.readdirSync(folderPath)
            .filter(file => file.toLowerCase().endsWith('.csv'));

        for (const csvFile of csvFiles) {
            const filePath = path.join(folderPath, csvFile);
            
            try {
                console.log(`  📄 Processando: ${csvFile}`);
                
                const leads = await processCSVFile(filePath, planilhaTag, csvFile);
                const result = await insertLeads(leads);
                
                totalProcessed += leads.length;
                totalSuccess += result.success;
                totalErrors += result.errors;
                filesProcessed++;
                
                console.log(`    ✅ ${result.success} leads inseridos, ${result.errors} erros`);
                
                // Pequena pausa para não sobrecarregar o Supabase
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`    ❌ Erro ao processar ${csvFile}:`, error.message);
                totalErrors++;
            }
        }
        
        console.log('');
    }

    // Resumo final
    console.log('📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`  📁 Pastas processadas: ${folders.length}`);
    console.log(`  📄 Arquivos processados: ${filesProcessed}`);
    console.log(`  👥 Total de leads processados: ${totalProcessed}`);
    console.log(`  ✅ Leads inseridos com sucesso: ${totalSuccess}`);
    console.log(`  ❌ Erros: ${totalErrors}`);
    
    if (totalErrors === 0) {
        console.log('\n🎉 Importação concluída com sucesso!');
    } else {
        console.log('\n⚠️  Importação concluída com alguns erros.');
    }
}

// Função para processar apenas uma pasta específica
async function importFolderLeads(folderName) {
    const planilhasPath = path.join(__dirname, 'Planilha Greatpages');
    const folderPath = path.join(planilhasPath, folderName);
    
    if (!fs.existsSync(folderPath)) {
        console.error(`❌ Pasta "${folderName}" não encontrada`);
        return;
    }

    const planilhaTag = folderToTag[folderName] || folderName.toLowerCase().replace(/\s+/g, '_');
    
    console.log(`🚀 Importando leads da pasta: ${folderName} (tag: ${planilhaTag})\n`);

    const csvFiles = fs.readdirSync(folderPath)
        .filter(file => file.toLowerCase().endsWith('.csv'));

    let totalSuccess = 0;
    let totalErrors = 0;

    for (const csvFile of csvFiles) {
        const filePath = path.join(folderPath, csvFile);
        
        try {
            console.log(`📄 Processando: ${csvFile}`);
            
            const leads = await processCSVFile(filePath, planilhaTag, csvFile);
            const result = await insertLeads(leads);
            
            totalSuccess += result.success;
            totalErrors += result.errors;
            
            console.log(`  ✅ ${result.success} leads inseridos, ${result.errors} erros`);
            
        } catch (error) {
            console.error(`  ❌ Erro ao processar ${csvFile}:`, error.message);
            totalErrors++;
        }
    }

    console.log(`\n📊 RESUMO: ${totalSuccess} leads inseridos, ${totalErrors} erros`);
}

// Executar script
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Processar pasta específica
        importFolderLeads(args[0]);
    } else {
        // Processar todas as pastas
        importAllLeads();
    }
}

module.exports = { importAllLeads, importFolderLeads };
