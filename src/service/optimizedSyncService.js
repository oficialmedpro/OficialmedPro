/**
 * 🚀 SERVIÇO DE SINCRONIZAÇÃO OTIMIZADO
 * 
 * Melhorias implementadas:
 * - Processamento em lotes maiores (batch size 20)
 * - Redução de delays (50ms ao invés de 100-200ms)
 * - Verificação em lote no Supabase
 * - Processamento paralelo de funis
 * - Cache de verificações
 * - Paginação maior (100 itens)
 */

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

const SUPABASE_CONFIG = {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceKey
};

// 📋 CONFIGURAÇÃO COMPLETA DOS FUNIS E ETAPAS
const FUNIS_CONFIG = {
    6: {
        name: "[1] COMERCIAL APUCARANA",
        stages: [
            { id: 130, name: "[0] ENTRADA" },
            { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 82, name: "[2] QUALIFICADO" },
            { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
            { id: 83, name: "[4] NEGOCIAÇÃO" },
            { id: 85, name: "[5] FOLLOW UP" },
            { id: 232, name: "[6] CADASTRO" }
        ]
    },
    9: {
        name: "[1] LOGÍSTICA MANIPULAÇÃO",
        stages: [
            { id: 101, name: "Fila Logística" },
            { id: 243, name: "Separação" },
            { id: 266, name: "Preparação" },
            { id: 244, name: "Produção" },
            { id: 245, name: "Finalização" },
            { id: 105, name: "Faturamento" },
            { id: 108, name: "Entrega" },
            { id: 267, name: "Pendências" },
            { id: 109, name: "Conferência" },
            { id: 261, name: "Expedição" },
            { id: 262, name: "Em Transporte" },
            { id: 263, name: "Saiu para Entrega" },
            { id: 278, name: "Reentregas" },
            { id: 110, name: "Concluído" }
        ]
    },
    14: {
        name: "[2] RECOMPRA",
        stages: [
            { id: 227, name: "[X] PROMO" },
            { id: 202, name: "[0] ENTRADA" },
            { id: 228, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 229, name: "[2] QUALIFICAÇÃO" },
            { id: 206, name: "[3] ORÇAMENTOS" },
            { id: 203, name: "[4] NEGOCIAÇÃO" },
            { id: 204, name: "[5] FOLLOW UP" },
            { id: 230, name: "[6] CADASTRO" },
            { id: 205, name: "[X] PARCEIROS" },
            { id: 241, name: "[0] MONITORAMENTO" },
            { id: 146, name: "[1] DISPARO" },
            { id: 147, name: "[2] DIA 1 - 1º TENTATIVA" },
            { id: 167, name: "[3] DIA 1 - 2º TENTATIVA" },
            { id: 148, name: "[4] DIA 2 - 1º TENTATIVA" },
            { id: 168, name: "[5] DIA 2 - 2º TENTATIVA" },
            { id: 149, name: "[6] DIA 3 - 1º TENTATIVA" },
            { id: 169, name: "[7] DIA 3 - 2º TENTATIVA" },
            { id: 150, name: "[8] FOLLOW UP INFINITO" }
        ]
    }
};

// Configurações otimizadas
const OPTIMIZATION_CONFIG = {
    PAGE_LIMIT: 100,           // Aumentado de 50 para 100
    BATCH_SIZE: 20,            // Aumentado de 5 para 20
    DELAY_BETWEEN_PAGES: 50,   // Reduzido de 200ms para 50ms
    DELAY_BETWEEN_BATCHES: 30, // Reduzido de 100ms para 30ms
    PARALLEL_STAGES: 3,        // Processar 3 etapas em paralelo
    CACHE_DURATION: 60000,     // 1 minuto de cache
    REQUEST_RETRIES: 3,        // Tentativas por requisição SprintHub
    RETRY_DELAY_MS: 750,       // Delay incremental entre tentativas gerais
    RETRY_DELAY_AUTH_MS: 2000, // Delay específico para 401/403
    RECENT_WINDOW_HOURS: 48    // Janela de tempo para sincronização incremental
};

// Cache de verificações
const verificationCache = new Map();

/**
 * Delay otimizado
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parsear data brasileira (DD/MM/YYYY) ou ISO
 */
function parseBrazilianDate(dateString) {
    if (!dateString) return null;
    
    try {
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const date = new Date(year, month - 1, day);
                return date.toISOString();
            }
        } else if (dateString.includes('T')) {
            return new Date(dateString).toISOString();
        } else {
            return new Date(dateString).toISOString();
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao parsear data: ${dateString}`, error);
        return null;
    }
    
    return null;
}

/**
 * Verificar se data é das últimas 48 horas
 */
function isRecent48Hours(dateString) {
    if (!dateString) return false;
    
    try {
        let date;
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateString);
        }
        
        const hoursAgo48 = new Date();
        hoursAgo48.setHours(hoursAgo48.getHours() - 48);
        
        return date >= hoursAgo48;
    } catch (error) {
        return false;
    }
}

/**
 * Buscar oportunidades de uma etapa específica (com paginação otimizada)
 */
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0) {
    const sinceTimestamp = new Date(
        Date.now() - OPTIMIZATION_CONFIG.RECENT_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const payload = {
        page,
        limit: OPTIMIZATION_CONFIG.PAGE_LIMIT,
        columnId: stageId,
        updatedSince: sinceTimestamp,
        modifiedSince: sinceTimestamp,
        lastUpdate: sinceTimestamp
    };

    const postData = JSON.stringify(payload);

    for (let attempt = 1; attempt <= OPTIMIZATION_CONFIG.REQUEST_RETRIES; attempt++) {
        try {
            const response = await fetch(
                `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Accept': 'application/json'
                    },
                    body: postData
                }
            );

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            }

            if (response.status === 400) {
                console.warn(`⚠️ SprintHub retornou 400 para funil ${funnelId}, etapa ${stageId}, página ${page}. Considerando fim da paginação.`);
                return [];
            }

            if ((response.status === 401 || response.status === 403)) {
                const retryRemaining = OPTIMIZATION_CONFIG.REQUEST_RETRIES - attempt;
                if (retryRemaining > 0) {
                    console.warn(`⚠️ SprintHub retornou ${response.status} para funil ${funnelId}, etapa ${stageId}, página ${page}. Tentativa ${attempt}/${OPTIMIZATION_CONFIG.REQUEST_RETRIES}. Aguardando ${OPTIMIZATION_CONFIG.RETRY_DELAY_AUTH_MS}ms antes de retry.`);
                    await delay(OPTIMIZATION_CONFIG.RETRY_DELAY_AUTH_MS);
                    continue;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText || 'Unauthorized'}`);
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            if (attempt >= OPTIMIZATION_CONFIG.REQUEST_RETRIES) {
                console.error(`❌ Erro ao buscar etapa ${stageId} (funil ${funnelId}, página ${page}) após ${attempt} tentativas:`, error);
                return [];
            }

            const backoff = OPTIMIZATION_CONFIG.RETRY_DELAY_MS * attempt;
            console.warn(`⚠️ Erro na tentativa ${attempt} ao buscar etapa ${stageId} (funil ${funnelId}). Aguardando ${backoff}ms para tentar novamente. Detalhes: ${error.message}`);
            await delay(backoff);
        }
    }

    return [];
}

/**
 * Buscar TODAS as oportunidades recentes (últimas 48h) de uma etapa
 */
async function fetchRecentOpportunitiesFromStage(funnelId, stageId) {
    let allOpportunities = [];
    let page = 0;

    while (true) {
        try {
            const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page);
            
            if (opportunities.length === 0) {
                break;
            }
            
            // Filtrar apenas últimas 48 horas
            const recentOpps = opportunities.filter(opp => isRecent48Hours(opp.updateDate));
            allOpportunities = allOpportunities.concat(recentOpps);

            // Se não encontrou nenhuma oportunidade recente in loco, assumir que as próximas páginas são ainda mais antigas
            if (recentOpps.length === 0) {
                break;
            }
            
            // Se retornou menos que o limite, significa que esta é a última página fornecida pela API
            if (opportunities.length < OPTIMIZATION_CONFIG.PAGE_LIMIT) {
                break;
            }
            
            page++;
            await delay(OPTIMIZATION_CONFIG.DELAY_BETWEEN_PAGES);
        } catch (error) {
            console.log(`   ❌ Erro na página ${page}: ${error.message}`);
            break;
        }
    }

    return allOpportunities;
}

/**
 * Verificar múltiplas oportunidades no Supabase de uma vez (BATCH)
 */
async function checkMultipleInSupabase(opportunityIds) {
    if (opportunityIds.length === 0) return {};
    
    try {
        // Verificar cache primeiro
        const cached = {};
        const uncachedIds = [];
        
        for (const id of opportunityIds) {
            const cacheKey = `verify_${id}`;
            if (verificationCache.has(cacheKey)) {
                const cacheEntry = verificationCache.get(cacheKey);
                if (Date.now() - cacheEntry.timestamp < OPTIMIZATION_CONFIG.CACHE_DURATION) {
                    cached[id] = cacheEntry.data;
                    continue;
                }
            }
            uncachedIds.push(id);
        }
        
        if (uncachedIds.length === 0) {
            return cached;
        }
        
        // Buscar em lote no Supabase
        const idsFilter = uncachedIds.map(id => `id.eq.${id}`).join(',');
        const response = await fetch(
            `${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?or=(${idsFilter})&select=id,update_date,synced_at,create_date`, 
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Accept-Profile': 'api'
                }
            }
        );

        if (!response.ok) return cached;
        
        const data = await response.json();
        const result = { ...cached };
        
        // Mapear resultados por ID
        if (Array.isArray(data)) {
            data.forEach(record => {
                result[record.id] = record;
                // Adicionar ao cache
                verificationCache.set(`verify_${record.id}`, {
                    data: record,
                    timestamp: Date.now()
                });
            });
        }
        
        // Adicionar IDs não encontrados ao cache
        uncachedIds.forEach(id => {
            if (!result[id]) {
                result[id] = null;
                verificationCache.set(`verify_${id}`, {
                    data: null,
                    timestamp: Date.now()
                });
            }
        });
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro ao verificar IDs em lote:`, error);
        return {};
    }
}

/**
 * Mapear campos da oportunidade do SprintHub para Supabase
 */
function mapOpportunityFields(opportunity) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    // Identificar funil
    const getFunilId = (crmColumn) => {
        if ([130, 231, 82, 207, 83, 85, 232].includes(crmColumn)) return 6;
        if ([101, 243, 266, 244, 245, 105, 108, 267, 109, 261, 262, 263, 278, 110].includes(crmColumn)) return 9;
        if ([227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150].includes(crmColumn)) return 14;
        return null;
    };

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
        
        // Datas importantes - CORRIGIDAS
        create_date: parseBrazilianDate(opportunity.createDate),
        update_date: parseBrazilianDate(opportunity.updateDate),
        lost_date: opportunity.lost_date ? parseBrazilianDate(opportunity.lost_date) : null,
        gain_date: opportunity.gain_date ? parseBrazilianDate(opportunity.gain_date) : null,
        
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
        funil_id: getFunilId(opportunity.crm_column),
        unidade_id: '[1]'
    };
}

/**
 * Inserir em lote no Supabase (BULK INSERT)
 */
async function bulkInsertToSupabase(dataArray) {
    if (dataArray.length === 0) return { success: true, count: 0 };
    
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
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(dataArray)
        });

        return { 
            success: response.ok, 
            status: response.status,
            count: dataArray.length 
        };
        
    } catch (error) {
        console.error('❌ Erro ao inserir em lote:', error);
        return { success: false, error: error.message, count: 0 };
    }
}

/**
 * Atualizar no Supabase
 */
async function updateInSupabase(opportunityId, data) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });

        return { success: response.ok, status: response.status };
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Processar lote de oportunidades (OTIMIZADO)
 */
async function processBatch(opportunities, existingRecords) {
    const toInsert = [];
    const toUpdate = [];
    let skipped = 0;
    
    // Separar em inserções e atualizações
    for (const opp of opportunities) {
        const existing = existingRecords[opp.id];
        const mappedData = mapOpportunityFields(opp);
        
        if (!existing) {
            toInsert.push(mappedData);
        } else {
            // Verificar se precisa atualizar
            const sprintHubDate = new Date(opp.updateDate);
            const supabaseDate = new Date(existing.update_date);
            
            if (sprintHubDate > supabaseDate) {
                toUpdate.push({ id: opp.id, data: mappedData });
            } else {
                skipped++;
            }
        }
    }
    
    // Executar inserções em lote
    let insertedCount = 0;
    if (toInsert.length > 0) {
        const insertResult = await bulkInsertToSupabase(toInsert);
        if (insertResult.success) {
            insertedCount = insertResult.count;
            console.log(`   ➕ Inseridas ${insertedCount} oportunidades em lote`);
        }
    }
    
    // Executar atualizações em paralelo (lotes de 10)
    let updatedCount = 0;
    const UPDATE_BATCH = 10;
    for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH) {
        const updateBatch = toUpdate.slice(i, i + UPDATE_BATCH);
        const updatePromises = updateBatch.map(item => 
            updateInSupabase(item.id, item.data)
        );
        
        const results = await Promise.all(updatePromises);
        updatedCount += results.filter(r => r.success).length;
    }
    
    if (updatedCount > 0) {
        console.log(`   🔄 Atualizadas ${updatedCount} oportunidades`);
    }
    
    return {
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skipped
    };
}

/**
 * Sincronizar etapa específica (OTIMIZADO)
 */
async function syncStageOptimized(funnelId, stageId, stageName = 'Etapa', options = {}) {
    const { onProgress = null } = options;
    
    console.log(`🔄 [OTIMIZADO] Sincronizando ${stageName} (ID: ${stageId}) do Funil ${funnelId}...`);
    
    let processed = 0, inserted = 0, updated = 0, skipped = 0, errors = 0;
    
    try {
        // Buscar oportunidades recentes (últimas 48h)
        const opportunities = await fetchRecentOpportunitiesFromStage(funnelId, stageId);
        console.log(`📊 Encontradas ${opportunities.length} oportunidades recentes (48h) no SprintHub`);
        
        if (opportunities.length === 0) {
            return {
                success: true,
                stageName,
                processed: 0,
                inserted: 0,
                updated: 0,
                skipped: 0,
                errors: 0,
                total: 0
            };
        }
        
        // Processar em lotes
        for (let i = 0; i < opportunities.length; i += OPTIMIZATION_CONFIG.BATCH_SIZE) {
            const batch = opportunities.slice(i, i + OPTIMIZATION_CONFIG.BATCH_SIZE);
            
            if (onProgress) {
                onProgress({
                    stage: stageName,
                    status: `Processando ${i + 1}-${Math.min(i + OPTIMIZATION_CONFIG.BATCH_SIZE, opportunities.length)}/${opportunities.length}...`,
                    progress: Math.round((i / opportunities.length) * 100)
                });
            }
            
            try {
                // Verificar quais já existem (em lote)
                const opportunityIds = batch.map(opp => opp.id);
                const existingRecords = await checkMultipleInSupabase(opportunityIds);
                
                // Processar lote
                const batchResult = await processBatch(batch, existingRecords);
                
                inserted += batchResult.inserted;
                updated += batchResult.updated;
                skipped += batchResult.skipped;
                processed += batch.length;
                
                // Delay mínimo entre lotes
                await delay(OPTIMIZATION_CONFIG.DELAY_BETWEEN_BATCHES);
                
            } catch (error) {
                errors += batch.length;
                console.error(`❌ Erro processando lote:`, error);
            }
        }
        
        const result = {
            success: true,
            stageName,
            processed,
            inserted,
            updated,
            skipped,
            errors,
            total: opportunities.length
        };
        
        console.log(`✅ ${stageName} sincronizada: ${processed} processadas | ${inserted} inseridas | ${updated} atualizadas | ${skipped} já atualizadas | ${errors} erros`);
        
        if (onProgress) {
            onProgress({
                stage: stageName,
                status: 'Concluído',
                result
            });
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro geral na sincronização da ${stageName}:`, error);
        return {
            success: false,
            error: error.message,
            stageName,
            processed: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        };
    }
}

/**
 * Sincronização completa otimizada (últimas 48 horas de ambos os funis)
 */
export async function syncOptimized48Hours(options = {}) {
    console.log('🚀 SINCRONIZAÇÃO OTIMIZADA - ÚLTIMAS 48 HORAS');
    console.log('='.repeat(50));
    
    const results = {
        totalProcessed: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        totalErrors: 0,
        funnels: {},
        startTime: new Date(),
        endTime: null
    };
    
    try {
        // Limpar cache antigo
        verificationCache.clear();
        
        // Processar funis em paralelo
        const funnelPromises = Object.entries(FUNIS_CONFIG).map(async ([funnelId, funnelConfig]) => {
            console.log(`🎯 Processando ${funnelConfig.name}...`);
            
            const funnelResults = {
                name: funnelConfig.name,
                stages: {}
            };
            
            // Processar etapas em lotes paralelos
            for (let i = 0; i < funnelConfig.stages.length; i += OPTIMIZATION_CONFIG.PARALLEL_STAGES) {
                const stagesBatch = funnelConfig.stages.slice(i, i + OPTIMIZATION_CONFIG.PARALLEL_STAGES);
                
                const stagePromises = stagesBatch.map(stage =>
                    syncStageOptimized(
                        parseInt(funnelId),
                        stage.id,
                        stage.name,
                        options
                    )
                );
                
                const stageResults = await Promise.all(stagePromises);
                
                stageResults.forEach((stageResult, idx) => {
                    const stage = stagesBatch[idx];
                    funnelResults.stages[stage.id] = stageResult;
                    
                    results.totalProcessed += stageResult.processed || 0;
                    results.totalInserted += stageResult.inserted || 0;
                    results.totalUpdated += stageResult.updated || 0;
                    results.totalSkipped += stageResult.skipped || 0;
                    results.totalErrors += stageResult.errors || 0;
                });
            }
            
            return { funnelId, funnelResults };
        });
        
        // Aguardar todos os funis
        const allFunnelResults = await Promise.all(funnelPromises);
        
        allFunnelResults.forEach(({ funnelId, funnelResults }) => {
            results.funnels[funnelId] = funnelResults;
        });
        
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO OTIMIZADA (48h)');
        console.log('='.repeat(60));
        console.log(`⏱️ Duração: ${results.duration}s`);
        console.log(`📈 Total processadas: ${results.totalProcessed}`);
        console.log(`➕ Total inseridas: ${results.totalInserted}`);
        console.log(`🔄 Total atualizadas: ${results.totalUpdated}`);
        console.log(`⚪ Total já atualizadas: ${results.totalSkipped}`);
        console.log(`❌ Total erros: ${results.totalErrors}`);
        console.log(`🚀 Velocidade: ~${Math.round(results.totalProcessed / results.duration)} ops/s`);
        console.log('='.repeat(60));
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro na sincronização otimizada:', error);
        results.error = error.message;
        results.success = false;
        return results;
    }
}

/**
 * Limpar cache manualmente
 */
export function clearCache() {
    verificationCache.clear();
    console.log('🧹 Cache de verificações limpo');
}

export { syncStageOptimized, OPTIMIZATION_CONFIG };


