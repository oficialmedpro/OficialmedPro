import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const SPRINTHUB_BASE_URL = Deno.env.get('VITE_SPRINTHUB_BASE_URL')
    const SPRINTHUB_TOKEN = Deno.env.get('VITE_SPRINTHUB_API_TOKEN')
    const SPRINTHUB_INSTANCE = Deno.env.get('VITE_SPRINTHUB_INSTANCE') || 'oficialmed'
    const SB_URL = Deno.env.get('SB_URL')
    const SERVICE_KEY = Deno.env.get('SERVICE_KEY')

    if (!SPRINTHUB_BASE_URL || !SPRINTHUB_TOKEN || !SB_URL || !SERVICE_KEY) {
      throw new Error('Configurações de ambiente não encontradas')
    }

    console.log('🚀 Iniciando processamento de segmentos automáticos...')

    // 1. Buscar segmentos automáticos ativos que precisam ser executados
    const segmentosResponse = await fetch(`${SB_URL}/rest/v1/segmento_automatico?ativo=eq.true&proxima_execucao=lte.${new Date().toISOString()}&select=*`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!segmentosResponse.ok) {
      throw new Error(`Erro ao buscar segmentos automáticos: ${segmentosResponse.status}`)
    }

    const segmentos = await segmentosResponse.json()
    console.log(`📋 Encontrados ${segmentos.length} segmentos para processar`)

    const resultados = []

    for (const segmentoAuto of segmentos) {
      console.log(`🔄 Processando segmento: ${segmentoAuto.nome} (ID: ${segmentoAuto.segmento_id})`)
      
      try {
        const resultado = await processarSegmento(segmentoAuto, {
          SPRINTHUB_BASE_URL,
          SPRINTHUB_TOKEN,
          SPRINTHUB_INSTANCE,
          SB_URL,
          SERVICE_KEY
        })

        // Atualizar próxima execução
        const proximaExecucao = new Date()
        proximaExecucao.setHours(proximaExecucao.getHours() + segmentoAuto.frequencia_horas)

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
        })

        resultados.push({
          segmento_id: segmentoAuto.segmento_id,
          nome: segmentoAuto.nome,
          ...resultado
        })

      } catch (error) {
        console.error(`❌ Erro ao processar segmento ${segmentoAuto.nome}:`, error)
        resultados.push({
          segmento_id: segmentoAuto.segmento_id,
          nome: segmentoAuto.nome,
          erro: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${segmentos.length} segmentos processados`,
        resultados
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        } 
      }
    )

  } catch (err: any) {
    console.error('❌ Erro geral:', err)
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
    })
  }
})

async function processarSegmento(segmentoAuto: any, config: any) {
  const stats = {
    leadsInseridos: 0,
    leadsAtualizados: 0,
    leadsEnviadosCallix: 0,
    totalProcessados: 0,
    erros: 0
  }

  // 1. Buscar leads do segmento no SprintHub
  const leadsSprintHub = await buscarLeadsSprintHub(segmentoAuto.segmento_id, config)
  console.log(`📊 Encontrados ${leadsSprintHub.length} leads no SprintHub`)

  // 2. Processar cada lead
  for (const lead of leadsSprintHub) {
    try {
      stats.totalProcessados++

      // Verificar se lead já existe no Supabase
      const existingLead = await verificarLeadExiste(lead.id, config)
      
      if (existingLead) {
        // Atualizar lead existente
        await atualizarLead(lead.id, segmentoAuto.segmento_id, config)
        stats.leadsAtualizados++
      } else {
        // Inserir novo lead
        await inserirLead(lead.id, segmentoAuto.segmento_id, config)
        stats.leadsInseridos++
      }

      // 3. Se configurado para enviar ao Callix, verificar se já foi enviado
      if (segmentoAuto.enviar_callix) {
        const jaEnviado = await verificarLeadEnviadoCallix(lead.id, segmentoAuto.segmento_id, config)
        
        if (!jaEnviado) {
          // Enviar para Callix (implementar integração real)
          const enviado = await enviarParaCallix(lead, segmentoAuto.segmento_id, config)
          if (enviado) {
            stats.leadsEnviadosCallix++
          }
        }
      }

      // Delay entre leads
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      stats.erros++
      console.error(`❌ Erro ao processar lead ${lead.id}:`, error)
    }
  }

  console.log(`✅ Segmento ${segmentoAuto.nome} processado:`, stats)
  return stats
}

async function buscarLeadsSprintHub(segmentoId: number, config: any) {
  const url = `https://${config.SPRINTHUB_BASE_URL}/leadsfromtype/segment/${segmentoId}?i=${config.SPRINTHUB_INSTANCE}&apitoken=${config.SPRINTHUB_TOKEN}`
  const requestBody = {
    "page": 0,
    "limit": 100,
    "orderByKey": "createDate",
    "orderByDirection": "desc",
    "showAnon": false,
    "search": "",
    "query": "{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}",
    "showArchived": false,
    "additionalFilter": null,
    "idOnly": false
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Erro ao buscar leads: ${response.status}`)
  }

  const data = await response.json()
  return data?.data?.leads || []
}

async function verificarLeadExiste(leadId: number, config: any) {
  const response = await fetch(`${config.SB_URL}/rest/v1/leads?id=eq.${leadId}&select=id`, {
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    const data = await response.json()
    return data.length > 0
  }
  return false
}

async function buscarDadosCompletosLead(leadId: number, config: any) {
  const url = `https://${config.SPRINTHUB_BASE_URL}/leads/${leadId}?i=${config.SPRINTHUB_INSTANCE}&allFields=1&apitoken=${config.SPRINTHUB_TOKEN}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Erro ao buscar dados do lead: ${response.status}`)
  }

  const data = await response.json()
  return data?.data?.lead
}

function mapearDadosLead(lead: any, segmentoId: number) {
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
  }
}

async function inserirLead(leadId: number, segmentoId: number, config: any) {
  const fullLeadData = await buscarDadosCompletosLead(leadId, config)
  const mappedData = mapearDadosLead(fullLeadData, segmentoId)

  const response = await fetch(`${config.SB_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(mappedData)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao inserir lead: ${error}`)
  }
}

async function atualizarLead(leadId: number, segmentoId: number, config: any) {
  const fullLeadData = await buscarDadosCompletosLead(leadId, config)
  const mappedData = mapearDadosLead(fullLeadData, segmentoId)

  const response = await fetch(`${config.SB_URL}/rest/v1/leads?id=eq.${leadId}`, {
    method: 'PATCH',
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(mappedData)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao atualizar lead: ${error}`)
  }
}

async function verificarLeadEnviadoCallix(leadId: number, segmentoId: number, config: any) {
  const response = await fetch(`${config.SB_URL}/rest/v1/lead_callix_status?lead_id=eq.${leadId}&segmento_id=eq.${segmentoId}&select=enviado_callix`, {
    headers: {
      'apikey': config.SERVICE_KEY,
      'Authorization': `Bearer ${config.SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    const data = await response.json()
    return data.length > 0 && data[0].enviado_callix
  }
  return false
}

async function enviarParaCallix(lead: any, segmentoId: number, config: any) {
  try {
    // TODO: Implementar integração real com Callix API
    // Por enquanto, simular o envio
    
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
        callix_id: `callix_${lead.id}_${Date.now()}`,
        status_callix: 'pending'
      })
    })

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
        callix_id: `callix_${lead.id}_${Date.now()}`,
        status_callix: 'pending'
      })
    })

    return true
  } catch (error) {
    console.error('Erro ao enviar para Callix:', error)
    return false
  }
}
