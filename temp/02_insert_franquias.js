import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'api' }
})

// Dados das 5 franquias
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

async function inserirFranquias() {
  try {
    console.log('🚀 === INSERINDO FRANQUIAS ===\n')
    
    console.log('📋 Dados a serem inseridos:')
    franquiasData.forEach(f => {
      console.log(`🏢 ${f.nome} (${f.codigo_sprint}) - ${f.cidade}/${f.estado}`)
    })
    
    console.log('\n📊 Inserindo no Supabase...')
    
    const { data, error } = await supabase
      .from('unidades')
      .upsert(franquiasData, { 
        onConflict: 'codigo_sprint',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Erro na inserção:', error)
      throw error
    }

    console.log('\n✅ FRANQUIAS INSERIDAS COM SUCESSO!')
    console.log(`📊 Total de registros: ${data?.length || 0}`)
    
    // Mostrar dados inseridos
    if (data && data.length > 0) {
      console.log('\n📋 Registros inseridos:')
      data.forEach(franquia => {
        console.log(`✅ ID: ${franquia.id} | ${franquia.nome} (${franquia.codigo_sprint}) | Status: ${franquia.status}`)
      })
    }

    // Testar relação
    console.log('\n🔍 Testando relação com oportunidade_sprint...')
    await testarRelacao()

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

async function testarRelacao() {
  try {
    // Buscar algumas oportunidades
    const { data: oportunidades, error: opError } = await supabase
      .from('oportunidade_sprint')
      .select('id, title, unidade_id, value, status')
      .not('unidade_id', 'is', null)
      .limit(5)

    if (opError) throw opError

    console.log(`📊 Encontradas ${oportunidades?.length || 0} oportunidades com unidade_id`)

    // Buscar unidades correspondentes
    if (oportunidades && oportunidades.length > 0) {
      const unidadeIds = [...new Set(oportunidades.map(op => op.unidade_id))]
      
      const { data: unidades, error: unidError } = await supabase
        .from('unidades')
        .select('codigo_sprint, nome, cidade')
        .in('codigo_sprint', unidadeIds)

      if (unidError) throw unidError

      console.log(`🏢 Encontradas ${unidades?.length || 0} unidades relacionadas`)

      // Mostrar relação
      const unidadesMap = {}
      unidades?.forEach(u => {
        unidadesMap[u.codigo_sprint] = u
      })

      console.log('\n📋 EXEMPLOS DE RELAÇÃO:')
      oportunidades.forEach(op => {
        const unidade = unidadesMap[op.unidade_id]
        console.log(`🎯 ${op.title}`)
        console.log(`🏢 Unidade: ${unidade?.nome || 'Não encontrada'} (${op.unidade_id})`)
        console.log(`💰 Valor: R$ ${op.value || 0} | Status: ${op.status}`)
        console.log('---')
      })
    }

    console.log('\n✅ RELAÇÃO TESTADA COM SUCESSO!')

  } catch (error) {
    console.error('❌ Erro ao testar relação:', error.message)
  }
}

// Executar
inserirFranquias()