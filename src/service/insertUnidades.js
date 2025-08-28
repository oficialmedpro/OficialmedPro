import { supabase } from './supabase.js'

// Dados das franquias baseado no Excel
const franquiasData = [
  {
    codigo_sprint: '[1]',
    codigo: 'APUCARANA',
    nome: 'APUCARANA - FRANQUIA',
    cidade: 'Apucarana',
    estado: 'PR',
    franqueado_nome: 'Apucarana',
    email_franqueado: 'apucarana@oficialmed.com.br',
    telefone_franqueado: '55 43 999999999',
    status: 'ativo'
  },
  {
    codigo_sprint: '[2]',
    codigo: 'BOM_JESUS',
    nome: 'BOM JESUS - FRANQUIA',
    cidade: 'Bom Jesus dos Perdões',
    estado: 'SP',
    franqueado_nome: 'Flávio e Carlos',
    email_franqueado: 'bomjesus@oficialmed.com.br',
    telefone_franqueado: '55 11 973548754/55 11 957672011',
    status: 'ativo'
  },
  {
    codigo_sprint: '[3]',
    codigo: 'BELO_HORIZONTE',
    nome: 'BELO HORIZONTE - FRANQUIA',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    franqueado_nome: 'Matheus Matta',
    email_franqueado: 'belohorizonte@oficialmed.com.br',
    telefone_franqueado: '55 31 998007873',
    status: 'inativo'
  },
  {
    codigo_sprint: '[4]',
    codigo: 'LONDRINA',
    nome: 'LONDRINA - FRANQUIA',
    cidade: 'Londrina',
    estado: 'PR',
    franqueado_nome: 'Paulo e Víctor',
    email_franqueado: 'londrina1@oficialmed.com.br',
    telefone_franqueado: '55 43 984252297/55 43 999957333',
    status: 'ativo'
  },
  {
    codigo_sprint: '[5]',
    codigo: 'ARAPONGAS',
    nome: 'ARAPONGAS - FRANQUIA',
    cidade: 'Arapongas',
    estado: 'PR',
    franqueado_nome: 'Franciele e Gabriel',
    email_franqueado: 'arapongas@oficialmed.com.br',
    telefone_franqueado: '55 43 999039438/55 11 947913232',
    status: 'ativo'
  },
  {
    codigo_sprint: '[6]',
    codigo: 'BALNEARIO_CAMBORIU',
    nome: 'BALNEÁRIO CAMBORIÚ - FRANQUIA',
    cidade: 'Balneário Camboriú',
    estado: 'SC',
    franqueado_nome: 'Thiago e Angela',
    email_franqueado: 'balnearíocamboriu@oficialmed.com.br',
    telefone_franqueado: '55 43 998513939/55 12 981367887',
    status: 'ativo'
  }
]

// Função para adicionar campo codigo_sprint na tabela unidades
export const adicionarCampoCodigoSprint = async () => {
  try {
    console.log('🔧 Adicionando campo codigo_sprint na tabela unidades...')
    
    // Esta query precisa ser executada diretamente no Supabase Dashboard ou psql
    const alterTableQuery = `
      ALTER TABLE unidades 
      ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(10);
      
      -- Criar índice para performance
      CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
      ON unidades (codigo_sprint);
    `
    
    console.log('📝 Execute esta query no Supabase Dashboard:')
    console.log(alterTableQuery)
    
    return { success: true, query: alterTableQuery }
  } catch (error) {
    console.error('❌ Erro ao preparar alteração da tabela:', error)
    return { success: false, error: error.message }
  }
}

// Função para inserir dados das franquias
export const inserirFranquias = async () => {
  try {
    console.log('📊 Inserindo dados das franquias...')
    
    // Primeiro, verificar se já existem dados
    const { data: existingData, error: checkError } = await supabase
      .from('unidades')
      .select('codigo_sprint')
      .in('codigo_sprint', franquiasData.map(f => f.codigo_sprint))

    if (checkError) {
      console.error('❌ Erro ao verificar dados existentes:', checkError)
      throw checkError
    }

    if (existingData && existingData.length > 0) {
      console.log('⚠️ Algumas franquias já existem. Fazendo upsert...')
      
      // Fazer upsert (insert ou update)
      const { data, error } = await supabase
        .from('unidades')
        .upsert(franquiasData, { 
          onConflict: 'codigo_sprint',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('❌ Erro no upsert:', error)
        throw error
      }

      console.log('✅ Upsert realizado com sucesso:', data)
      return { success: true, action: 'upsert', data }
    } else {
      // Inserir dados novos
      const { data, error } = await supabase
        .from('unidades')
        .insert(franquiasData)
        .select()

      if (error) {
        console.error('❌ Erro na inserção:', error)
        throw error
      }

      console.log('✅ Franquias inseridas com sucesso:', data)
      return { success: true, action: 'insert', data }
    }
  } catch (error) {
    console.error('❌ Erro ao inserir franquias:', error)
    return { success: false, error: error.message }
  }
}

// Função para testar relação com oportunidade_sprint
export const testarRelacao = async () => {
  try {
    console.log('🔍 Testando relação entre unidades e oportunidade_sprint...')
    
    const { data, error } = await supabase
      .from('oportunidade_sprint')
      .select(`
        id,
        title,
        unidade_id,
        unidades!inner (
          id,
          codigo_sprint,
          nome,
          cidade
        )
      `)
      .limit(5)

    if (error) {
      console.error('❌ Erro ao testar relação:', error)
      throw error
    }

    console.log('✅ Relação funcionando! Exemplos:')
    data?.forEach(item => {
      console.log(`📊 Oportunidade: ${item.title}`)
      console.log(`🏢 Unidade: ${item.unidades.nome} (${item.unidades.codigo_sprint})`)
      console.log('---')
    })

    return { success: true, exemplos: data }
  } catch (error) {
    console.error('❌ Erro ao testar relação:', error)
    return { success: false, error: error.message }
  }
}

// Função principal para executar todo o processo
export const setupUnidades = async () => {
  try {
    console.log('🚀 Iniciando setup da tabela unidades...')
    
    // 1. Preparar alteração da tabela
    const alterResult = await adicionarCampoCodigoSprint()
    console.log('📝 Query para adicionar campo preparada')
    
    // 2. Aguardar confirmação do usuário para executar a query
    console.log('⏳ Execute a query no Supabase Dashboard antes de prosseguir')
    
    return {
      success: true,
      steps: {
        alterTable: alterResult,
        message: 'Execute a query SQL no Dashboard e depois chame inserirFranquias()'
      }
    }
  } catch (error) {
    console.error('❌ Erro no setup:', error)
    return { success: false, error: error.message }
  }
}

// Exportar dados para visualização
export { franquiasData }