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
    'Apucarana_OFM': 'apucarana_ofm',
    'Facebook': 'facebook',
    'LP01 - Rio Preto CTA01': 'lp01_rio_preto_cta01',
    'LP01 - Rio Preto CTA02': 'lp01_rio_preto_cta02',
    'LP02 - Rio Preto CTA01': 'lp02_rio_preto_cta01',
    'Pedido de Manipulado': 'pedido_manipulado'
};

// Função para verificar se um lead já existe
async function checkLeadExists(email, planilhaTag) {
    if (!email || email.trim() === '') return true; // Considerar como existente se não tem email
    
    const { data, error } = await supabase
        .from('greatpage_leads')
        .select('id')
        .eq('email', email)
        .eq('planilha_tag', planilhaTag)
        .limit(1);
    
    if (error) {
        console.error('❌ Erro ao verificar lead:', error);
        return true; // Em caso de erro, considerar como existente
    }
    
    return data && data.length > 0;
}

// Função para processar um arquivo CSV
async function processFile(filePath, planilhaTag) {
    return new Promise((resolve) => {
        const leads = [];
        let totalRows = 0;
        let existingLeads = 0;
        let newLeads = 0;
        let invalidLeads = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', async (row) => {
                totalRows++;
                
                // Mapear campos do CSV para o formato da tabela
                const email = row['E-mail'] || row['Email'] || row['email'] || '';
                
                if (!email || email.trim() === '') {
                    invalidLeads++;
                    return;
                }
                
                const exists = await checkLeadExists(email, planilhaTag);
                if (exists) {
                    existingLeads++;
                } else {
                    newLeads++;
                    leads.push({
                        nome_completo: row['Nome completo'] || row['Nome'] || row['nome'] || '',
                        email: email,
                        telefone: row['Telefone'] || row['Phone'] || row['phone'] || '',
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
                        arquivo_origem: path.basename(filePath)
                    });
                }
            })
            .on('end', () => {
                resolve({
                    totalRows,
                    existingLeads,
                    newLeads,
                    invalidLeads,
                    leads
                });
            });
    });
}

// Função principal
async function main() {
    console.log('🔍 Verificando leads faltantes...\n');
    
    const planilhasPath = path.join(__dirname, 'Planilha Greatpages');
    let totalNewLeads = 0;
    let totalExistingLeads = 0;
    let totalInvalidLeads = 0;
    let totalFiles = 0;

    try {
        const folders = fs.readdirSync(planilhasPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const folder of folders) {
            const planilhaTag = folderToTag[folder] || folder.toLowerCase().replace(/\s+/g, '_');
            console.log(`📁 Processando pasta: ${folder} (tag: ${planilhaTag})`);

            const folderPath = path.join(planilhasPath, folder);
            const files = fs.readdirSync(folderPath)
                .filter(file => file.endsWith('.csv'));

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                console.log(`  📄 Verificando: ${file}`);
                
                const result = await processFile(filePath, planilhaTag);
                totalFiles++;
                totalNewLeads += result.newLeads;
                totalExistingLeads += result.existingLeads;
                totalInvalidLeads += result.invalidLeads;
                
                console.log(`    📊 Total: ${result.totalRows}, Existentes: ${result.existingLeads}, Novos: ${result.newLeads}, Inválidos: ${result.invalidLeads}`);
            }
        }

        console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
        console.log(`  📁 Pastas processadas: ${folders.length}`);
        console.log(`  📄 Arquivos processados: ${totalFiles}`);
        console.log(`  👥 Total de leads verificados: ${totalNewLeads + totalExistingLeads + totalInvalidLeads}`);
        console.log(`  ✅ Leads já existentes: ${totalExistingLeads}`);
        console.log(`  🆕 Leads novos (faltantes): ${totalNewLeads}`);
        console.log(`  ❌ Leads inválidos: ${totalInvalidLeads}`);

    } catch (error) {
        console.error('❌ Erro durante a verificação:', error);
    }
}

main();


