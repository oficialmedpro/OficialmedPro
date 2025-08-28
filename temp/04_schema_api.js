import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'

// Cliente com schema API explícito
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { 
    autoRefreshToken: false, 
    persistSession: false 
  },
  db: { 
    schema: 'api'  // Schema explícito
  }
})

async function verificarSchemaApi() {
  try {
    console.log('🔍 Verificando acesso ao schema API...')
    
    // Testar acesso às tabelas do schema API
    console.log('📊 Testando acesso à tabela oportunidade_sprint...')
    const { data: opData, error: opError } = await supabase
      .from('oportunidade_sprint')
      .select('id, title, unidade_id')
      .limit(3)

    if (opError) {
      console.error('❌ Erro ao acessar oportunidade_sprint:', opError)
      return false
    }

    console.log(`✅ oportunidade_sprint acessível! Encontrados ${opData?.length || 0} registros`)
    if (opData && opData.length > 0) {
      console.log('📋 Exemplo de unidade_id:', opData[0].unidade_id)
    }

    // Testar acesso à tabela unidades no schema API
    console.log('\n🏢 Testando acesso à tabela unidades no schema API...')
    const { data: unidadesData, error: unidadesError } = await supabase
      .from('unidades')
      .select('*')
      .limit(1)

    if (unidadesError) {
      console.error('❌ Erro ao acessar unidades:', unidadesError)
      
      // Se der erro de permissão, pode ser que a tabela não existe no schema API
      if (unidadesError.code === '42501') {
        console.log('💡 A tabela unidades pode não existir no schema API')
        console.log('🔧 Vamos tentar criar a tabela no schema API')
        return await criarTabelaUnidades()
      }
      return false
    }

    console.log('✅ Tabela unidades acessível no schema API!')
    
    if (unidadesData && unidadesData.length > 0) {
      console.log('📋 Campos disponíveis na tabela unidades:')
      Object.keys(unidadesData[0]).forEach(campo => {
        console.log(`  - ${campo}`)
      })
      
      // Verificar se codigo_sprint existe
      if (unidadesData[0].hasOwnProperty('codigo_sprint')) {
        console.log('✅ Campo codigo_sprint já existe!')
        return await inserirFranquias()
      } else {
        console.log('❌ Campo codigo_sprint não encontrado')
        console.log('📝 Execute a SQL no schema API:')
        console.log('ALTER TABLE api.unidades ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(10);')
        return false
      }
    } else {
      console.log('📋 Tabela unidades existe mas está vazia')
      return await testarCampoCodigoSprint()
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

async function criarTabelaUnidades() {
  console.log('🏗️ Tentando criar tabela unidades no schema API...')
  console.log('📝 Execute esta SQL no Supabase Dashboard:')
  
  const createTableSQL = `
-- Criar tabela unidades no schema API
CREATE TABLE IF NOT EXISTS api.unidades (
    id SERIAL PRIMARY KEY,
    codigo_sprint VARCHAR(10),
    codigo VARCHAR(50),
    nome VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    franqueado_nome VARCHAR(255),
    email_franqueado VARCHAR(255),
    telefone_franqueado VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ativo',
    data_ativacao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
ON api.unidades (codigo_sprint);

-- Dar permissões
GRANT ALL ON api.unidades TO service_role;
GRANT USAGE, SELECT ON SEQUENCE api.unidades_id_seq TO service_role;
  `
  
  console.log(createTableSQL)
  return false
}

async function testarCampoCodigoSprint() {
  try {
    console.log('🧪 Testando se campo codigo_sprint existe...')
    
    const testData = {
      codigo_sprint: '[TEST]',
      codigo: 'TESTE',
      nome: 'TESTE',
      status: 'ativo'
    }
    
    const { data, error } = await supabase
      .from('unidades')
      .insert([testData])
      .select()

    if (error) {
      console.log('❌ Campo codigo_sprint não existe:', error.message)
      return false
    }

    console.log('✅ Campo codigo_sprint existe e funciona!')
    
    // Limpar teste
    if (data && data.length > 0) {
      await supabase.from('unidades').delete().eq('id', data[0].id)
      console.log('🧹 Dados de teste removidos')
    }
    
    return await inserirFranquias()
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    return false
  }
}

async function inserirFranquias() {
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

  try {
    console.log('\n🚀 === INSERINDO FRANQUIAS NO SCHEMA API ===')
    
    const { data, error } = await supabase
      .from('unidades')
      .upsert(franquiasData, { 
        onConflict: 'codigo_sprint',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Erro na inserção:', error)
      return false
    }

    console.log('✅ FRANQUIAS INSERIDAS COM SUCESSO!')
    console.log(`📊 Total: ${data?.length || 0} registros`)
    
    data?.forEach(f => {
      console.log(`✅ ${f.nome} (${f.codigo_sprint}) - Status: ${f.status}`)
    })

    // Testar relação
    console.log('\n🔍 Testando relação...')
    const { data: relacao } = await supabase
      .from('oportunidade_sprint')
      .select('title, unidade_id')
      .in('unidade_id', ['[2]', '[3]', '[4]', '[5]', '[6]'])
      .limit(3)

    if (relacao && relacao.length > 0) {
      console.log('✅ Relação funcionando!')
      relacao.forEach(op => {
        console.log(`🎯 ${op.title} → Unidade: ${op.unidade_id}`)
      })
    }

    return true
  } catch (error) {
    console.error('❌ Erro:', error.message)
    return false
  }
}

// Executar
verificarSchemaApi()