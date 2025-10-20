/**
 * 🧹 SERVIÇO DE LIMPEZA DE DUPLICATAS
 * 
 * Identifica e remove duplicatas no Supabase
 * Útil para corrigir problemas de sincronização
 */

import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

const SUPABASE_CONFIG = {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceKey
};

// 🔍 BUSCAR DUPLICATAS POR ID
export async function findDuplicatesById() {
    try {
        console.log('🔍 Buscando duplicatas por ID...');
        
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?select=id,count(*)`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📊 Total de registros únicos: ${data.length}`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Erro ao buscar duplicatas:', error);
        return [];
    }
}

// 🔍 BUSCAR DUPLICATAS POR TÍTULO E DATA
export async function findDuplicatesByTitleAndDate() {
    try {
        console.log('🔍 Buscando duplicatas por título e data...');
        
        // Query SQL para encontrar duplicatas
        const query = `
            SELECT 
                title, 
                create_date, 
                COUNT(*) as count,
                array_agg(id) as ids
            FROM oportunidade_sprint 
            WHERE create_date IS NOT NULL 
            GROUP BY title, create_date 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `;
        
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api'
            },
            body: JSON.stringify({ sql: query })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📊 Duplicatas encontradas: ${data.length}`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Erro ao buscar duplicatas por título:', error);
        return [];
    }
}

// 🧹 REMOVER DUPLICATAS (manter apenas o mais recente)
export async function removeDuplicates(duplicates) {
    try {
        console.log(`🧹 Removendo ${duplicates.length} grupos de duplicatas...`);
        
        let totalRemoved = 0;
        
        for (const duplicate of duplicates) {
            const ids = duplicate.ids;
            const count = duplicate.count;
            
            if (count <= 1) continue;
            
            console.log(`🔍 Processando: "${duplicate.title}" (${count} duplicatas)`);
            
            // Buscar detalhes de todos os IDs
            const detailsResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=in.(${ids.join(',')})&select=id,synced_at,update_date&order=synced_at.desc`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Accept-Profile': 'api'
                }
            });
            
            if (!detailsResponse.ok) continue;
            
            const details = await detailsResponse.json();
            
            // Manter apenas o primeiro (mais recente) e remover os outros
            const toKeep = details[0];
            const toRemove = details.slice(1);
            
            console.log(`  ✅ Mantendo: ${toKeep.id} (mais recente)`);
            
            for (const record of toRemove) {
                try {
                    const deleteResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${record.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                            'apikey': SUPABASE_CONFIG.serviceRoleKey,
                            'Accept-Profile': 'api'
                        }
                    });
                    
                    if (deleteResponse.ok) {
                        totalRemoved++;
                        console.log(`  🗑️ Removido: ${record.id}`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error(`  ❌ Erro ao remover ${record.id}:`, error);
                }
            }
        }
        
        console.log(`✅ Limpeza concluída: ${totalRemoved} duplicatas removidas`);
        return totalRemoved;
        
    } catch (error) {
        console.error('❌ Erro na limpeza de duplicatas:', error);
        return 0;
    }
}

// 📊 RELATÓRIO DE DUPLICATAS
export async function generateDuplicateReport() {
    try {
        console.log('📊 Gerando relatório de duplicatas...');
        
        const duplicates = await findDuplicatesByTitleAndDate();
        
        if (duplicates.length === 0) {
            console.log('✅ Nenhuma duplicata encontrada!');
            return { duplicates: 0, totalRecords: 0 };
        }
        
        let totalDuplicateRecords = 0;
        duplicates.forEach(dup => {
            totalDuplicateRecords += dup.count - 1; // -1 porque um é o original
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DE DUPLICATAS');
        console.log('='.repeat(60));
        console.log(`🔍 Grupos de duplicatas: ${duplicates.length}`);
        console.log(`📈 Total de registros duplicados: ${totalDuplicateRecords}`);
        console.log('='.repeat(60));
        
        duplicates.forEach((dup, index) => {
            console.log(`${index + 1}. "${dup.title}" (${dup.create_date}) - ${dup.count} cópias`);
        });
        
        return {
            duplicates: duplicates.length,
            totalRecords: totalDuplicateRecords,
            details: duplicates
        };
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        return { duplicates: 0, totalRecords: 0, error: error.message };
    }
}

// 🎯 LIMPEZA COMPLETA
export async function performFullCleanup() {
    try {
        console.log('🧹 Iniciando limpeza completa de duplicatas...');
        
        // 1. Gerar relatório
        const report = await generateDuplicateReport();
        
        if (report.duplicates === 0) {
            console.log('✅ Nenhuma duplicata encontrada. Limpeza desnecessária.');
            return { success: true, removed: 0 };
        }
        
        // 2. Remover duplicatas
        const removed = await removeDuplicates(report.details);
        
        // 3. Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('✅ LIMPEZA CONCLUÍDA');
        console.log('='.repeat(60));
        console.log(`🧹 Duplicatas removidas: ${removed}`);
        console.log(`📊 Grupos processados: ${report.duplicates}`);
        console.log('='.repeat(60));
        
        return {
            success: true,
            removed,
            processed: report.duplicates
        };
        
    } catch (error) {
        console.error('❌ Erro na limpeza completa:', error);
        return {
            success: false,
            error: error.message
        };
    }
}


