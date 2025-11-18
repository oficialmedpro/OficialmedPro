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
                    .from('blacklabs')
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

// Função para processar um arquivo CSV
async function processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`📄 Processando: ${fileName}`);
    
    const leads = [];
    let totalRows = 0;
    let validLeads = 0;
    let invalidLeads = 0;

    return new Promise((resolve) => {
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' })) // Usar separador ';' conforme o arquivo
            .on('data', (row) => {
                totalRows++;
                
                const email = row['Email'] || '';
                const cpf = row['CPF'] || '';
                
                if (!email || email.trim() === '') {
                    invalidLeads++;
                    return;
                }
                
                validLeads++;
                leads.push({
                    cpf: cpf,
                    cliente: row['Cliente'] || '',
                    email: email,
                    telefone: row['Telefone'] || '',
                    rua_entrega: row['Rua entrega'] || '',
                    numero_entrega: row['Numero entrega'] || '',
                    bairro: row['Bairro'] || '',
                    complemento: row['Complemento'] || '',
                    cidade: row['Cidade'] || '',
                    estado: row['Estado'] || '',
                    cep: row['CEP'] || '',
                    produto: row['Produto'] || '',
                    arquivo_origem: fileName
                });
            })
            .on('end', async () => {
                console.log(`  📊 Total de linhas: ${totalRows}`);
                console.log(`  ✅ Leads válidos: ${validLeads}`);
                console.log(`  ❌ Leads inválidos: ${invalidLeads}`);
                
                if (leads.length > 0) {
                    const result = await insertLeads(leads);
                    console.log(`  ✅ ${result.success} leads inseridos, ${result.errors} erros`);
                }
                
                resolve({ totalRows, validLeads, invalidLeads, leads: leads.length });
            });
    });
}

// Função principal
async function main() {
    console.log('🚀 Iniciando importação de leads das planilhas Blacklabs...\n');
    
    const planilhasDir = path.join(__dirname, 'planilhasblack');
    
    if (!fs.existsSync(planilhasDir)) {
        console.error('❌ Pasta planilhasblack não encontrada!');
        process.exit(1);
    }
    
    const files = fs.readdirSync(planilhasDir).filter(file => file.endsWith('.csv'));
    
    if (files.length === 0) {
        console.error('❌ Nenhum arquivo CSV encontrado na pasta planilhasblack!');
        process.exit(1);
    }
    
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalFiles = 0;
    
    for (const file of files) {
        const filePath = path.join(planilhasDir, file);
        const result = await processFile(filePath);
        
        totalProcessed += result.totalRows;
        totalSuccess += result.validLeads;
        totalErrors += result.invalidLeads;
        totalFiles++;
    }
    
    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`  📁 Arquivos processados: ${totalFiles}`);
    console.log(`  👥 Total de leads processados: ${totalProcessed}`);
    console.log(`  ✅ Leads válidos: ${totalSuccess}`);
    console.log(`  ❌ Leads inválidos: ${totalErrors}`);
    
    if (totalErrors > 0) {
        console.log('\n⚠️  Importação concluída com alguns erros.');
    } else {
        console.log('\n✅ Importação concluída com sucesso!');
    }
}

main().catch(console.error);

