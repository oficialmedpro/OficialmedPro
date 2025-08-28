// Script para testar a inserção das unidades
import { 
  setupUnidades, 
  inserirFranquias, 
  testarRelacao,
  adicionarCampoCodigoSprint 
} from './insertUnidades.js'

// Função para executar todos os passos
const executarSetup = async () => {
  console.log('🚀 === SETUP TABELA UNIDADES ===')
  
  try {
    // Passo 1: Preparar alteração da tabela
    console.log('\n📋 PASSO 1: Preparar alteração da tabela')
    const setup = await setupUnidades()
    console.log(setup)
    
    // Passo 2: Mostrar query SQL para executar
    console.log('\n📝 PASSO 2: Execute esta query no Supabase Dashboard:')
    const alterQuery = await adicionarCampoCodigoSprint()
    console.log(alterQuery.query)
    
    console.log('\n⏳ Após executar a query no Dashboard, rode: inserirFranquiasData()')
    
  } catch (error) {
    console.error('❌ Erro no setup:', error)
  }
}

// Função para inserir dados (executar após a query SQL)
const inserirFranquiasData = async () => {
  console.log('\n📊 === INSERINDO FRANQUIAS ===')
  
  try {
    const result = await inserirFranquias()
    console.log(result)
    
    if (result.success) {
      console.log('\n🔍 Testando relação com oportunidade_sprint...')
      const testeRelacao = await testarRelacao()
      console.log(testeRelacao)
    }
  } catch (error) {
    console.error('❌ Erro ao inserir franquias:', error)
  }
}

// Exportar funções para usar no console
if (typeof window !== 'undefined') {
  window.setupUnidades = executarSetup
  window.inserirFranquiasData = inserirFranquiasData
  window.testarRelacao = testarRelacao
}

// Auto-executar se rodado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarSetup()
}

export { executarSetup, inserirFranquiasData }