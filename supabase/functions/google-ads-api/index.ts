import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-profile, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Cache de credenciais
let cachedCredentials: any = null
let credentialsExpiry: number | null = null

// Mapeamento de status do Google Ads
const statusMap: { [key: number]: string } = {
  2: 'ENABLED',
  3: 'PAUSED',
  4: 'REMOVED'
}

/**
 * Busca credenciais do Google Ads APENAS dos Secrets
 */
async function getGoogleAdsCredentials(customCustomerId?: string) {
  try {
    // Verificar se o cache ainda é válido (5 minutos)
    if (cachedCredentials && credentialsExpiry && Date.now() < credentialsExpiry) {
      console.log('✅ Usando credenciais em cache')
      return cachedCredentials
    }

    console.log('🔍 Buscando credenciais nos secrets (prefixo VITE_)...')

    const baseCredentials = {
      customer_id: Deno.env.get('VITE_GOOGLE_CUSTOMER_ID'),
      manager_customer_id: Deno.env.get('VITE_GOOGLE_LOGIN_CUSTOMER_ID'),
      developer_token: Deno.env.get('VITE_GOOGLE_DEVELOPER_TOKEN'),
      client_id: Deno.env.get('VITE_GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('VITE_GOOGLE_CLIENT_SECRET'),
      refresh_token: Deno.env.get('VITE_GOOGLE_REFRESH_TOKEN'),
      unidade_name: Deno.env.get('VITE_GOOGLE_ACCOUNT_LABEL') || 'Conta padrão'
    }

    const sanitizeId = (value?: string | null) => value ? value.replace(/-/g, '') : undefined

    const credentials = {
      customer_id: sanitizeId(customCustomerId || baseCredentials.customer_id),
      manager_customer_id: sanitizeId(baseCredentials.manager_customer_id),
      developer_token: baseCredentials.developer_token,
      client_id: baseCredentials.client_id,
      client_secret: baseCredentials.client_secret,
      refresh_token: baseCredentials.refresh_token,
      unidade_name: customCustomerId 
        ? `Custom (${customCustomerId})` 
        : baseCredentials.unidade_name
    }

    const missing = []
    if (!credentials.customer_id) missing.push('VITE_GOOGLE_CUSTOMER_ID')
    if (!credentials.developer_token) missing.push('VITE_GOOGLE_DEVELOPER_TOKEN')
    if (!credentials.client_id) missing.push('VITE_GOOGLE_CLIENT_ID')
    if (!credentials.client_secret) missing.push('VITE_GOOGLE_CLIENT_SECRET')
    if (!credentials.refresh_token) missing.push('VITE_GOOGLE_REFRESH_TOKEN')

    if (missing.length > 0) {
      throw new Error(`Credenciais faltando nos secrets: ${missing.join(', ')}`)
    }

    console.log('🆔 Customer ID:', credentials.customer_id)
    console.log('👔 Login Customer ID (Gerenciador):', credentials.manager_customer_id || 'Não configurado')
    console.log('🔑 Developer Token:', credentials.developer_token ? '✅ Presente' : '❌ Ausente')
    console.log('🔑 Client ID:', credentials.client_id ? `${credentials.client_id.substring(0, 15)}...` : '❌ Ausente')
    console.log('🔑 Refresh Token:', credentials.refresh_token ? `${credentials.refresh_token.substring(0, 15)}...` : '❌ Ausente')

    // Cache por 5 minutos
    cachedCredentials = credentials
    credentialsExpiry = Date.now() + (5 * 60 * 1000)

    console.log('✅ TODAS as credenciais carregadas dos secrets!')
    console.log('🔑 Developer Token:', credentials.developer_token ? `${credentials.developer_token.substring(0, 10)}...` : '❌ Ausente')
    console.log('🆔 Customer ID:', credentials.customer_id)
    console.log('🔑 Client ID:', credentials.client_id ? `${credentials.client_id.substring(0, 15)}...` : '❌ Ausente')
    return credentials

  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error)
    throw error
  }
}

/**
 * Obtém access token do Google OAuth2 SEM cache
 * Sempre renova o token a cada requisição, seguindo a documentação oficial
 */
async function getAccessToken(credentials: any) {
  try {
    console.log('🔑 Obtendo novo access token...')
    console.log('🔍 Client ID usado:', credentials.client_id ? `${credentials.client_id.substring(0, 20)}...` : '❌ Não encontrado')
    console.log('🔍 Client Secret usado:', credentials.client_secret ? '✅ Presente' : '❌ Não encontrado')
    console.log('🔍 Refresh Token usado:', credentials.refresh_token ? `${credentials.refresh_token.substring(0, 20)}...` : '❌ Não encontrado')
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token'
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Erro na resposta do Google OAuth:')
      console.error('   Status:', tokenResponse.status)
      console.error('   Erro:', errorText)
      
      // Tentar parsear o JSON do erro
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error === 'invalid_client') {
          throw new Error(`Erro de autenticação: O client_id e/ou client_secret não correspondem ao refresh_token. Verifique se as credenciais OAuth nos secrets do Supabase correspondem ao projeto que gerou este refresh_token. Erro: ${errorText}`)
        }
        if (errorJson.error === 'invalid_grant') {
          throw new Error(`Refresh token expirado ou inválido. É necessário gerar um novo refresh token. Erro: ${errorText}`)
        }
      } catch (e) {
        // Se não conseguir fazer parse, usar a mensagem original
      }
      
      throw new Error(`Token error: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Access token obtido')

    return tokenData.access_token
  } catch (error) {
    console.error('❌ Erro ao obter access token:', error)
    throw error
  }
}

/**
 * Renova o refresh token preventivamente para mantê-lo definitivo
 * Deve ser chamado periodicamente (ex: uma vez por dia)
 */
async function renewRefreshToken(credentials: any) {
  try {
    console.log('🔄 Renovando refresh token preventivamente...')
    
    const accessToken = await getAccessToken(credentials)
    
    console.log('✅ Refresh token renovado e mantido válido')
    return accessToken
  } catch (error) {
    console.error('❌ Erro ao renovar refresh token:', error)
    throw error
  }
}

/**
 * Faz query na Google Ads API
 */
async function queryGoogleAds(credentials: any, query: string) {
  try {
    const accessToken = await getAccessToken(credentials)
    
    // Usar a conta GERENCIADORA como login-customer-id (quando informada nos secrets)
    const managerCustomerId = credentials.manager_customer_id
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': credentials.developer_token,
      'Content-Type': 'application/json',
    }
    
    // SEMPRE adicionar login-customer-id (conta gerenciadora MCC)
    if (managerCustomerId) {
      headers['login-customer-id'] = managerCustomerId
      console.log(`🔑 Usando conta GERENCIADORA: ${managerCustomerId} para acessar cliente: ${credentials.customer_id}`)
    } else {
      console.log(`⚠️ AVISO: Nenhum login-customer-id configurado nos secrets (GOOGLE_ADS_MANAGER_ID_*)`)
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v21/customers/${credentials.customer_id}/googleAds:search`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          query: query
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na API Google Ads:', errorText)
      throw new Error(`Google Ads API error: ${response.status} - ${errorText}`)
    }

    // ✅ Endpoint :search retorna JSON direto
    const data = await response.json()
    console.log('🔍 Resposta da API Google Ads (v17):', JSON.stringify(data, null, 2))
    
    // Debug específico para custos
    if (data.results && data.results.length > 0) {
      console.log(`🔍 DEBUG API - Primeiro resultado da API:`)
      const firstResult = data.results[0]
      console.log(`🔍 Campaign: ${firstResult.campaign?.name} (${firstResult.campaign?.id})`)
      console.log(`🔍 Date: ${firstResult.segments?.date}`)
      console.log(`🔍 Cost Micros (API): ${firstResult.metrics?.cost_micros}`)
      console.log(`🔍 Average CPC (API): ${firstResult.metrics?.average_cpc}`)
      console.log(`🔍 Impressions (API): ${firstResult.metrics?.impressions}`)
      console.log(`🔍 Clicks (API): ${firstResult.metrics?.clicks}`)
      console.log(`🔍 Conversions (API): ${firstResult.metrics?.conversions}`)
      
      // Debug completo de TODAS as métricas
      console.log(`🔍 TODAS AS MÉTRICAS DISPONÍVEIS:`)
      console.log(`🔍 Metrics object:`, JSON.stringify(firstResult.metrics, null, 2))
      
      // Verificar se é conta de teste
      const hasClicks = firstResult.metrics?.clicks > 0
      const hasImpressions = firstResult.metrics?.impressions > 0
      const hasConversions = firstResult.metrics?.conversions > 0
      const hasCost = firstResult.metrics?.cost_micros > 0
      
      console.log(`🔍 ANÁLISE CONTA:`)
      console.log(`🔍 - Tem cliques: ${hasClicks}`)
      console.log(`🔍 - Tem impressões: ${hasImpressions}`)
      console.log(`🔍 - Tem conversões: ${hasConversions}`)
      console.log(`🔍 - Tem custos: ${hasCost}`)
      
      if (hasClicks && hasImpressions && hasConversions && !hasCost) {
        console.log(`⚠️ POSSÍVEL CONTA DE TESTE: Tem tráfego mas sem custos!`)
        console.log(`⚠️ Isso indica que a conta pode estar em modo sandbox/teste`)
      } else if (hasClicks && hasImpressions && hasConversions && hasCost) {
        console.log(`✅ CONTA REAL: Tem tráfego E custos!`)
      } else {
        console.log(`❌ PROBLEMA: Sem tráfego ou sem custos`)
      }
    }
    
    // Retornar os resultados diretamente
    return data.results || []
  } catch (error) {
    console.error('❌ Erro na query Google Ads:', error)
    throw error
  }
}

/**
 * Handler principal da Edge Function
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const originalPath = url.pathname
    let path = url.pathname.replace('/functions/v1/google-ads-api', '')
    
    // Se o path ainda contém 'google-ads-api', remover também
    if (path.startsWith('/google-ads-api')) {
      path = path.replace('/google-ads-api', '')
    }
    
    console.log(`🚀 ROTEAMENTO DEBUG:`)
    console.log(`🚀 URL completa: ${req.url}`)
    console.log(`🚀 Pathname original: ${originalPath}`)
    console.log(`🚀 Path processado: "${path}"`)
    console.log(`🚀 Método: ${req.method}`)
    console.log(`🚀 Query params: ${url.search}`)
    
    // Roteamento baseado no path
    switch (path) {
      case '/test-connection':
        return await handleTestConnection()
      
      case '/campaigns':
        const status = url.searchParams.get('status') || 'active'
        const customerId = url.searchParams.get('customer_id')
        const startDateParam = url.searchParams.get('startDate')
        const endDateParam = url.searchParams.get('endDate')
        return await handleGetCampaigns(status, customerId, startDateParam, endDateParam)
      
      case '/stats':
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        return await handleGetStats(startDate, endDate)
      
      case '/campaign-metrics':
        const campaignId = url.searchParams.get('campaign_id')
        const startDateCampaign = url.searchParams.get('start_date')
        const endDateCampaign = url.searchParams.get('end_date')
        return await handleGetCampaignMetrics(campaignId, startDateCampaign, endDateCampaign)
      
      case '/account-balance':
        return await handleGetAccountBalance()
        
      case '/debug-unidades':
        return await handleDebugUnidades()
      
      case '/renew-refresh-token':
        return await handleRenewRefreshToken()
      
      default:
        // Verificar se é um path de grupos de anúncios ou anúncios
        const campaignAdGroupsMatch = path.match(/^\/campaigns\/(\d+)\/adgroups$/)
        const adGroupAdsMatch = path.match(/^\/adgroups\/(\d+)\/ads$/)
        
        if (campaignAdGroupsMatch) {
          return await handleGetAdGroups(campaignAdGroupsMatch[1])
        }
        
        if (adGroupAdsMatch) {
          return await handleGetAds(adGroupAdsMatch[1])
        }
        
        console.log(`❌ ROTA NÃO ENCONTRADA:`)
        console.log(`❌ Path recebido: "${path}"`)
        console.log(`❌ Rotas disponíveis: ["/test-connection", "/campaigns", "/campaign-metrics", "/stats", "/account-balance", "/debug-unidades"]`)
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Endpoint não encontrado',
            debug: {
              receivedPath: path,
              originalPath: url.pathname,
              availableRoutes: ['/test-connection', '/campaigns', '/campaign-metrics', '/stats', '/account-balance', '/debug-unidades']
            }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Renova o refresh token preventivamente para mantê-lo definitivo
 * Este endpoint deve ser chamado periodicamente (ex: via cron job diariamente)
 */
async function handleRenewRefreshToken() {
  try {
    console.log('🔄 Iniciando renovação preventiva do refresh token...')
    
    const credentials = await getGoogleAdsCredentials()
    
    // Forçar renovação do access token (que mantém o refresh token ativo)
    const accessToken = await getAccessToken(credentials)
    
    // Fazer uma requisição simples para garantir que tudo está funcionando
    const testResults = await queryGoogleAds(credentials, `
      SELECT 
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `)
    
    console.log('✅ Refresh token renovado e validado com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refresh token renovado e mantido válido',
        timestamp: new Date().toISOString(),
        customerInfo: {
          customerId: credentials.customer_id,
          customerName: testResults[0]?.customer?.descriptive_name || credentials.unidade_name,
        },
        note: 'O refresh token foi usado e mantido ativo. Isso evita que ele expire.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Erro ao renovar refresh token:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao renovar refresh token',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Teste de conexão
 */
async function handleTestConnection() {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    const results = await queryGoogleAds(credentials, `
      SELECT 
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conexão estabelecida com sucesso',
        customerInfo: {
          customerId: credentials.customer_id,
          customerName: results[0]?.customer?.descriptive_name || credentials.unidade_name,
          unidade: credentials.unidade_name
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Buscar campanhas
 */
async function handleGetCampaigns(status: string, customCustomerId?: string, startDate?: string | null, endDate?: string | null) {
  try {
    const credentials = await getGoogleAdsCredentials(customCustomerId)
    
    console.log(`🔍 INÍCIO DEBUG CAMPANHAS`)
    console.log(`🔍 Filtro solicitado: ${status}`)
    console.log(`🔍 Customer ID: ${credentials.customer_id}`)
    console.log(`🔍 Developer Token: ${credentials.developer_token ? '✅ Presente' : '❌ Ausente'}`)
    console.log(`📅 startDate: ${startDate} | endDate: ${endDate}`)

    let whereClause
    if (status === 'active') {
      whereClause = "WHERE campaign.status = 'ENABLED'"
    } else if (status === 'all') {
      whereClause = "WHERE campaign.status != 'REMOVED'"
    } else {
      whereClause = "WHERE campaign.status != 'REMOVED'"
    }

    // Preparar datas (usar BETWEEN quando informadas; senão LAST_30_DAYS)
    let dateFilterClause = "AND segments.date DURING LAST_30_DAYS"
    if (startDate && endDate) {
      dateFilterClause = `AND segments.date BETWEEN '${startDate}' AND '${endDate}'`
    }

    console.log(`📝 GAQL que será executada:`)
    console.log(`SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, segments.date, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign ${whereClause} ${dateFilterClause} ORDER BY campaign.id LIMIT 1000`)

    // Consulta GAQL conforme documentação googleAds:search
    // IMPORTANTE: Para métricas de custo, precisamos usar segments.date
    const gaqlQuery = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
        ${dateFilterClause}
      ORDER BY campaign.name
      LIMIT 1000
    `
    
    console.log(`🔍 EXECUTANDO CONSULTA GAQL:`)
    console.log(gaqlQuery)
    
    const results = await queryGoogleAds(credentials, gaqlQuery)

    console.log(`📊 RESULTADO:`)
    console.log(`📊 Número de resultados: ${results.length}`)
    console.log(`📊 Dados brutos:`, JSON.stringify(results, null, 2))
    
    // Debug específico para custos
    if (results.length > 0) {
      console.log(`🔍 DEBUG CUSTOS - Primeiro resultado:`)
      const firstResult = results[0]
      console.log(`🔍 Campaign ID: ${firstResult.campaign?.id}`)
      console.log(`🔍 Campaign Name: ${firstResult.campaign?.name}`)
      console.log(`🔍 Date: ${firstResult.segments?.date}`)
      console.log(`🔍 Cost Micros: ${firstResult.metrics?.cost_micros}`)
      console.log(`🔍 Average CPC: ${firstResult.metrics?.average_cpc}`)
      console.log(`🔍 Impressions: ${firstResult.metrics?.impressions}`)
      console.log(`🔍 Clicks: ${firstResult.metrics?.clicks}`)
      console.log(`🔍 Conversions: ${firstResult.metrics?.conversions}`)
    }

    // Agrupar resultados por campanha (quando usando segments.date)
    const campaignMap = new Map()
    
    results.forEach((row: any) => {
      const campaignId = row.campaign.id
      
      if (!campaignMap.has(campaignId)) {
        // Primeira vez vendo esta campanha
        let campaignStatus = row.campaign.status
        if (typeof campaignStatus === 'number') {
          campaignStatus = statusMap[campaignStatus] || 'ENABLED'
        } else if (typeof campaignStatus === 'string') {
          campaignStatus = campaignStatus.toUpperCase()
        } else {
          campaignStatus = 'ENABLED'
        }
        
        campaignMap.set(campaignId, {
          id: row.campaign.id,
          name: row.campaign.name,
          status: campaignStatus,
          channelType: row.campaign.advertising_channel_type,
          advertising_channel_type: row.campaign.advertising_channel_type,
          type: row.campaign.advertising_channel_type || 'SEARCH',
          metrics: {
            impressions: 0,
            clicks: 0,
            ctr: 0,
            average_cpc: 0,
            cost_micros: 0,
            conversions: 0,
            conversions_value: 0
          }
        })
      }
      
      // Somar métricas (agregar dados de todas as datas)
      const existingCampaign = campaignMap.get(campaignId)
      const metrics = row.metrics || {}
      
      existingCampaign.metrics.impressions += parseInt(metrics.impressions) || 0
      existingCampaign.metrics.clicks += parseInt(metrics.clicks) || 0
      existingCampaign.metrics.cost_micros += parseInt(metrics.costMicros) || 0
      existingCampaign.metrics.conversions += parseFloat(metrics.conversions) || 0
      existingCampaign.metrics.conversions_value += parseFloat(metrics.conversions_value) || 0
      
      // Calcular médias
      if (existingCampaign.metrics.impressions > 0) {
        existingCampaign.metrics.ctr = existingCampaign.metrics.clicks / existingCampaign.metrics.impressions
      }
      if (existingCampaign.metrics.clicks > 0) {
        existingCampaign.metrics.average_cpc = existingCampaign.metrics.cost_micros / existingCampaign.metrics.clicks
      }
    })
    
    const mappedCampaigns = Array.from(campaignMap.values())
    
    console.log(`📊 CAMPANHAS AGREGADAS:`)
    mappedCampaigns.forEach(campaign => {
      console.log(`📋 ${campaign.name}: Cost=${campaign.metrics.cost_micros}, Impressions=${campaign.metrics.impressions}, Clicks=${campaign.metrics.clicks}`)
    })

    console.log(`✅ ${mappedCampaigns.length} campanhas encontradas e mapeadas`)
    console.log(`✅ Campanhas mapeadas:`, JSON.stringify(mappedCampaigns, null, 2))
    console.log(`🔍 FIM DEBUG CAMPANHAS`)

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedCampaigns,
        count: mappedCampaigns.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`❌ Erro completo ao buscar campanhas:`, error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack || 'Stack não disponível'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Buscar grupos de anúncios
 */
async function handleGetAdGroups(campaignId: string) {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    console.log(`🔍 Buscando grupos de anúncios para campanha: ${campaignId}`)

    const results = await queryGoogleAds(credentials, `
      SELECT 
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.id
      FROM ad_group
      WHERE campaign.id = ${campaignId}
        AND ad_group.status != 'REMOVED'
      ORDER BY ad_group.name
    `)

    const mappedAdGroups = results.map((row: any) => ({
      id: row.ad_group.id,
      name: row.ad_group.name,
      status: statusMap[row.ad_group.status] || row.ad_group.status,
      campaignId: row.campaign.id
    }))

    console.log(`✅ ${mappedAdGroups.length} grupos de anúncios encontrados`)

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedAdGroups,
        count: mappedAdGroups.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Buscar anúncios
 */
async function handleGetAds(adGroupId: string) {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    console.log(`🔍 Buscando anúncios para grupo: ${adGroupId}`)

    const results = await queryGoogleAds(credentials, `
      SELECT 
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.status,
        ad_group_ad.ad.type,
        ad_group.id
      FROM ad_group_ad
      WHERE ad_group.id = ${adGroupId}
        AND ad_group_ad.status != 'REMOVED'
      ORDER BY ad_group_ad.ad.id
    `)

    const mappedAds = results.map((row: any) => ({
      id: row.ad_group_ad.ad.id,
      name: row.ad_group_ad.ad.name || `Anúncio ${row.ad_group_ad.ad.id}`,
      status: statusMap[row.ad_group_ad.status] || row.ad_group_ad.status,
      type: row.ad_group_ad.ad.type,
      adGroupId: row.ad_group.id
    }))

    console.log(`✅ ${mappedAds.length} anúncios encontrados`)

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedAds,
        count: mappedAds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Buscar saldo da conta Google Ads
 */
async function handleGetAccountBalance() {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    console.log('🔍 Buscando saldo da conta Google Ads...')

    // Consultar informações da conta
    const accountResults = await queryGoogleAds(credentials, `
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.status
      FROM customer
      WHERE customer.id = ${credentials.customer_id}
    `)

    // Buscar orçamentos das campanhas
    const budgetResults = await queryGoogleAds(credentials, `
      SELECT 
        campaign_budget.amount_micros,
        campaign_budget.delivery_method,
        campaign_budget.status,
        campaign_budget.type
      FROM campaign_budget
      WHERE campaign_budget.status = 'ENABLED'
    `)

    // Calcular orçamento total disponível
    const totalBudgetMicros = budgetResults.reduce((acc: number, budget: any) => {
      return acc + (parseInt(budget.campaign_budget.amount_micros) || 0)
    }, 0)

    const totalBudget = totalBudgetMicros / 1000000 // Converter micros para reais

    const result = {
      accountId: credentials.customer_id,
      descriptiveName: accountResults[0]?.customer?.descriptive_name || 'Conta Google Ads',
      currencyCode: accountResults[0]?.customer?.currency_code || 'BRL',
      timeZone: accountResults[0]?.customer?.time_zone || 'America/Sao_Paulo',
      totalBudget: totalBudget,
      activeCampaignBudgets: budgetResults.length
    }

    console.log('✅ Saldo da conta calculado:', result)

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Debug das unidades no Supabase
 */
async function handleDebugUnidades() {
  try {
    console.log('🔍 DEBUG UNIDADES - Iniciando verificação...')
    
    // Verificar todas as unidades no schema api
    const { data: allUnits, error: allError } = await supabase
      .schema('api')
      .from('unidades')
      .select('*')
    
    console.log('🔍 TODAS AS UNIDADES:')
    console.log(JSON.stringify(allUnits, null, 2))
    
    if (allError) {
      console.error('❌ Erro ao buscar unidades:', allError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: allError.message,
          details: allError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Procurar especificamente por Apucarana
    const apucaranaUnits = allUnits?.filter(unit => 
      unit.unidade?.toLowerCase().includes('apucarana') ||
      unit.google_customer_id === '8802039556'
    ) || []
    
    console.log('🔍 UNIDADES APUCARANA ENCONTRADAS:')
    console.log(JSON.stringify(apucaranaUnits, null, 2))

    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          totalUnidades: allUnits?.length || 0,
          todasUnidades: allUnits,
          unidadesApucarana: apucaranaUnits,
          searchedFor: ['apucarana', '8802039556']
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Erro no debug das unidades:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Buscar métricas específicas de uma campanha
 */
async function handleGetCampaignMetrics(campaignId: string | null, startDate: string | null, endDate: string | null) {
  try {
    if (!campaignId) {
      return new Response(
        JSON.stringify({ success: false, error: 'campaign_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const credentials = await getGoogleAdsCredentials()
    
    console.log(`🔍 Buscando métricas da campanha ${campaignId} de ${startDate} a ${endDate}`)

    // Função para obter data no fuso de São Paulo (GMT-3)
    const getSaoPauloDate = (dateString: string | null) => {
      if (!dateString) return null
      
      // Se a data já está no formato correto, usar
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString
      }
      
      // Converter considerando fuso de São Paulo
      const date = new Date(dateString)
      const saoPauloOffset = -3 * 60 // GMT-3 em minutos
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
      const saoPauloTime = new Date(utc + (saoPauloOffset * 60000))
      
      return saoPauloTime.toISOString().split('T')[0]
    }

    // Definir período padrão se não fornecido (usar data atual de SP)
    const hoje = new Date()
    const saoPauloOffset = -3 * 60 // GMT-3 em minutos
    const utc = hoje.getTime() + (hoje.getTimezoneOffset() * 60000)
    const saoPauloTime = new Date(utc + (saoPauloOffset * 60000))
    const dataHojeSP = saoPauloTime.toISOString().split('T')[0]

    const start = getSaoPauloDate(startDate) || dataHojeSP
    const end = getSaoPauloDate(endDate) || dataHojeSP

    console.log(`📅 Período ajustado para fuso SP: ${start} a ${end}`)

    const results = await queryGoogleAds(credentials, `
      SELECT 
        campaign.id,
        campaign.name,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${start}' AND '${end}'
    `)

    // Agregar métricas da campanha
    const campaignMetrics = results.reduce((acc: any, row: any) => {
      acc.clicks += parseInt(row.metrics.clicks) || 0
      acc.impressions += parseInt(row.metrics.impressions) || 0
      acc.cost_micros += parseInt(row.metrics.cost_micros) || 0
      acc.conversions += parseFloat(row.metrics.conversions) || 0
      acc.conversions_value += parseFloat(row.metrics.conversions_value) || 0
      return acc
    }, {
      clicks: 0,
      impressions: 0,
      cost_micros: 0,
      conversions: 0,
      conversions_value: 0
    })

    // Calcular métricas derivadas
    const ctr = campaignMetrics.impressions > 0 
      ? (campaignMetrics.clicks / campaignMetrics.impressions) * 100 
      : 0

    const averageCpc = campaignMetrics.clicks > 0 
      ? campaignMetrics.cost_micros / (campaignMetrics.clicks * 1000000)
      : 0

    const conversionRate = campaignMetrics.clicks > 0
      ? (campaignMetrics.conversions / campaignMetrics.clicks) * 100
      : 0

    const result = {
      campaignId,
      campaignName: results[0]?.campaign?.name || `Campanha ${campaignId}`,
      period: { start, end },
      metrics: {
        clicks: campaignMetrics.clicks,
        impressions: campaignMetrics.impressions,
        cost_micros: campaignMetrics.cost_micros,
        conversions: campaignMetrics.conversions,
        conversions_value: campaignMetrics.conversions_value,
        ctr: parseFloat(ctr.toFixed(2)),
        average_cpc: parseFloat(averageCpc.toFixed(2)),
        conversion_rate: parseFloat(conversionRate.toFixed(2))
      }
    }

    console.log(`✅ Métricas da campanha ${campaignId} calculadas:`, result)

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`❌ Erro ao buscar métricas da campanha ${campaignId}:`, error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Buscar estatísticas de performance
 */
async function handleGetStats(startDate: string | null, endDate: string | null) {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    console.log(`🔍 Buscando estatísticas de ${startDate} a ${endDate}`)

    // Função para obter data no fuso de São Paulo (GMT-3)
    const getSaoPauloDate = (dateString: string | null) => {
      if (!dateString) return null
      
      // Se a data já está no formato correto, usar
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString
      }
      
      // Converter considerando fuso de São Paulo
      const date = new Date(dateString)
      const saoPauloOffset = -3 * 60 // GMT-3 em minutos
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
      const saoPauloTime = new Date(utc + (saoPauloOffset * 60000))
      
      return saoPauloTime.toISOString().split('T')[0]
    }

    // Definir período padrão se não fornecido (usar data atual de SP)
    const hoje = new Date()
    const saoPauloOffset = -3 * 60 // GMT-3 em minutos
    const utc = hoje.getTime() + (hoje.getTimezoneOffset() * 60000)
    const saoPauloTime = new Date(utc + (saoPauloOffset * 60000))
    const dataHojeSP = saoPauloTime.toISOString().split('T')[0]

    const start = getSaoPauloDate(startDate) || dataHojeSP
    const end = getSaoPauloDate(endDate) || dataHojeSP

    console.log(`📅 Período ajustado para fuso SP: ${start} a ${end}`)

    // Primeiro, vamos testar uma query mais simples para verificar se há custos
    console.log(`🔍 TESTANDO QUERY SIMPLES PARA CUSTOS:`)
    const simpleResults = await queryGoogleAds(credentials, `
      SELECT 
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
    `)
    
    console.log(`🔍 RESULTADO QUERY SIMPLES:`)
    console.log(`🔍 Número de resultados: ${simpleResults.length}`)
    if (simpleResults.length > 0) {
      console.log(`🔍 Primeiro resultado simples:`, JSON.stringify(simpleResults[0], null, 2))
      const hasAnyCost = simpleResults.some(r => r.metrics?.cost_micros > 0)
      console.log(`🔍 Tem algum custo: ${hasAnyCost}`)
      
      // Se não tem custos, testar com período mais amplo
      if (!hasAnyCost) {
        console.log(`🔍 TESTANDO COM PERÍODO MAIS AMPLO (últimos 30 dias):`)
        const broadResults = await queryGoogleAds(credentials, `
          SELECT 
            metrics.cost_micros,
            segments.date
          FROM campaign
          WHERE segments.date DURING LAST_30_DAYS
        `)
        console.log(`🔍 Resultados últimos 30 dias: ${broadResults.length}`)
        const hasAnyCostBroad = broadResults.some(r => r.metrics?.cost_micros > 0)
        console.log(`🔍 Tem custos nos últimos 30 dias: ${hasAnyCostBroad}`)
        if (hasAnyCostBroad) {
          const withCosts = broadResults.filter(r => r.metrics?.cost_micros > 0)
          console.log(`🔍 Resultados com custos: ${withCosts.length}`)
          withCosts.slice(0, 3).forEach(r => {
            console.log(`🔍 - ${r.segments?.date}: ${r.metrics?.cost_micros} micros = R$ ${(r.metrics?.cost_micros / 1000000).toFixed(2)}`)
          })
        }
      }
    }

    // Teste específico para verificar se a conta tem custos
    console.log(`🔍 TESTE ESPECÍFICO DE CUSTOS:`)
    const costTestResults = await queryGoogleAds(credentials, `
      SELECT 
        campaign.id,
        campaign.name,
        segments.date,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions
      FROM campaign
      WHERE segments.date DURING LAST_7_DAYS
    `)
    
    console.log(`🔍 TESTE CUSTOS - Resultados: ${costTestResults.length}`)
    if (costTestResults.length > 0) {
      const hasAnyCost = costTestResults.some(r => r.metrics?.cost_micros > 0)
      console.log(`🔍 TESTE CUSTOS - Tem custos: ${hasAnyCost}`)
      if (hasAnyCost) {
        const withCosts = costTestResults.filter(r => r.metrics?.cost_micros > 0)
        console.log(`🔍 TESTE CUSTOS - Resultados com custos: ${withCosts.length}`)
        withCosts.forEach(r => {
          console.log(`🔍 TESTE CUSTOS - ${r.campaign?.name} (${r.segments?.date}): ${r.metrics?.cost_micros} micros = R$ ${(r.metrics?.cost_micros / 1000000).toFixed(2)}`)
        })
      } else {
        console.log(`🔍 TESTE CUSTOS - NENHUM CUSTO ENCONTRADO!`)
        console.log(`🔍 TESTE CUSTOS - Primeiro resultado:`, JSON.stringify(costTestResults[0], null, 2))
      }
    }

    const results = await queryGoogleAds(credentials, `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.all_conversions,
        metrics.all_conversions_value
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
        AND segments.date >= '${start}'
        AND segments.date <= '${end}'
      ORDER BY campaign.name
      LIMIT 100
    `)

    // Debug detalhado dos resultados
    console.log(`🔍 RESULTADOS BRUTOS DA API:`)
    console.log(`🔍 Número de resultados: ${results.length}`)
    if (results.length > 0) {
      console.log(`🔍 Primeiro resultado:`, JSON.stringify(results[0], null, 2))
      console.log(`🔍 Cost micros do primeiro resultado: ${results[0].metrics?.cost_micros}`)
      console.log(`🔍 Campaign ID: ${results[0].campaign?.id}`)
      console.log(`🔍 Campaign Name: ${results[0].campaign?.name}`)
      console.log(`🔍 Date: ${results[0].segments?.date}`)
      console.log(`🔍 Currency Code: ${results[0].customer?.currency_code}`)
      
      // Verificar se há custos em qualquer resultado
      const hasCosts = results.some(r => r.metrics?.cost_micros > 0)
      console.log(`🔍 Tem custos em algum resultado: ${hasCosts}`)
      
      if (hasCosts) {
        const withCosts = results.filter(r => r.metrics?.cost_micros > 0)
        console.log(`🔍 Resultados com custos: ${withCosts.length}`)
        withCosts.forEach(r => {
          console.log(`🔍 - ${r.campaign?.name}: ${r.metrics?.cost_micros} micros = R$ ${(r.metrics?.cost_micros / 1000000).toFixed(2)}`)
        })
      }
    }

    // Calcular métricas agregadas (seguindo padrão que funciona)
    const aggregatedStats = results.reduce((acc: any, row: any) => {
      const campaign = row.campaign
      const metrics = row.metrics
      
      const costMicros = parseInt(metrics?.costMicros) || 0
      const costInReais = costMicros / 1000000 // Converter micros para reais
      
      console.log(`🔍 Processando: ${campaign?.name} - Cost Micros: ${costMicros} - Cost Reais: ${costInReais}`)
      
      acc.totalClicks += parseInt(metrics?.clicks) || 0
      acc.totalImpressions += parseInt(metrics?.impressions) || 0
      acc.totalCost += costInReais
      acc.totalConversions += parseFloat(metrics?.conversions) || 0
      return acc
    }, {
      totalClicks: 0,
      totalImpressions: 0,
      totalCost: 0,
      totalConversions: 0
    })

    // Calcular métricas derivadas
    const ctr = aggregatedStats.totalImpressions > 0 
      ? (aggregatedStats.totalClicks / aggregatedStats.totalImpressions) * 100 
      : 0

    const cpc = aggregatedStats.totalClicks > 0 
      ? aggregatedStats.totalCost / aggregatedStats.totalClicks 
      : 0

    const conversionRate = aggregatedStats.totalClicks > 0
      ? (aggregatedStats.totalConversions / aggregatedStats.totalClicks) * 100
      : 0

    const result = {
      totalClicks: aggregatedStats.totalClicks,
      totalImpressions: aggregatedStats.totalImpressions,
      totalCost: aggregatedStats.totalCost,
      totalConversions: aggregatedStats.totalConversions,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      period: { start, end }
    }

    console.log('✅ Estatísticas calculadas:', result)

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}