import { createClient } from '@supabase/supabase-js'

// Configurações diretas do .env
const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'api'
  }
})

// Dados das franquias
const franquiasData = [
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
    email_franqueado: 'balneariocamboriu@oficialmed.com.br',
    telefone_franqueado: '55 43 998513939/55 12 981367887',
    status: 'ativo'
  }
]

// Função 1: Adicionar campo codigo_sprint
async function adicionarCampoCodigoSprint() {
  try {
    console.log('🔧 Adicionando campo codigo_sprint na tabela unidades...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE unidades 
        ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(10);
        
        CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
        ON unidades (codigo_sprint);
      `
    })

    if (error) {
      console.log('⚠️ Tentativa via RPC falhou, usando query SQL direta...')
      
      // Tentar via query SQL direta (pode não funcionar para ALTER TABLE)
      const alterResult = await supabase
        .from('unidades')
        .select('*')
        .limit(1)
      
      if (alterResult.error) {
        throw alterResult.error
      }
      
      console.log('ℹ️ Tabela acessível. Execute manualmente no Dashboard:')
      console.log(`
        ALTER TABLE unidades 
        ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(10);
        
        CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
        ON unidades (codigo_sprint);
      `)
      
      return { success: false, needsManualExecution: true }
    }

    console.log('✅ Campo codigo_sprint adicionado com sucesso!')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao adicionar campo:', error.message)
    return { success: false, error: error.message }
  }
}

// Função 2: Inserir dados das franquias
async function inserirFranquias() {
  try {
    console.log('📊 Inserindo dados das franquias...')
    
    // Verificar se os dados já existem
    const { data: existing, error: checkError } = await supabase
      .from('unidades')
      .select('codigo_sprint, nome')
      .in('codigo_sprint', franquiasData.map(f => f.codigo_sprint))

    if (checkError) {
      console.error('❌ Erro ao verificar dados existentes:', checkError)
      throw checkError
    }

    console.log(`📋 Encontradas ${existing?.length || 0} franquias existentes`)

    // Inserir ou atualizar dados
    const { data, error } = await supabase
      .from('unidades')
      .upsert(franquiasData, { 
        onConflict: 'codigo_sprint',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Erro na inserção/atualização:', error)
      throw error
    }

    console.log('✅ Franquias inseridas/atualizadas com sucesso!')
    console.log(`📊 Total de registros processados: ${data?.length || 0}`)
    
    // Mostrar dados inseridos
    data?.forEach(franquia => {
      console.log(`🏢 ${franquia.nome} (${franquia.codigo_sprint}) - ${franquia.status}`)
    })

    return { success: true, data, count: data?.length || 0 }
  } catch (error) {
    console.error('❌ Erro ao inserir franquias:', error.message)
    return { success: false, error: error.message }
  }
}

// Função 3: Testar relação com oportunidade_sprint
async function testarRelacao() {
  try {
    console.log('🔍 Testando relação entre unidades e oportunidade_sprint...')
    
    // Buscar oportunidades com join nas unidades
    const { data, error } = await supabase
      .from('oportunidade_sprint')
      .select(`
        id,
        title,
        unidade_id,
        status,
        value
      `)
      .not('unidade_id', 'is', null)
      .limit(10)

    if (error) {
      console.error('❌ Erro ao buscar oportunidades:', error)
      throw error
    }

    console.log(`📊 Encontradas ${data?.length || 0} oportunidades com unidade_id`)

    // Buscar unidades correspondentes
    const unidadeIds = [...new Set(data?.map(op => op.unidade_id) || [])]
    
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('codigo_sprint, nome, cidade')
      .in('codigo_sprint', unidadeIds)

    if (unidadesError) {
      console.error('❌ Erro ao buscar unidades:', unidadesError)
      throw unidadesError
    }

    console.log('✅ Relação testada com sucesso!')
    console.log('\n📋 EXEMPLOS DE RELAÇÃO:')
    
    // Mostrar relação
    const unidadesMap = {}
    unidades?.forEach(u => {
      unidadesMap[u.codigo_sprint] = u
    })

    data?.slice(0, 5).forEach(oportunidade => {
      const unidade = unidadesMap[oportunidade.unidade_id]
      console.log(`🎯 ${oportunidade.title}`)
      console.log(`🏢 Unidade: ${unidade?.nome || 'Não encontrada'} (${oportunidade.unidade_id})`)
      console.log(`💰 Valor: R$ ${oportunidade.value || 0}`)
      console.log('---')
    })

    return { 
      success: true, 
      oportunidades: data?.length || 0,
      unidades: unidades?.length || 0,
      relacao: unidadesMap
    }
  } catch (error) {
    console.error('❌ Erro ao testar relação:', error.message)
    return { success: false, error: error.message }
  }
}

// Função principal
async function executarSetupCompleto() {
  console.log('🚀 === SETUP COMPLETO DA TABELA UNIDADES ===\n')
  
  try {
    // Passo 1: Adicionar campo codigo_sprint
    console.log('📋 PASSO 1: Adicionando campo codigo_sprint')
    const step1 = await adicionarCampoCodigoSprint()
    
    if (!step1.success && step1.needsManualExecution) {
      console.log('\n⏳ EXECUTE A QUERY MANUAL NO DASHBOARD E RODE NOVAMENTE')
      return
    }
    
    // Passo 2: Inserir franquias
    console.log('\n📋 PASSO 2: Inserindo dados das franquias')
    const step2 = await inserirFranquias()
    
    if (!step2.success) {
      console.error('❌ Falha na inserção das franquias')
      return
    }
    
    // Passo 3: Testar relação
    console.log('\n📋 PASSO 3: Testando relação com oportunidade_sprint')
    const step3 = await testarRelacao()
    
    if (step3.success) {
      console.log('\n✅ === SETUP CONCLUÍDO COM SUCESSO! ===')
      console.log(`📊 ${step2.count} franquias inseridas`)
      console.log(`🔗 ${step3.oportunidades} oportunidades relacionadas`)
      console.log(`🏢 ${step3.unidades} unidades encontradas`)
    }
    
  } catch (error) {
    console.error('❌ Erro no setup completo:', error)
  }
}

// Executar
executarSetupCompleto()