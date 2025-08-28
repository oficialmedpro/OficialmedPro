import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'api' }
})

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura da tabela unidades...')
    
    // Tentar buscar um registro para ver a estrutura
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Erro ao acessar tabela:', error)
      return
    }

    console.log('✅ Tabela acessível!')
    
    if (data && data.length > 0) {
      console.log('📋 Campos disponíveis:')
      Object.keys(data[0]).forEach(campo => {
        console.log(`  - ${campo}`)
      })
      
      // Verificar se codigo_sprint existe
      if (data[0].hasOwnProperty('codigo_sprint')) {
        console.log('✅ Campo codigo_sprint encontrado!')
        return true
      } else {
        console.log('❌ Campo codigo_sprint NÃO encontrado')
        console.log('⏳ Aguarde alguns segundos para o cache atualizar ou execute a SQL novamente')
        return false
      }
    } else {
      console.log('📋 Tabela vazia, verificando com INSERT de teste...')
      return await testarInsert()
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message)
    return false
  }
}

async function testarInsert() {
  try {
    console.log('🧪 Testando insert com codigo_sprint...')
    
    const testData = {
      codigo_sprint: '[TEST]',
      codigo: 'TESTE',
      nome: 'TESTE - FRANQUIA',
      cidade: 'Teste',
      estado: 'TS',
      status: 'ativo'
    }
    
    const { data, error } = await supabase
      .from('unidades')
      .insert([testData])
      .select()

    if (error) {
      console.log('❌ Erro no teste:', error.message)
      if (error.message.includes('codigo_sprint')) {
        console.log('💡 Campo codigo_sprint existe mas há problema de schema cache')
        console.log('🔄 Tente executar a SQL novamente ou aguarde alguns minutos')
      }
      return false
    }

    console.log('✅ Teste de insert funcionou!')
    
    // Limpar dados de teste
    if (data && data.length > 0) {
      await supabase
        .from('unidades')
        .delete()
        .eq('id', data[0].id)
      console.log('🧹 Dados de teste removidos')
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    return false
  }
}

// Executar verificação
verificarEstrutura()