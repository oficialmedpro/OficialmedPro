import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

// Cliente Supabase com service role key (permite acesso a todos os schemas)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Função para obter o cliente com schema específico
const getSupabaseWithSchema = (schema) => {
  console.log('🔧 Criando cliente Supabase com schema:', schema)
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Accept-Profile': schema,
        'Content-Profile': schema
      }
    }
  })
}

// Função para testar a conexão
export const testConnection = async () => {
  try {
    console.log('🔌 Testando conexão com Supabase...')
    console.log('URL:', supabaseUrl)
    console.log('Schema:', supabaseSchema)
    console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Não configurada')
    
    // Testar conexão básica com schema específico
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro ao conectar:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Conexão bem-sucedida!')
    return { success: true, data, schema: supabaseSchema }
  } catch (error) {
    console.error('❌ Erro na conexão:', error)
    return { success: false, error: error.message }
  }
}

// Função para buscar oportunidades do SprintHUB (apenas título)
export const getOportunidadesSprint = async (limit = 10) => {
  try {
    console.log(`📊 Buscando ${limit} títulos de oportunidades do schema ${supabaseSchema}...`)
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('title')
      .eq('archived', 0)
      .order('create_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades:', error)
      throw new Error(`Erro ao buscar oportunidades: ${error.message}`)
    }
    
    console.log(`✅ ${data?.length || 0} títulos de oportunidades encontrados`)
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades:', error)
    throw error
  }
}

// Função para buscar oportunidades por status
export const getOportunidadesPorStatus = async (status, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select(`
        id,
        title,
        value,
        status,
        expected_close_date,
        lead_firstname,
        lead_lastname,
        lead_email,
        unidade_id,
        funil_nome
      `)
      .eq('status', status)
      .eq('archived', 0)
      .order('create_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades por status:', error)
      throw new Error(`Erro ao buscar oportunidades por status: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por status:', error)
    throw error
  }
}

// Função para buscar oportunidades por unidade
export const getOportunidadesPorUnidade = async (unidadeId, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select(`
        id,
        title,
        value,
        status,
        expected_close_date,
        lead_firstname,
        lead_lastname,
        lead_email,
        funil_nome
      `)
      .eq('unidade_id', unidadeId)
      .eq('archived', 0)
      .order('create_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades por unidade:', error)
      throw new Error(`Erro ao buscar oportunidades por unidade: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por unidade:', error)
    throw error
  }
}

// Função para buscar estatísticas das oportunidades
export const getEstatisticasOportunidades = async () => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('status, value, archived')
      .eq('archived', 0)
    
    if (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
    }
    
    if (!data) return {}
    
    const stats = {
      total: data.length,
      porStatus: {},
      valorTotal: 0,
      valorMedio: 0
    }
    
    data.forEach(oportunidade => {
      const status = oportunidade.status || 'Sem Status'
      stats.porStatus[status] = (stats.porStatus[status] || 0) + 1
      
      if (oportunidade.value && !isNaN(oportunidade.value)) {
        stats.valorTotal += parseFloat(oportunidade.value)
      }
    })
    
    stats.valorMedio = stats.total > 0 ? stats.valorTotal / stats.total : 0
    
    return stats
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    throw error
  }
}

// Função para buscar unidades usando HTTP direto (como na VPS)
export const getUnidades = async () => {
  try {
    console.log('🔍 Buscando unidades do schema:', supabaseSchema)
    
    // Primeiro, vamos ver quais tabelas existem no schema
    console.log('🔍 Verificando tabelas disponíveis...')
    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema
      }
    })
    
    if (tablesResponse.ok) {
      const tables = await tablesResponse.json()
      console.log('📋 Tabelas disponíveis no schema', supabaseSchema, ':', tables)
    } else {
      console.log('⚠️ Não foi possível listar tabelas')
    }
    
    // Agora tentar buscar unidades (usando campos que realmente existem)
    const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=id,unidade,codigo_sprint,status&status=eq.ativo&order=unidade.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    
    console.log('✅ Unidades encontradas:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📋 Primeira unidade:', data[0])
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar unidades:', error)
    throw error
  }
}

// Função para listar schemas disponíveis
export const listSchemas = async () => {
  try {
    return [supabaseSchema, 'public']
  } catch (error) {
    console.error('❌ Erro ao listar schemas:', error)
    return [supabaseSchema, 'public']
  }
}

// Função para listar tabelas disponíveis
export const listTables = async () => {
  try {
    return {
      [supabaseSchema]: ['oportunidade_sprint', 'unidades', 'funis'],
      public: []
    }
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error)
    return {
      [supabaseSchema]: ['oportunidade_sprint', 'unidades', 'funis'],
      public: []
    }
  }
}

// 🎯 FUNÇÃO PARA BUSCAR FUNIS POR UNIDADE
export const getFunisPorUnidade = async (unidadeId = null) => {
  try {
    console.log('🔍 Buscando funis para unidade:', unidadeId || 'todas')
    
    let url = `${supabaseUrl}/rest/v1/funis?select=id,nome_funil,id_funil_sprint,unidade,status&status=eq.ativo&order=nome_funil.asc`;
    
    // Se uma unidade específica foi selecionada, filtrar por ela
    if (unidadeId && unidadeId !== 'all') {
      url += `&unidade=eq.${encodeURIComponent(unidadeId)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }

    const funis = await response.json();
    console.log(`✅ Funis encontrados: ${funis.length}`, funis);
    return funis;

  } catch (error) {
    console.error('❌ Erro ao buscar funis:', error);
    throw error;
  }
}
