import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Configurações do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
 * Busca credenciais do Google Ads do Supabase
 */
async function getGoogleAdsCredentials() {
  try {
    // Verificar se o cache ainda é válido (5 minutos)
    if (cachedCredentials && credentialsExpiry && Date.now() < credentialsExpiry) {
      console.log('✅ Usando credenciais em cache')
      return cachedCredentials
    }

    console.log('🔍 Buscando credenciais do Supabase...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=*&codigo_sprint=eq.[1]`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    if (!data || data.length === 0) {
      throw new Error('Unidade Apucarana não encontrada')
    }

    const unidade = data[0]
    
    // Validar credenciais
    if (!unidade.google_customer_id || !unidade.google_developer_token || 
        !unidade.google_client_id || !unidade.google_client_secret || 
        !unidade.google_refresh_token || !unidade.google_ads_active) {
      throw new Error('Credenciais incompletas para unidade Apucarana')
    }

    const credentials = {
      customer_id: unidade.google_customer_id.replace(/-/g, ''), // Remover hífens
      developer_token: unidade.google_developer_token,
      client_id: unidade.google_client_id,
      client_secret: unidade.google_client_secret,
      refresh_token: unidade.google_refresh_token,
      unidade_name: unidade.unidade
    }

    // Cache por 5 minutos
    cachedCredentials = credentials
    credentialsExpiry = Date.now() + (5 * 60 * 1000)

    console.log('✅ Credenciais carregadas para:', unidade.unidade)
    return credentials

  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error)
    throw error
  }
}

/**
 * Obtém access token do Google OAuth2
 */
async function getAccessToken(credentials: any) {
  try {
    console.log('🔑 Obtendo access token...')
    
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
      const error = await tokenResponse.text()
      throw new Error(`Token error: ${error}`)
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
 * Faz query na Google Ads API
 */
async function queryGoogleAds(credentials: any, query: string) {
  try {
    const accessToken = await getAccessToken(credentials)
    
    const response = await fetch(
      `https://googleads.googleapis.com/v21/customers/${credentials.customer_id}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Developer-Token': credentials.developer_token,
          'Content-Type': 'application/json',
        },
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

    const results = []
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.results) {
              results.push(...data.results)
            }
          } catch (parseError) {
            // Ignorar linhas que não são JSON válido
          }
        }
      }
    }

    return results
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
    const path = url.pathname.replace('/google-ads-api', '')
    
    console.log('🔍 Path recebido:', path)
    console.log('🔍 URL completa:', req.url)
    
    // Roteamento baseado no path
    switch (path) {
      case '/test-connection':
        return await handleTestConnection()
      
      case '/campaigns':
        const status = url.searchParams.get('status') || 'active'
        return await handleGetCampaigns(status)
      
      case '/stats':
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        return await handleGetStats(startDate, endDate)
      
      case '/account-balance':
        return await handleGetAccountBalance()
      
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
        
        return new Response(
          JSON.stringify({ success: false, error: 'Endpoint não encontrado' }),
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
async function handleGetCampaigns(status: string) {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    console.log(`🔍 Buscando campanhas (filtro: ${status})...`)

    let whereClause
    if (status === 'active') {
      whereClause = "WHERE campaign.status = 'ENABLED'"
    } else if (status === 'all') {
      whereClause = "WHERE campaign.status != 'REMOVED'"
    } else {
      whereClause = "WHERE campaign.status != 'REMOVED'"
    }

    const results = await queryGoogleAds(credentials, `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      ${whereClause}
      ORDER BY campaign.name
    `)

    const mappedCampaigns = results.map((row: any) => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: statusMap[row.campaign.status] || row.campaign.status,
      channelType: row.campaign.advertising_channel_type,
      type: 'SEARCH'
    }))

    console.log(`✅ ${mappedCampaigns.length} campanhas encontradas`)

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedCampaigns,
        count: mappedCampaigns.length
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

    const results = await queryGoogleAds(credentials, `
      SELECT 
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
    `)

    // Calcular métricas agregadas
    const aggregatedStats = results.reduce((acc: any, row: any) => {
      acc.totalClicks += parseInt(row.metrics.clicks) || 0
      acc.totalImpressions += parseInt(row.metrics.impressions) || 0
      acc.totalCost += (parseInt(row.metrics.cost_micros) || 0) / 1000000 // Converter micros para reais
      acc.totalConversions += parseFloat(row.metrics.conversions) || 0
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