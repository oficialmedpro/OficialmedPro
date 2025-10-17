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

  // Registrar início do job
  let logId = null;
  try {
    const logResponse = await fetch(`${Deno.env.get('SB_URL')}/rest/v1/rpc/log_cron_job_start`, {
      method: 'POST',
      headers: {
        'apikey': Deno.env.get('SERVICE_KEY'),
        'Authorization': `Bearer ${Deno.env.get('SERVICE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_job_name: 'process_auto_segments',
        p_message: 'Iniciando processamento de segmentos automáticos'
      })
    });
    if (logResponse.ok) {
      logId = await logResponse.json();
      console.log(`📝 Log de execução iniciado com ID: ${logId}`);
    }
  } catch (logError) {
    console.warn('⚠️ Erro ao registrar início do log:', logError);
  }

  try {
    const SPRINTHUB_BASE_URL = Deno.env.get('VITE_SPRINTHUB_BASE_URL');
    const SPRINTHUB_TOKEN = Deno.env.get('VITE_SPRINTHUB_API_TOKEN');
    const SPRINTHUB_INSTANCE = Deno.env.get('VITE_SPRINTHUB_INSTANCE') || 'oficialmed';
    const SB_URL = Deno.env.get('SB_URL');
    const SERVICE_KEY = Deno.env.get('SERVICE_KEY');

    if (!SPRINTHUB_BASE_URL || !SPRINTHUB_TOKEN || !SB_URL || !SERVICE_KEY) {
      throw new Error('Configurações de ambiente não encontradas');
    }

    console.log('🚀 Iniciando processamento de segmentos automáticos...');

    // 1. Buscar segmentos automáticos ativos (execução manual ignora proxima_execucao)
    const segmentosResponse = await fetch(`${SB_URL}/rest/v1/segmento_automatico?ativo=eq.true&select=*`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!segmentosResponse.ok) {
      throw new Error(`Erro ao buscar segmentos automáticos: ${segmentosResponse.status}`);
    }

    const segmentos = await segmentosResponse.json();
    console.log(`📋 Encontrados ${segmentos.length} segmentos para processar`);

    const resultados = [];

    for (const segmentoAuto of segmentos) {
      console.log(`🔄 Processando segmento: ${segmentoAuto.nome} (ID: ${segmentoAuto.segmento_id})`);
      try {
        const resultado = await processarSegmento(segmentoAuto, {
          SPRINTHUB_BASE_URL,
          SPRINTHUB_TOKEN,
          SPRINTHUB_INSTANCE,
          SB_URL,
          SERVICE_KEY
        });

        // Atualizar próxima execução
        const proximaExecucao = new Date();
        proximaExecucao.setHours(proximaExecucao.getHours() + segmentoAuto.frequencia_horas);

        await fetch(`${SB_URL}/rest/v1/segmento_automatico?id=eq.${segmentoAuto.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ultima_execucao: new Date().toISOString(),
            proxima_execucao: proximaExecucao.toISOString(),
            total_leads_processados: (segmentoAuto.total_leads_processados || 0) + resultado.totalProcessados,
            total_leads_enviados_callix: (segmentoAuto.total_leads_enviados_callix || 0) + resultado.totalEnviadosCallix,
            updated_at: new Date().toISOString()
          })
        });

        resultados.push({
          segmento_id: segmentoAuto.segmento_id,
          nome: segmentoAuto.nome,
          ...resultado
        });
      } catch (error) {
        console.error(`❌ Erro ao processar segmento ${segmentoAuto.nome}:`, error);
        resultados.push({
          segmento_id: segmentoAuto.segmento_id,
          nome: segmentoAuto.nome,
          erro: error.message
        });
      }
    }

    // Registrar sucesso do job
    if (logId) {
      try {
        await fetch(`${Deno.env.get('SB_URL')}/rest/v1/rpc/log_cron_job_success`, {
          method: 'POST',
          headers: {
            'apikey': Deno.env.get('SERVICE_KEY'),
            'Authorization': `Bearer ${Deno.env.get('SERVICE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_log_id: logId,
            p_message: `${segmentos.length} segmentos processados com sucesso`,
            p_details: {
              segmentos_processados: segmentos.length,
              resultados: resultados
            }
          })
        });
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar sucesso do log:', logError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${segmentos.length} segmentos processados`,
      resultados
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (err) {
    console.error('❌ Erro geral:', err);
    
    // Registrar erro do job
    if (logId) {
      try {
        await fetch(`${Deno.env.get('SB_URL')}/rest/v1/rpc/log_cron_job_error`, {
          method: 'POST',
          headers: {
            'apikey': Deno.env.get('SERVICE_KEY'),
            'Authorization': `Bearer ${Deno.env.get('SERVICE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_log_id: logId,
            p_error_message: err.message,
            p_details: {
              error_type: 'general_error',
              stack: err.stack
            }
          })
        });
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar erro do log:', logError);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
});

async function processarSegmento(segmentoAuto, config) {
  const stats = {
    leadsInseridos: 0,
    leadsAtualizados: 0,
    leadsEnviadosCallix: 0,
    totalProcessados: 0,
    erros: 0
  };

  // 1. Buscar leads do segmento no SprintHub
  const leadsSprintHub = await buscarLeadsSprintHub(segmentoAuto.segmento_id, config);
  console.log(`📊 Encontrados ${leadsSprintHub.length} leads no SprintHub`);

  // 2. Processar cada lead
  for (const lead of leadsSprintHub) {
    try {
      stats.totalProcessados++;
      console.log(`🔄 Processando lead ${lead.id} (${stats.totalProcessados}/${leadsSprintHub.length})`);

      // Verificar se lead já existe no Supabase
      const existingLead = await verificarLeadExiste(lead.id, config);
      if (existingLead) {
        // Atualizar lead existente
        await atualizarLead(lead.id, segmentoAuto.segmento_id, config);
        stats.leadsAtualizados++;
        console.log(`✅ Lead ${lead.id} atualizado`);
      } else {
        // Inserir novo lead
        await inserirLead(lead.id, segmentoAuto.segmento_id, config);
        stats.leadsInseridos++;
        console.log(`✅ Lead ${lead.id} inserido`);
      }

      // 3. Se configurado para enviar ao Callix, verificar se já foi enviado
      if (segmentoAuto.enviar_callix) {
        const jaEnviado = await verificarLeadEnviadoCallix(lead.id, segmentoAuto.segmento_id, config);
        if (!jaEnviado) {
          // Enviar para Callix (implementar integração real)
          const enviado = await enviarParaCallix(lead, segmentoAuto.segmento_id, config);
          if (enviado) {
            stats.leadsEnviadosCallix++;
            console.log(`📤 Lead ${lead.id} enviado para Callix`);
          } else {
            console.log(`❌ Falha ao enviar lead ${lead.id} para Callix`);
          }
        } else {
          console.log(`ℹ️ Lead ${lead.id} já foi enviado para Callix`);
        }
      }

      // Delay entre leads
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      stats.erros++;
      console.error(`❌ Erro ao processar lead ${lead.id}:`, error);
      // Continuar processamento mesmo com erro
      continue;
    }
  }

  console.log(`✅ Segmento ${segmentoAuto.nome} processado:`, stats);
  return stats;
}

async function buscarLeadsSprintHub(segmentoId, config) {
  const url = `https://${config.SPRINTHUB_BASE_URL}/leadsfromtype/segment/${segmentoId}?i=${config.SPRINTHUB_INSTANCE}&apitoken=${config.SPRINTHUB_TOKEN}`;
  
  let allLeads = [];
  let page = 0;
  const limit = 100; // Buscar 100 por vez
  let hasMore = true;

  try {
    while (hasMore) {
      const requestBody = {
        "page": page,
        "limit": limit,
        "orderByKey": "createDate",
        "orderByDirection": "desc",
        "showAnon": false,
        "search": "",
        "query": "{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}",
        "showArchived": false,
        "additionalFilter": null,
        "idOnly": false
      };

      console.log(`🔍 Buscando página ${page + 1} do segmento ${segmentoId}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar leads: ${response.status}`);
      }

      const data = await response.json();
      const leads = data?.data?.leads || [];
      
      allLeads = allLeads.concat(leads);
      
      console.log(`✅ Página ${page + 1}: ${leads.length} leads encontrados (Total: ${allLeads.length})`);
      
      // Se retornou menos que o limite, não há mais páginas
      if (leads.length < limit) {
        hasMore = false;
      } else {
        page++;
        // Delay entre páginas para respeitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🎯 Total de leads encontrados no segmento: ${allLeads.length}`);
    return allLeads;

  } catch (error) {
    console.error(`❌ Erro ao buscar leads do segmento: ${error.message}`);
    return allLeads; // Retornar o que conseguiu buscar até agora
  }
}

async function verificarLeadExiste(leadId, config) {
  const response = await fetch(`${config.SB_URL}/rest/v1/leads?id=eq.${leadId}&select=id`, {
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data.length > 0;
  }
  return false;
}

async function buscarDadosCompletosLead(leadId, config) {
  const url = `https://${config.SPRINTHUB_BASE_URL}/leads/${leadId}?i=${config.SPRINTHUB_INSTANCE}&allFields=1&apitoken=${config.SPRINTHUB_TOKEN}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar dados do lead: ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.lead;
}

function mapearDadosLead(lead, segmentoId) {
  return {
    id: lead.id,
    firstname: lead.firstname || null,
    lastname: lead.lastname || null,
    email: lead.email || null,
    phone: lead.phone || null,
    whatsapp: lead.whatsapp || null,
    mobile: lead.mobile || null,
    photo_url: lead.photoUrl || null,
    address: lead.address || null,
    city: lead.city || null,
    state: lead.state || null,
    country: lead.country || null,
    zipcode: lead.zipcode || null,
    timezone: lead.timezone || null,
    bairro: lead.bairro || null,
    complemento: lead.complemento || null,
    numero_entrega: lead.numeroEntrega || null,
    rua_entrega: lead.ruaEntrega || null,
    company: lead.company || null,
    points: parseInt(lead.points) || 0,
    owner: lead.owner?.id || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferredLocale || null,
    user_access: lead.userAccess || null,
    department_access: lead.departmentAccess || null,
    ignore_sub_departments: lead.ignoreSubDepartments || false,
    create_date: lead.createDate || null,
    updated_date: lead.updatedDate || null,
    last_active: lead.lastActive || null,
    created_by: lead.createdBy?.id || null,
    created_by_name: lead.createdBy?.name || null,
    created_by_type: lead.createdByType || null,
    updated_by: lead.updatedBy?.id || null,
    updated_by_name: lead.updatedBy?.name || null,
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData || null,
    capital_de_investimento: lead.capitalDeInvestimento || null,
    tipo_de_compra: lead.tipoDeCompra || null,
    pedidos_shopify: lead.pedidosShopify || null,
    categoria: lead.categoria || null,
    classificacao_google: lead.classificacaoGoogle || null,
    grau_de_interesse: lead.grauDeInteresse || null,
    star_score: lead.starScore || null,
    avaliacao_atendente: lead.avaliacaoAtendente || null,
    avaliacao_atendimento: lead.avaliacaoAtendimento || null,
    qualificacao_callix: lead.qualificacaoCallix || null,
    origem: lead.origem || null,
    origem_manipulacao: lead.origemManipulacao || null,
    lista_de_origem: lead.listaDeOrigem || null,
    criativo: lead.criativo || null,
    plataforma: lead.plataforma || null,
    redes_sociais: lead.redesSociais || null,
    site: lead.site || null,
    atendente: lead.atendente || null,
    atendente_atual: lead.atendenteAtual || null,
    feedback: lead.feedback || null,
    observacao: lead.observacao || null,
    observacoes_do_lead: lead.observacoesDoLead || null,
    comportamento_da_ia: lead.comportamentoDaIa || null,
    retorno: lead.retorno || null,
    prescritor: lead.prescritor || null,
    produto: lead.produto || null,
    drograria: lead.drograria || null,
    data_recompra: lead.dataRecompra || null,
    mes_que_entrou: lead.mesQueEntrou || null,
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    arquivo_receita: lead.arquivoReceita || null,
    id_t56: lead.idT56 || null,
    empresa: lead.empresa || null,
    sexo: lead.sexo || null,
    data_de_nascimento: lead.dataDeNascimento || null,
    objetivos_do_cliente: lead.objetivosDoCliente || null,
    perfil_do_cliente: lead.perfilDoCliente || null,
    recebedor: lead.recebedor || null,
    whatsapp_remote_lid: lead.whatsappRemoteLid || null,
    status: lead.status || null,
    sh_status: lead.shStatus || null,
    data_do_contato: lead.dataDoContato || null,
    segmento: parseInt(segmentoId),
    enviado_callix: false,
    data_envio_callix: null,
    callix_id: null,
    status_callix: null
  };
}

async function inserirLead(leadId, segmentoId, config) {
  const fullLeadData = await buscarDadosCompletosLead(leadId, config);
  const mappedData = mapearDadosLead(fullLeadData, segmentoId);
  const response = await fetch(`${config.SB_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(mappedData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao inserir lead: ${error}`);
  }
}

async function atualizarLead(leadId, segmentoId, config) {
  const fullLeadData = await buscarDadosCompletosLead(leadId, config);
  const mappedData = mapearDadosLead(fullLeadData, segmentoId);
  const response = await fetch(`${config.SB_URL}/rest/v1/leads?id=eq.${leadId}`, {
    method: 'PATCH',
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(mappedData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao atualizar lead: ${error}`);
  }
}

async function verificarLeadEnviadoCallix(leadId, segmentoId, config) {
  const response = await fetch(`${config.SB_URL}/rest/v1/lead_callix_status?lead_id=eq.${leadId}&segmento_id=eq.${segmentoId}&select=enviado_callix`, {
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data.length > 0 && data[0].enviado_callix;
  }
  return false;
}

async function enviarParaCallix(lead, segmentoId, config) {
  try {
    // Buscar campaign_id do segmento automático
    const segmentoResponse = await fetch(`${config.SB_URL}/rest/v1/segmento_automatico?segmento_id=eq.${segmentoId}&select=campaign_id`, {
      headers: {
        'apikey': config.SERVICE_KEY,
        'Authorization': `Bearer ${config.SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!segmentoResponse.ok) {
      throw new Error(`Erro ao buscar campaign_id: ${segmentoResponse.status}`);
    }

    const segmentoData = await segmentoResponse.json();
    if (!segmentoData || segmentoData.length === 0 || !segmentoData[0].campaign_id) {
      throw new Error('Campaign ID não encontrado para o segmento');
    }

    const campaignId = segmentoData[0].campaign_id;
    console.log(`📤 Enviando lead ${lead.id} para Callix (campaign: ${campaignId})`);

    // 🎯 CORREÇÃO: Usar função corrigida para telefone
    const telefoneCorrigido = corrigirTelefoneBrasileiro(lead.whatsapp || lead.phone || '');

    // Enviar para Callix API
    const callixResponse = await fetch('https://oficialmed.callix.com.br/api/v1/campaign_contacts_async', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 68b46239-a040-4703-b8e9-c0b25b519e64`,
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: "campaign_contacts_async",
          attributes: {
            remove_duplicated_phones: "true",
            import_data: [
              {
                Nome: lead.firstname || 'Lead sem nome',
                Sobrenome: lead.lastname || '',
                link: `https://oficialmed.sprinthub.app/sh/leads/profile/${lead.id}`,
                email: lead.email || '',
                telefone: telefoneCorrigido, // 🎯 USANDO TELEFONE CORRIGIDO
                cidade: lead.city || '',
                estado: lead.state || '',
                'Data-compra': lead.data_ultima_compra ? formatarDataDDMMAAAA(lead.data_ultima_compra) : '',
                Observacao: lead.observacao || '',
                Formula: lead.descricao_formula || '',
                'tipo-compra': lead.tipo_de_compra || '',
                'objetivo-cliente': lead.objetivos_do_cliente || ''
              }
            ]
          },
          relationships: {
            campaign_list: {
              data: {
                type: "campaign_lists",
                id: campaignId
              }
            }
          }
        }
      })
    });

    if (!callixResponse.ok) {
      const errorText = await callixResponse.text();
      throw new Error(`Callix API error ${callixResponse.status}: ${errorText}`);
    }

    const callixResult = await callixResponse.json();
    console.log(`✅ Lead ${lead.id} enviado para Callix:`, callixResult.data.id);

    // Registrar no controle de status
    await fetch(`${config.SB_URL}/rest/v1/lead_callix_status`, {
      method: 'POST',
      headers: {
        'apikey': config.SERVICE_KEY,
        'Authorization': `Bearer ${config.SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        lead_id: lead.id,
        segmento_id: segmentoId,
        enviado_callix: true,
        data_envio_callix: new Date().toISOString(),
        callix_id: callixResult.data.id.toString(),
        status_callix: 'sent'
      })
    });

    // Atualizar na tabela leads também
    await fetch(`${config.SB_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': config.SERVICE_KEY,
        'Authorization': `Bearer ${config.SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        enviado_callix: true,
        data_envio_callix: new Date().toISOString(),
        callix_id: callixResult.data.id.toString(),
        status_callix: 'sent'
      })
    });

    // Delay para respeitar rate limit (1 req/min = 60 segundos entre requests)
    console.log('⏳ Aguardando 60s para respeitar rate limit do Callix (1 req/min)...');
    await new Promise((resolve) => setTimeout(resolve, 60000));
    return true;

    } catch (error) {
      console.error(`❌ Erro ao enviar lead ${lead.id} para Callix:`, error);
      
      // Registrar erro no status
      try {
        await fetch(`${config.SB_URL}/rest/v1/lead_callix_status`, {
          method: 'POST',
          headers: {
            'apikey': config.SERVICE_KEY,
            'Authorization': `Bearer ${config.SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            lead_id: lead.id,
            segmento_id: segmentoId,
            enviado_callix: false,
            tentativas_envio: 1,
            ultimo_erro: error.message
          })
        });
      } catch (statusError) {
        console.error('❌ Erro ao registrar status:', statusError);
      }
      // Continuar processamento mesmo com erro
      return false;
    }
}

// 🎯 FUNÇÃO CORRIGIDA PARA TELEFONE BRASILEIRO
function corrigirTelefoneBrasileiro(telefone) {
  try {
    if (!telefone || telefone.trim() === '') {
      return '';
    }
    
    // Remover espaços e caracteres especiais
    let telLimpo = telefone.replace(/\D/g, '');
    
    // Se começa com 55 (DDI do Brasil), remover
    if (telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // Se ainda tem mais de 11 dígitos após remover DDI, pode ser que tenha 55 duplicado
    if (telLimpo.length > 11 && telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // 🎯 NOVA LÓGICA: Adicionar 9 faltante após DDD
    if (telLimpo.length === 10) {
      // Telefone tem 10 dígitos: DDD + 8 dígitos
      // Formato correto: DDD + 9 + 8 dígitos = 11 dígitos
      const ddd = telLimpo.substring(0, 2);  // Primeiros 2 dígitos (DDD)
      const numero = telLimpo.substring(2);   // Últimos 8 dígitos
      telLimpo = ddd + '9' + numero;         // Adicionar 9 após DDD
      
      console.log(`📱 Telefone corrigido: ${telefone} → ${telLimpo} (adicionado 9 após DDD)`);
    } else if (telLimpo.length === 11) {
      // Telefone já tem 11 dígitos: DDD + 9 + 8 dígitos (formato correto)
      console.log(`📱 Telefone já correto: ${telefone} → ${telLimpo} (11 dígitos)`);
    } else {
      // Telefone com número de dígitos inválido
      console.warn(`⚠️ Telefone com formato inválido: ${telefone} → ${telLimpo} (${telLimpo.length} dígitos)`);
    }
    
    return telLimpo;
    
  } catch (error) {
    console.error('❌ Erro ao processar telefone:', telefone, error);
    return telefone; // Retornar original em caso de erro
  }
}

// Função para formatar data no formato DD/MM/AAAA
function formatarDataDDMMAAAA(data) {
  try {
    let dataObj;
    if (typeof data === 'string') {
      // Se já está no formato ISO (YYYY-MM-DD), converter
      if (data.includes('T')) {
        dataObj = new Date(data);
      } else if (data.includes('-')) {
        // Formato YYYY-MM-DD
        dataObj = new Date(data + 'T00:00:00');
      } else if (data.includes('/')) {
        // Já está no formato DD/MM/YYYY ou MM/DD/YYYY
        const partes = data.split('/');
        if (partes.length === 3) {
          // Assumir DD/MM/YYYY se o primeiro número for <= 12
          if (parseInt(partes[0]) <= 12) {
            dataObj = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
          } else {
            // Assumir MM/DD/YYYY
            dataObj = new Date(parseInt(partes[2]), parseInt(partes[0]) - 1, parseInt(partes[1]));
          }
        } else {
          return data; // Retornar como está se não conseguir parsear
        }
      } else {
        dataObj = new Date(data);
      }
    } else {
      dataObj = data;
    }

    if (isNaN(dataObj.getTime())) {
      console.warn('⚠️ Data inválida:', data);
      return '';
    }

    const dia = dataObj.getDate().toString().padStart(2, '0');
    const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataObj.getFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    console.error('❌ Erro ao formatar data:', data, error);
    return '';
  }
}
