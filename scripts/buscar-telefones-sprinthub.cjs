#!/usr/bin/env node

/**
 * 📞 BUSCAR TELEFONES DO SPRINTHUB E ATUALIZAR BANCO
 * Busca telefones diretamente do SprintHub para clientes que têm id_sprinthub mas não têm telefone
 * 
 * USO: node scripts/buscar-telefones-sprinthub.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://agdffspstbxeqhqtltvb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'api' }
});

// Configuração SprintHub
const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const BATCH_SIZE = 50; // Tamanho do lote para buscar do SprintHub
const UPDATE_BATCH_SIZE = 100; // Tamanho do lote para atualizar no banco
const DELAY_BETWEEN_BATCHES = 100; // Delay em ms entre lotes (para não sobrecarregar API)

// Estatísticas
const stats = {
    total: 0,
    processados: 0,
    encontrados: 0,
    nao_encontrados: 0,
    erros: 0,
    atualizados: 0
};

// Função para buscar detalhes do lead no SprintHub
async function fetchLeadDetails(leadId, debug = false) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads/${leadId}?i=${SPRINTHUB_CONFIG.instance}&allFields=1&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        // Verificar se a resposta indica que o lead não existe
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { msg: responseText };
        }
        
        // Verificar mensagem de "Lead inexistente"
        if (data.msg && (data.msg.includes('inexistente') || data.msg.includes('não encontrado') || data.msg.includes('not found'))) {
            if (debug) console.log(`⚠️ Lead ${leadId} não existe no SprintHub: ${data.msg}`);
            return null;
        }
        
        if (response.status === 404 || response.status === 400) {
            if (debug) console.log(`⚠️ Lead ${leadId} não encontrado (${response.status}): ${data.msg || responseText.substring(0, 100)}`);
            return null;
        }

        if (!response.ok) {
            if (response.status === 429) {
                // Rate limit - aguardar
                console.log(`⚠️ Rate limit atingido. Aguardando 2 segundos...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchLeadDetails(leadId, debug); // Retry
            }
            if (debug) console.log(`❌ HTTP ${response.status} para lead ${leadId}: ${data.msg || responseText.substring(0, 200)}`);
            throw new Error(`HTTP ${response.status}`);
        }

        const lead = data?.data?.lead || data?.lead || data?.data || data;
        
        if (!lead) {
            if (debug) console.log(`⚠️ Lead ${leadId} retornou null/undefined`);
            return null;
        }
        
        // Buscar telefone em todos os campos possíveis (incluindo customizados)
        let telefone = null;
        
        // Campos padrão
        telefone = lead.whatsapp || lead.mobile || lead.phone || lead.telephone || lead.tel || null;
        
        // Se não encontrou, buscar em campos customizados (fields)
        if (!telefone && lead.fields) {
            const fields = typeof lead.fields === 'string' ? JSON.parse(lead.fields) : lead.fields;
            if (fields) {
                telefone = fields.whatsapp || fields.mobile || fields.phone || fields.telefone || 
                          fields['WhatsApp'] || fields['Mobile'] || fields['Phone'] || 
                          fields['Telefone'] || fields['whatsapp'] || null;
            }
        }
        
        // Buscar em todos os campos do objeto (case insensitive)
        if (!telefone) {
            const allKeys = Object.keys(lead);
            for (const key of allKeys) {
                const lowerKey = key.toLowerCase();
                if ((lowerKey.includes('whatsapp') || lowerKey.includes('mobile') || 
                     lowerKey.includes('phone') || lowerKey.includes('telefone') || 
                     lowerKey.includes('celular') || lowerKey.includes('contato')) &&
                    lead[key] && typeof lead[key] === 'string' && lead[key].trim() !== '') {
                    telefone = lead[key];
                    break;
                }
            }
        }
        
        if (debug && !telefone) {
            console.log(`⚠️ Lead ${leadId} não tem telefone. Campos disponíveis:`, Object.keys(lead).slice(0, 20).join(', '));
            if (lead.fields) {
                const fields = typeof lead.fields === 'string' ? JSON.parse(lead.fields) : lead.fields;
                console.log(`   Campos customizados:`, Object.keys(fields || {}).slice(0, 20).join(', '));
            }
        }
        
        return {
            id: lead.id,
            telefone: telefone,
            whatsapp: lead.whatsapp,
            mobile: lead.mobile,
            phone: lead.phone,
            email: lead.email,
            fullname: lead.fullname || lead.name
        };
    } catch (error) {
        if (debug) console.error(`❌ Erro ao buscar lead ${leadId}:`, error.message);
        return null;
    }
}

// Função para processar um lote de leads
async function processBatch(clientes, isFirstBatch = false) {
    const updates = [];
    
    for (let idx = 0; idx < clientes.length; idx++) {
        const cliente = clientes[idx];
        stats.processados++;
        
        // Debug apenas no primeiro cliente do primeiro lote
        const debug = isFirstBatch && idx === 0;
        
        try {
            const leadData = await fetchLeadDetails(cliente.id_sprinthub, debug);
            
            if (leadData && leadData.telefone) {
                // Normalizar telefone (remover caracteres não numéricos, exceto +)
                let telefoneNormalizado = leadData.telefone.toString().trim();
                
                // Se não começa com +, adicionar +55 se tiver 10 ou 11 dígitos
                if (!telefoneNormalizado.startsWith('+')) {
                    const digits = telefoneNormalizado.replace(/\D/g, '');
                    if (digits.length === 10 || digits.length === 11) {
                        telefoneNormalizado = `+55${digits}`;
                    } else if (digits.length > 11 && digits.startsWith('55')) {
                        telefoneNormalizado = `+${digits}`;
                    } else {
                        telefoneNormalizado = digits;
                    }
                }
                
                updates.push({
                    id: cliente.id,
                    whatsapp: telefoneNormalizado,
                    telefone: telefoneNormalizado
                });
                
                stats.encontrados++;
                
                if (stats.encontrados % 100 === 0) {
                    console.log(`✅ Encontrados: ${stats.encontrados} | Processados: ${stats.processados}/${stats.total}`);
                }
            } else {
                stats.nao_encontrados++;
                // Log a cada 100 não encontrados para mostrar progresso
                if (stats.nao_encontrados % 100 === 0) {
                    console.log(`   ⚠️ Não encontrados: ${stats.nao_encontrados} | Processados: ${stats.processados}/${stats.total}`);
                }
            }
            
            // Pequeno delay para não sobrecarregar a API
            if (stats.processados % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        } catch (error) {
            console.error(`❌ Erro ao processar cliente ${cliente.id} (sprinthub: ${cliente.id_sprinthub}):`, error.message);
            stats.erros++;
        }
    }
    
    return updates;
}

// Função para atualizar banco em lotes
async function updateDatabase(updates) {
    if (updates.length === 0) return;
    
    try {
        // Atualizar em lotes menores para evitar timeout
        for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
            const batch = updates.slice(i, i + UPDATE_BATCH_SIZE);
            
            const updatePromises = batch.map(update => 
                supabase
                    .schema('api')
                    .from('clientes_mestre')
                    .update({
                        whatsapp: update.whatsapp,
                        telefone: update.telefone,
                        data_ultima_atualizacao: new Date().toISOString()
                    })
                    .eq('id', update.id)
            );
            
            await Promise.all(updatePromises);
            stats.atualizados += batch.length;
            
            console.log(`💾 Atualizados no banco: ${stats.atualizados}/${updates.length}`);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar banco:', error.message);
        throw error;
    }
}

// Função principal
async function main() {
    console.log('\n' + '='.repeat(80));
    console.log('📞 BUSCAR TELEFONES DO SPRINTHUB');
    console.log('='.repeat(80) + '\n');
    
    try {
        // 1. Buscar clientes sem telefone que têm id_sprinthub
        console.log('🔍 Buscando clientes sem telefone com id_sprinthub...');
        
        // Buscar em lotes de 5000 para não sobrecarregar
        let allClientes = [];
        let offset = 0;
        const limit = 5000;
        
        while (true) {
            const { data: clientes, error: fetchError } = await supabase
                .schema('api')
                .from('clientes_mestre')
                .select('id, id_sprinthub, nome_completo, email')
                .not('id_sprinthub', 'is', null)
                .or('whatsapp.is.null,whatsapp.eq.,whatsapp.eq.-')
                .or('telefone.is.null,telefone.eq.,telefone.eq.-')
                .range(offset, offset + limit - 1);
            
            if (fetchError) {
                throw fetchError;
            }
            
            if (!clientes || clientes.length === 0) {
                break;
            }
            
            allClientes.push(...clientes);
            console.log(`   Carregados: ${allClientes.length} clientes...`);
            
            if (clientes.length < limit) {
                break;
            }
            
            offset += limit;
        }
        
        const clientes = allClientes;
        
        if (fetchError) {
            throw fetchError;
        }
        
        if (!clientes || clientes.length === 0) {
            console.log('✅ Nenhum cliente sem telefone encontrado!');
            return;
        }
        
        stats.total = clientes.length;
        console.log(`📊 Total de clientes para processar: ${stats.total}\n`);
        
        // 2. Processar em lotes
        const allUpdates = [];
        
        for (let i = 0; i < clientes.length; i += BATCH_SIZE) {
            const batch = clientes.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const isFirstBatch = batchNum === 1;
            console.log(`\n🔄 Processando lote ${batchNum}/${Math.ceil(clientes.length / BATCH_SIZE)} (${batch.length} clientes)...`);
            
            const updates = await processBatch(batch, isFirstBatch);
            allUpdates.push(...updates);
            
            // Atualizar banco a cada 500 telefones encontrados
            if (allUpdates.length >= 500) {
                console.log(`\n💾 Atualizando banco com ${allUpdates.length} telefones...`);
                await updateDatabase(allUpdates);
                allUpdates.length = 0; // Limpar array
            }
            
            // Delay entre lotes
            if (i + BATCH_SIZE < clientes.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES * 2));
            }
        }
        
        // 3. Atualizar restantes
        if (allUpdates.length > 0) {
            console.log(`\n💾 Atualizando banco com ${allUpdates.length} telefones restantes...`);
            await updateDatabase(allUpdates);
        }
        
        // 4. Resumo final
        console.log('\n' + '='.repeat(80));
        console.log('📊 RESUMO FINAL');
        console.log('='.repeat(80));
        console.log(`Total processado: ${stats.processados}`);
        console.log(`Telefones encontrados: ${stats.encontrados}`);
        console.log(`Não encontrados: ${stats.nao_encontrados}`);
        console.log(`Erros: ${stats.erros}`);
        console.log(`Atualizados no banco: ${stats.atualizados}`);
        console.log('='.repeat(80) + '\n');
        
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error);
        process.exit(1);
    }
}

// Executar
main().then(() => {
    console.log('✅ Processo concluído!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});

