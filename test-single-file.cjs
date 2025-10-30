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

// Função para processar um arquivo CSV específico
async function processSingleFile() {
    const filePath = path.join(__dirname, 'Planilha Greatpages', 'Apucarana_OFM', 'Agosto.csv');
    const planilhaTag = 'apucarana_ofm';
    
    console.log(`🔍 Processando arquivo: ${filePath}`);
    
    const leads = [];
    let totalRows = 0;
    let validLeads = 0;
    let invalidLeads = 0;

    return new Promise((resolve) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                totalRows++;
                
                const email = row['E-mail'] || row['Email'] || row['email'] || '';
                
                if (!email || email.trim() === '') {
                    invalidLeads++;
                    return;
                }
                
                validLeads++;
                leads.push({
                    nome_completo: row['Nome completo'] || row['Nome'] || row['nome'] || '',
                    email: email,
                    telefone: row['Telefone'] || row['Phone'] || row['phone'] || '',
                    planilha_tag: planilhaTag,
                    arquivo_origem: 'Agosto.csv'
                });
            })
            .on('end', async () => {
                console.log(`📊 Total de linhas: ${totalRows}`);
                console.log(`✅ Leads válidos: ${validLeads}`);
                console.log(`❌ Leads inválidos: ${invalidLeads}`);
                
                if (leads.length > 0) {
                    console.log(`🔄 Tentando inserir ${leads.length} leads...`);
                    
                    try {
                        const { data, error } = await supabase
                            .from('greatpage_leads')
                            .insert(leads);

                        if (error) {
                            console.error('❌ Erro ao inserir leads:', error);
                        } else {
                            console.log('✅ Leads inseridos com sucesso!');
                        }
                    } catch (err) {
                        console.error('❌ Erro na inserção:', err);
                    }
                }
                
                resolve();
            });
    });
}

// Função principal
async function main() {
    console.log('🧪 Teste de inserção de um arquivo...\n');
    
    try {
        await processSingleFile();
        console.log('\n✅ Teste concluído!');
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

main();


