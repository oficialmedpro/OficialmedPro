import { getTodayDateSP, getStartOfDaySP, getEndOfDaySP } from '../utils/utils.js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

// 🎯 Função para buscar unidades
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
    return []
  }
}

// 🎯 Função para buscar funis por unidade
export const getFunisPorUnidade = async (unidadeId = null) => {
  try {
    console.log('🔍 Buscando funis para unidade:', unidadeId)
    
    let url = `${supabaseUrl}/rest/v1/funis?select=id_funil_sprint,nome_funil,unidade&order=nome_funil.asc`
    
    // Se uma unidade específica foi selecionada, filtrar por ela
    if (unidadeId && unidadeId !== 'all') {
      url += `&unidade=eq.${unidadeId}`
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
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    
    console.log('✅ Funis encontrados:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📋 Primeiro funil:', data[0])
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar funis:', error)
    return []
  }
}

// 🎯 Função para buscar vendedores por unidade
export const getVendedores = async (unidadeId = null) => {
  try {
    console.log('🔍 Buscando vendedores para unidade:', unidadeId)
    
    let url = `${supabaseUrl}/rest/v1/vendedores?select=id_sprint,nome,id_unidade&status=eq.ativo&order=nome.asc`
    
    // Se uma unidade específica foi selecionada, filtrar por ela
    if (unidadeId && unidadeId !== 'all') {
      url += `&id_unidade=eq.${unidadeId}`
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
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    
    console.log('✅ Vendedores encontrados:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📋 Primeiro vendedor:', data[0])
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar vendedores:', error)
    return []
  }
}

// 🎯 Função para buscar origens das oportunidades
export const getOrigens = async () => {
  try {
    console.log('🔍 Buscando origens do schema:', supabaseSchema)
    
    const response = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=id,nome,ativo&ativo=eq.true&order=nome.asc`, {
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
      console.error('❌ Erro HTTP ao buscar origens:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Origens encontradas:', data)
    
    // Retornar no formato esperado pelo componente
    const origensFormatadas = [
      { id: 'all', name: 'Todas as origens', origem: 'all' },
      ...data.map(origem => ({
        id: origem.id,
        name: origem.nome,
        origem: origem.nome // Usar o nome para filtrar no campo origem_oportunidade
      }))
    ]
    
    console.log('✅ Origens formatadas:', origensFormatadas)
    return origensFormatadas

  } catch (error) {
    console.error('❌ Erro ao buscar origens:', error)
    return [{ id: 'all', name: 'Todas as origens', origem: 'all' }]
  }
}