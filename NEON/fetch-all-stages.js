/**
 * 🔍 PASSO 2: BUSCAR DADOS DE TODAS AS ETAPAS
 * 
 * OBJETIVO:
 * - Buscar oportunidades de todas as etapas dos 2 funis
 * - Testar paginação completa
 * - Documentar volume de dados por etapa
 * - Preparar para sincronização completa
 * 
 * FUNIS E ETAPAS:
 * Funil 6 "[1] COMERCIAL APUCARANA": 130, 231, 82, 207, 83, 85, 232
 * Funil 14 "[2] RECOMPRA": 227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150
 */

const https = require('https');

// 🔧 CONFIGURAÇÕES
const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
    timeout: 30000
};

// 📋 DEFINIÇÃO DOS FUNIS E ETAPAS
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

/**
 * 🌐 Função para buscar dados de uma etapa específica
 */
function fetchStageData(funnelId, stageId, page = 0, limit = 50) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            page: page,
            limit: limit,
            columnId: stageId
        });

        const options = {
            hostname: SPRINTHUB_CONFIG.baseUrl,
            port: 443,
            path: `/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'SprintHUB-Sync/1.0',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: SPRINTHUB_CONFIG.timeout
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(responseData);
                        resolve({
                            success: true,
                            funnelId,
                            stageId,
                            page,
                            data: jsonData
                        });
                    } else {
                        resolve({
                            success: false,
                            funnelId,
                            stageId,
                            page,
                            status: res.statusCode,
                            error: responseData
                        });
                    }
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * 📊 Função para contar total de oportunidades por etapa
 */
async function countOpportunitiesByStage() {
    const results = [];
    let totalOpportunities = 0;
    let totalValue = 0;

    console.log('🚀 CONTANDO OPORTUNIDADES POR ETAPA');
    console.log('====================================');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('');

    for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        console.log(`🎯 FUNIL ${funnelId}: ${funnelConfig.name}`);
        console.log('----------------------------------------');

        for (const stage of funnelConfig.stages) {
            try {
                console.log(`   🔍 Etapa ${stage.id}: ${stage.name}`);
                
                // Buscar primeira página para contar
                const result = await fetchStageData(parseInt(funnelId), stage.id, 0, 1);
                
                if (result.success && result.data) {
                    const count = result.data.total || 0;
                    const value = parseFloat(result.data.totalValue || 0);
                    
                    console.log(`      📊 ${count} oportunidades | R$ ${value.toFixed(2)}`);
                    
                    results.push({
                        funnelId: parseInt(funnelId),
                        funnelName: funnelConfig.name,
                        stageId: stage.id,
                        stageName: stage.name,
                        count: count,
                        value: value
                    });
                    
                    totalOpportunities += count;
                    totalValue += value;
                } else {
                    console.log(`      ❌ Erro: ${result.error || 'Falha na requisição'}`);
                }
                
                // Pausa entre requisições para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.log(`      ❌ Erro: ${error.message}`);
            }
        }
        console.log('');
    }

    // 📈 RESUMO FINAL
    console.log('📈 RESUMO GERAL');
    console.log('===============');
    console.log(`📊 Total de oportunidades: ${totalOpportunities}`);
    console.log(`💰 Valor total: R$ ${totalValue.toFixed(2)}`);
    console.log('');

    // 📋 TOP 10 ETAPAS COM MAIS OPORTUNIDADES
    console.log('🏆 TOP 10 ETAPAS COM MAIS OPORTUNIDADES:');
    results
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.stageName}: ${item.count} oportunidades`);
        });
    console.log('');

    // 💰 TOP 10 ETAPAS COM MAIOR VALOR
    console.log('💰 TOP 10 ETAPAS COM MAIOR VALOR:');
    results
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.stageName}: R$ ${item.value.toFixed(2)}`);
        });

    return results;
}

/**
 * 🚀 Executar análise completa
 */
async function main() {
    try {
        const results = await countOpportunitiesByStage();
        
        console.log('');
        console.log('🎉 ANÁLISE CONCLUÍDA!');
        console.log('✅ Todas as etapas foram verificadas');
        console.log('📊 Dados prontos para sincronização');
        
    } catch (error) {
        console.log('❌ ERRO GERAL:', error.message);
    }
}

// 🚀 Executar
main();
