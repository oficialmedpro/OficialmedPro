import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  console.log('🕐 INICIANDO SINCRONIZAÇÃO HORÁRIA AUTOMÁTICA - Edge Function');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    // Configurações de ambiente
    const SPRINTHUB_BASE_URL = Deno.env.get('VITE_SPRINTHUB_BASE_URL');
    const SPRINTHUB_TOKEN = Deno.env.get('VITE_SPRINTHUB_API_TOKEN');
    const SPRINTHUB_INSTANCE = Deno.env.get('VITE_SPRINTHUB_INSTANCE') || 'oficialmed';
    const SB_URL = Deno.env.get('SB_URL');
    const SERVICE_KEY = Deno.env.get('SERVICE_KEY');

    if (!SPRINTHUB_BASE_URL || !SPRINTHUB_TOKEN || !SB_URL || !SERVICE_KEY) {
      throw new Error('Configurações de ambiente não encontradas');
    }

    const CONFIG = {
      FUNIS: {
        6: {
          name: 'COMERCIAL',
          stages: [130, 231, 82, 207, 83, 85, 232],
          unit: '[1]'
        },
        14: {
          name: 'RECOMPRA',
          stages: [202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 167, 148, 168, 149, 169, 150],
          unit: '[1]'
        }
      },
      HOURS_BACK: 48,
      PAGE_LIMIT: 50,
      BATCH_SIZE: 5,
      MAX_RETRIES: 3
    };

    // Estatísticas
    const stats = {
      startTime: Date.now(),
      totalApiCalls: 0,
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      funis: {} as Record<number, any>
    };

    // Inicializar stats dos funis
    for (const funnelId of Object.keys(CONFIG.FUNIS)) {
      stats.funis[parseInt(funnelId)] = {
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 0
      };
    }

    console.log('📊 Iniciando sincronização dos funis 6 e 14...');
    console.log(`⏰ Período: Últimas ${CONFIG.HOURS_BACK} horas`);

    // Calcular data limite (48 horas atrás)
    const hoursBack = CONFIG.HOURS_BACK;
    const dateLimit = new Date();
    dateLimit.setHours(dateLimit.getHours() - hoursBack);
    const dateLimitStr = dateLimit.toISOString().split('T')[0];

    // Processar cada funil
    for (const [funnelIdStr, funnelConfig] of Object.entries(CONFIG.FUNIS)) {
      const funnelId = parseInt(funnelIdStr);
      console.log(`\n🔄 Processando Funil ${funnelId} (${funnelConfig.name})...`);

      // Processar cada stage do funil
      for (const stageId of funnelConfig.stages) {
        console.log(`  📋 Stage ${stageId}...`);

        let page = 0;
        let hasMore = true;

        while (hasMore) {
          try {
            // Buscar oportunidades da stage
            const url = `https://${SPRINTHUB_BASE_URL}/opportunitiesfromtype/stage/${stageId}?i=${SPRINTHUB_INSTANCE}&apitoken=${SPRINTHUB_TOKEN}`;
            
            const requestBody = {
              page,
              limit: CONFIG.PAGE_LIMIT,
              orderByKey: "updateDate",
              orderByDirection: "desc",
              showAnon: false,
              search: "",
              query: "{total,opportunities{id,title,amount,stage,status,origin,updateDate,createdAt,leadId}}",
              showArchived: false,
              additionalFilter: null,
              idOnly: false
            };

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(requestBody)
            });

            stats.totalApiCalls++;

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const opportunities = data?.data?.opportunities || [];

            if (opportunities.length === 0) {
              hasMore = false;
              break;
            }

            console.log(`    ✓ ${opportunities.length} oportunidades encontradas (página ${page})`);

            // Filtrar por data (últimas 48h)
            const recentOpps = opportunities.filter((opp: any) => {
              const updateDate = opp.updateDate || opp.createdAt;
              if (!updateDate) return false;
              const oppDate = new Date(updateDate);
              return oppDate >= dateLimit;
            });

            console.log(`    📅 ${recentOpps.length} oportunidades recentes (últimas ${hoursBack}h)`);

            if (recentOpps.length === 0) {
              hasMore = false;
              break;
            }

            // Processar oportunidades em batch
            for (let i = 0; i < recentOpps.length; i += CONFIG.BATCH_SIZE) {
              const batch = recentOpps.slice(i, i + CONFIG.BATCH_SIZE);
              
              await Promise.all(batch.map(async (opp: any) => {
                try {
                  stats.totalProcessed++;

                  // Mapear dados
                  const mappedData = {
                    id: opp.id,
                    title: opp.title || null,
                    value: parseFloat(opp.amount) || 0,
                    status: opp.status || null,
                    crm_column: stageId,
                    funil_id: funnelId,
                    lead_id: opp.leadId || null,
                    create_date: opp.createdAt || null,
                    update_date: opp.updateDate || null,
                    origem_oportunidade: opp.origin || null,
                    unidade_id: funnelConfig.unit,
                    archived: 0,
                    synced_at: new Date().toISOString()
                  };

                  // Verificar se existe
                  const checkResponse = await fetch(
                    `${SB_URL}/rest/v1/oportunidade_sprint?select=id,synced_at&id=eq.${opp.id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY,
                        'Accept-Profile': 'api',
                        'Content-Profile': 'api'
                      }
                    }
                  );

                  const existing = await checkResponse.json();

                  if (!existing || existing.length === 0) {
                    // INSERIR
                    const insertResponse = await fetch(`${SB_URL}/rest/v1/oportunidade_sprint`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY,
                        'Content-Type': 'application/json',
                        'Accept-Profile': 'api',
                        'Content-Profile': 'api',
                        'Prefer': 'return=minimal'
                      },
                      body: JSON.stringify(mappedData)
                    });

                    if (insertResponse.ok) {
                      stats.totalInserted++;
                      stats.funis[funnelId].inserted++;
                    } else {
                      stats.totalErrors++;
                      stats.funis[funnelId].errors++;
                    }
                  } else {
                    // ATUALIZAR
                    const updateResponse = await fetch(
                      `${SB_URL}/rest/v1/oportunidade_sprint?id=eq.${opp.id}`,
                      {
                        method: 'PATCH',
                        headers: {
                          'Authorization': `Bearer ${SERVICE_KEY}`,
                          'apikey': SERVICE_KEY,
                          'Content-Type': 'application/json',
                          'Accept-Profile': 'api',
                          'Content-Profile': 'api',
                          'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(mappedData)
                      }
                    );

                    if (updateResponse.ok) {
                      stats.totalUpdated++;
                      stats.funis[funnelId].updated++;
                    } else {
                      stats.totalErrors++;
                      stats.funis[funnelId].errors++;
                    }
                  }
                } catch (error) {
                  stats.totalErrors++;
                  stats.funis[funnelId].errors++;
                  console.error(`❌ Erro ao processar oportunidade ${opp.id}:`, error);
                }
              }));
            }

            // Próxima página
            page++;

            // Limitar páginas para evitar loops infinitos
            if (page > 20) {
              hasMore = false;
            }

          } catch (error) {
            console.error(`❌ Erro ao processar stage ${stageId}:`, error);
            hasMore = false;
          }
        }
      }
    }

    // Calcular tempo total
    const totalTime = (Date.now() - stats.startTime) / 1000;

    console.log('\n✅ SINCRONIZAÇÃO CONCLUÍDA');
    console.log(`⏱️ Tempo: ${totalTime.toFixed(1)}s`);
    console.log(`📊 Total: ${stats.totalProcessed} processadas`);
    console.log(`✅ Inseridas: ${stats.totalInserted}`);
    console.log(`🔄 Atualizadas: ${stats.totalUpdated}`);
    console.log(`❌ Erros: ${stats.totalErrors}`);

    // Registrar no banco de dados - tabela api.sync_control
    const syncRecord = {
      job_name: 'sync_hourly_cron',
      started_at: new Date(stats.startTime).toISOString(),
      completed_at: new Date().toISOString(),
      status: 'success',
      total_processed: stats.totalProcessed,
      total_inserted: stats.totalInserted,
      total_updated: stats.totalUpdated,
      total_errors: stats.totalErrors,
      execution_time_seconds: parseFloat(totalTime.toFixed(2)),
      details: {
        funis: stats.funis,
        hours_back: CONFIG.HOURS_BACK,
        api_calls: stats.totalApiCalls
      }
    };

    // Salvar na tabela de controle
    await fetch(`${SB_URL}/rest/v1/sync_control`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(syncRecord)
    });

    // Também manter compatibilidade com tabela antiga (sincronizacao)
    const description = `Sync horária automática: ${stats.totalProcessed} processadas | ${stats.totalInserted} inseridas | ${stats.totalUpdated} atualizadas`;
    await fetch(`${SB_URL}/rest/v1/sincronizacao`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        created_at: new Date().toISOString(),
        data: new Date().toISOString(),
        descricao: description
      })
    });

    console.log('📝 Registro de sincronização salvo no banco de dados');

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização horária concluída',
        stats: {
          totalProcessed: stats.totalProcessed,
          totalInserted: stats.totalInserted,
          totalUpdated: stats.totalUpdated,
          totalErrors: stats.totalErrors,
          executionTime: totalTime,
          funis: stats.funis
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);

    // Registrar erro no banco
    try {
      const SB_URL = Deno.env.get('SB_URL');
      const SERVICE_KEY = Deno.env.get('SERVICE_KEY');
      
      if (SB_URL && SERVICE_KEY) {
        await fetch(`${SB_URL}/rest/v1/sync_control`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
            'Content-Type': 'application/json',
            'Accept-Profile': 'api',
            'Content-Profile': 'api',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            job_name: 'sync_hourly_cron',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: 'error',
            error_message: error.message,
            details: {
              error_stack: error.stack
            }
          })
        });
      }
    } catch (logError) {
      console.error('⚠️ Erro ao registrar erro:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
});


