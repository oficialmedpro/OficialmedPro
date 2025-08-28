// Script para testar a função getUnidades do FilterBar
import { getUnidades } from './supabase.js'

// Função para testar a busca de unidades
const testarGetUnidades = async () => {
  console.log('🧪 === TESTANDO GET UNIDADES ===')
  
  try {
    console.log('📡 Buscando unidades do Supabase...')
    const unidades = await getUnidades()
    
    console.log('✅ Unidades encontradas:', unidades.length)
    console.log('📋 Dados das unidades:')
    
    unidades.forEach((unidade, index) => {
      console.log(`${index + 1}. ${unidade.nome} (${unidade.codigo_sprint}) - ${unidade.cidade}/${unidade.estado}`)
    })
    
    // Verificar se tem os campos necessários
    if (unidades.length > 0) {
      const primeiraUnidade = unidades[0]
      console.log('\n🔍 Campos da primeira unidade:')
      console.log('- codigo_sprint:', primeiraUnidade.codigo_sprint)
      console.log('- nome:', primeiraUnidade.nome)
      console.log('- status:', primeiraUnidade.status)
    }
    
    return { success: true, unidades }
    
  } catch (error) {
    console.error('❌ Erro ao testar getUnidades:', error)
    return { success: false, error: error.message }
  }
}

// Exportar função para usar no console
if (typeof window !== 'undefined') {
  window.testarGetUnidades = testarGetUnidades
}

// Auto-executar se rodado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testarGetUnidades()
}

export { testarGetUnidades }
