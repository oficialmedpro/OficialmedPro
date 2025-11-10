/**
 * 🔍 TODAY SYNC SERVICE
 * 
 * Serviço especializado para sincronizar APENAS oportunidades criadas hoje
 * Foco em depuração de datas e inserção precisa no banco
 */

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

import { supabaseUrl, supabaseAnonKey } from '../config/supabase.js';

const SUPABASE_CONFIG = {
    url: supabaseUrl,
    serviceRoleKey: supabaseAnonKey
};

// 📅 DEPURAR FORMATO DE DATA
function debugDateFormat(dateValue) {
    if (!dateValue) {
        return {
            raw: dateValue,
            valid: false,
            reason: 'Valor null/undefined'
        };
    }

    try {
        // Converter para string se necessário
        const dateStr = dateValue.toString();
        
        // Verificar diferentes formatos
        let parsedDate;
        let format = 'unknown';
        
        if (dateStr.includes('/')) {
            // Formato brasileiro DD/MM/YYYY HH:MM ou DD/MM/YYYY
            const parts = dateStr.split(' ');
            const datePart = parts[0]; // DD/MM/YYYY
            
            if (datePart.includes('/')) {
                const [day, month, year] = datePart.split('/');
                parsedDate = new Date(year, month - 1, day);
                format = 'brazilian_date';
            }
        } else {
            // Formato ISO ou timestamp
            parsedDate = new Date(dateValue);
            format = 'iso_or_timestamp';
        }
        
        const isValid = parsedDate instanceof Date && !isNaN(parsedDate);
        
        return {
            raw: dateValue,
            parsed: parsedDate,
            valid: isValid,
            format,
            isoDate: isValid ? parsedDate.toISOString().split('T')[0] : null,
            brDate: isValid ? parsedDate.toLocaleDateString('pt-BR') : null
        };
        
    } catch (error) {
        return {
            raw: dateValue,
            valid: false,
            error: error.message
        };
    }
}

// 🔍 BUSCAR OPORTUNIDADES DA ETAPA CADASTRO (232)
async function fetchCadastroOpportunities() {
    try {
        console.log('🔍 Buscando oportunidades da etapa CADASTRO (232)...');
        
        const postData = JSON.stringify({ page: 0, limit: 100, columnId: 232 });
        
        const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/6?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: postData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const opportunities = Array.isArray(data) ? data : [];
        
        console.log(`📊 Total encontrado na etapa CADASTRO: ${opportunities.length}`);
        return opportunities;
        
    } catch (error) {
        console.error('❌ Erro ao buscar oportunidades:', error);
        return [];
    }
}

// 📋 MOSTRAR JSON COMPLETO DE UMA OPORTUNIDADE
export async function debugOpportunityStructure() {
    console.log('🔍 DEBUGANDO ESTRUTURA DA OPORTUNIDADE');
    console.log('='.repeat(60));
    
    try {
        const opportunities = await fetchCadastroOpportunities();
        
        if (opportunities.length === 0) {
            console.log('❌ Nenhuma oportunidade encontrada na etapa CADASTRO');
            return { success: false, error: 'Nenhuma oportunidade encontrada' };
        }
        
        // Pegar a primeira oportunidade para debug
        const firstOpp = opportunities[0];
        
        console.log('🔍 JSON COMPLETO DA PRIMEIRA OPORTUNIDADE:');
        console.log(JSON.stringify(firstOpp, null, 2));
        
        console.log('\n🔍 CAMPOS DISPONÍVEIS:');
        console.log(Object.keys(firstOpp));
        
        console.log('\n🔍 ANÁLISE DE DATAS:');
        
        // Verificar todos os campos que podem conter datas
        const dateFields = ['createDate', 'updateDate', 'created_at', 'updated_at', 'date_created', 'date_updated'];
        
        dateFields.forEach(field => {
            if (firstOpp.hasOwnProperty(field)) {
                const debugResult = debugDateFormat(firstOpp[field]);
                console.log(`📅 ${field}:`, debugResult);
            } else {
                console.log(`❌ ${field}: Campo não existe`);
            }
        });
        
        return {
            success: true,
            totalOpportunities: opportunities.length,
            sampleOpportunity: firstOpp,
            availableFields: Object.keys(firstOpp)
        };
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        return { success: false, error: error.message };
    }
}

// 📅 FILTRAR OPORTUNIDADES CRIADAS HOJE
export async function findTodayOpportunities() {
    console.log('🔍 BUSCANDO OPORTUNIDADES CRIADAS HOJE');
    console.log('='.repeat(60));
    
    try {
        const allOpportunities = await fetchCadastroOpportunities();
        const today = new Date();
        const todayBR = today.toLocaleDateString('pt-BR'); // formato DD/MM/YYYY
        const todayISO = today.toISOString().split('T')[0]; // formato YYYY-MM-DD
        
        console.log(`📅 Data de hoje:`);
        console.log(`   Formato BR: ${todayBR}`);
        console.log(`   Formato ISO: ${todayISO}`);
        console.log(`   JavaScript: ${today.toDateString()}`);
        
        console.log(`\n🔍 Analisando ${allOpportunities.length} oportunidades...`);
        
        const todayOpportunities = [];
        
        allOpportunities.forEach((opp, index) => {
            console.log(`\n[${index + 1}] ID: ${opp.id} - ${opp.title}`);
            
            // Verificar campo de data de criação (vamos testar vários possíveis)
            const possibleDateFields = ['createDate', 'created_at', 'date_created', 'createdAt'];
            let createDate = null;
            let usedField = null;
            
            for (const field of possibleDateFields) {
                if (opp.hasOwnProperty(field) && opp[field]) {
                    createDate = opp[field];
                    usedField = field;
                    break;
                }
            }
            
            if (!createDate) {
                console.log(`   ❌ Nenhum campo de data de criação encontrado`);
                return;
            }
            
            console.log(`   📅 Campo usado: ${usedField} = ${createDate}`);
            
            // Debug da data
            const debugResult = debugDateFormat(createDate);
            console.log(`   🔍 Debug data:`, debugResult);
            
            if (!debugResult.valid) {
                console.log(`   ❌ Data inválida: ${debugResult.reason || debugResult.error}`);
                return;
            }
            
            // Verificar se é hoje
            const isToday = debugResult.brDate === todayBR || debugResult.isoDate === todayISO;
            
            console.log(`   ✅ É hoje? ${isToday ? 'SIM' : 'NÃO'}`);
            console.log(`   📊 Comparação BR: ${debugResult.brDate} === ${todayBR} = ${debugResult.brDate === todayBR}`);
            console.log(`   📊 Comparação ISO: ${debugResult.isoDate} === ${todayISO} = ${debugResult.isoDate === todayISO}`);
            
            if (isToday) {
                todayOpportunities.push({
                    ...opp,
                    _debug: {
                        dateField: usedField,
                        dateDebug: debugResult
                    }
                });
                console.log(`   ✅ ADICIONADA à lista de hoje!`);
            }
        });
        
        console.log(`\n📊 RESULTADO:`);
        console.log(`   Total analisadas: ${allOpportunities.length}`);
        console.log(`   Criadas hoje: ${todayOpportunities.length}`);
        
        if (todayOpportunities.length > 0) {
            console.log(`\n📋 OPORTUNIDADES DE HOJE:`);
            todayOpportunities.forEach((opp, index) => {
                console.log(`   ${index + 1}. ID: ${opp.id} - ${opp.title}`);
                console.log(`       Data: ${opp._debug.dateDebug.brDate} (${opp._debug.dateField})`);
            });
        }
        
        return {
            success: true,
            total: allOpportunities.length,
            todayCount: todayOpportunities.length,
            todayOpportunities,
            todayDate: todayBR
        };
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return { success: false, error: error.message };
    }
}

// 💾 MAPEAR E INSERIR OPORTUNIDADE
function mapOpportunityFields(opportunity) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    return {
        id: opportunity.id,
        title: opportunity.title,
        value: parseFloat(opportunity.value) || 0.00,
        crm_column: opportunity.crm_column,
        lead_id: opportunity.lead_id,
        status: opportunity.status,
        loss_reason: opportunity.loss_reason || null,
        gain_reason: opportunity.gain_reason || null,
        user_id: opportunity.user || null,
        
        // Datas importantes
        create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
        update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
        lost_date: opportunity.lost_date || null,
        gain_date: opportunity.gain_date || null,
        
        // Campos específicos
        origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
        qualificacao: fields["QUALIFICACAO"] || null,
        status_orcamento: fields["Status Orcamento"] || null,
        
        // UTM
        utm_source: utmTags.utmSource || null,
        utm_campaign: utmTags.utmCampaign || null,
        utm_medium: utmTags.utmMedium || null,
        
        // Lead
        lead_firstname: lead.firstname || null,
        lead_email: lead.email || null,
        lead_whatsapp: lead.whatsapp || null,
        
        // Controle
        archived: opportunity.archived || 0,
        synced_at: new Date().toISOString(),
        
        // Funil
        funil_id: 6,
        unidade_id: '[1]'
    };
}

// 💾 INSERIR NO SUPABASE
async function insertToSupabase(data) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        return { success: response.ok, status: response.status };
        
    } catch (error) {
        console.error('❌ Erro ao inserir:', error);
        return { success: false, error: error.message };
    }
}

// 🔄 SINCRONIZAR OPORTUNIDADES DE HOJE
export async function syncTodayOpportunities() {
    console.log('🔄 SINCRONIZANDO OPORTUNIDADES CRIADAS HOJE');
    console.log('='.repeat(60));
    
    try {
        // 1. Buscar oportunidades de hoje
        const result = await findTodayOpportunities();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const { todayOpportunities } = result;
        
        if (todayOpportunities.length === 0) {
            console.log('✅ Nenhuma oportunidade criada hoje para sincronizar');
            return {
                success: true,
                message: 'Nenhuma oportunidade criada hoje',
                processed: 0,
                inserted: 0,
                errors: 0
            };
        }
        
        // 2. Inserir no Supabase
        console.log(`\n💾 Inserindo ${todayOpportunities.length} oportunidades no Supabase...`);
        
        let inserted = 0;
        let errors = 0;
        const errorDetails = [];
        
        for (const opp of todayOpportunities) {
            try {
                const mappedData = mapOpportunityFields(opp);
                const insertResult = await insertToSupabase(mappedData);
                
                if (insertResult.success) {
                    inserted++;
                    console.log(`   ✅ Inserido: ${opp.id} - ${opp.title}`);
                } else {
                    errors++;
                    console.log(`   ❌ Erro: ${opp.id} - Status: ${insertResult.status}`);
                    errorDetails.push({
                        id: opp.id,
                        title: opp.title,
                        status: insertResult.status,
                        error: insertResult.error
                    });
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                errors++;
                console.error(`   ❌ Erro: ${opp.id} - ${error.message}`);
                errorDetails.push({
                    id: opp.id,
                    title: opp.title,
                    error: error.message
                });
            }
        }
        
        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`   Total encontradas hoje: ${todayOpportunities.length}`);
        console.log(`   Inseridas com sucesso: ${inserted}`);
        console.log(`   Erros: ${errors}`);
        
        if (errorDetails.length > 0) {
            console.log(`\n❌ DETALHES DOS ERROS:`);
            errorDetails.forEach(error => {
                console.log(`   ID: ${error.id} - ${error.title}: ${error.error || error.status}`);
            });
        }
        
        return {
            success: true,
            processed: todayOpportunities.length,
            inserted,
            errors,
            errorDetails,
            todayDate: result.todayDate
        };
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    debugOpportunityStructure,
    findTodayOpportunities,
    syncTodayOpportunities
};