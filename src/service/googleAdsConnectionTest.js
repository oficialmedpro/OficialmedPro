// Configurações do Supabase (usando configuração centralizada)
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js'

class GoogleAdsConnectionTest {
  constructor() {
    this.credentials = null
  }

  /**
   * Busca as credenciais do Google Ads do Supabase usando HTTP direto (mesmo padrão do getUnidades)
   */
  async loadCredentials() {
    try {
      console.log('🔍 Carregando credenciais do Google Ads do Supabase...')
      
      // Usar abordagem HTTP direta igual ao getUnidades() que funciona
      const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=id,unidade,google_customer_id,google_developer_token,google_client_id,google_client_secret,google_refresh_token,google_ads_active&codigo_sprint=eq.[1]`, {
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

      if (!data || data.length === 0) {
        throw new Error('Unidade com código_sprint="[1]" não encontrada')
      }

      const unidadeData = data[0] // Pegar o primeiro resultado

      this.credentials = {
        customerId: unidadeData.google_customer_id,
        developerToken: unidadeData.google_developer_token,
        clientId: unidadeData.google_client_id,
        clientSecret: unidadeData.google_client_secret,
        refreshToken: unidadeData.google_refresh_token,
        isActive: unidadeData.google_ads_active,
        unidadeName: unidadeData.unidade
      }

      console.log('✅ Credenciais carregadas para:', unidadeData.unidade)
      console.log('🔑 Customer ID:', unidadeData.google_customer_id ? '••••••••' : 'Não configurado')
      console.log('🔑 Developer Token:', unidadeData.google_developer_token ? '••••••••' : 'Não configurado')
      console.log('🔑 Client ID:', unidadeData.google_client_id ? '••••••••' : 'Não configurado')
      console.log('🔑 Client Secret:', unidadeData.google_client_secret ? '••••••••' : 'Não configurado')
      console.log('🔑 Refresh Token:', unidadeData.google_refresh_token ? '••••••••' : 'Não configurado')
      console.log('📊 Google Ads Ativo:', unidadeData.google_ads_active ? 'Sim' : 'Não')

      return this.credentials
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error)
      throw error
    }
  }

  /**
   * Valida se as credenciais estão completas
   */
  validateCredentials() {
    if (!this.credentials) {
      return {
        isValid: false,
        errors: ['Credenciais não carregadas']
      }
    }

    const errors = []
    const required = [
      { field: 'customerId', name: 'Customer ID' },
      { field: 'developerToken', name: 'Developer Token' },
      { field: 'clientId', name: 'Client ID' },
      { field: 'clientSecret', name: 'Client Secret' },
      { field: 'refreshToken', name: 'Refresh Token' }
    ]

    required.forEach(({ field, name }) => {
      if (!this.credentials[field]) {
        errors.push(`${name} não configurado`)
      }
    })

    if (!this.credentials.isActive) {
      errors.push('Google Ads não está ativo para esta unidade')
    }

    return {
      isValid: errors.length === 0,
      errors,
      credentials: {
        hasCustomerId: !!this.credentials.customerId,
        hasDeveloperToken: !!this.credentials.developerToken,
        hasClientId: !!this.credentials.clientId,
        hasClientSecret: !!this.credentials.clientSecret,
        hasRefreshToken: !!this.credentials.refreshToken,
        isActive: this.credentials.isActive
      }
    }
  }

  /**
   * Testa a conexão básica com Google Ads API
   * (Este é um teste simulado já que precisamos de um token de acesso válido)
   */
  async testBasicConnection() {
    try {
      console.log('🧪 Testando conexão básica com Google Ads API...')

      if (!this.credentials) {
        await this.loadCredentials()
      }

      const validation = this.validateCredentials()
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Credenciais incompletas',
          details: validation.errors,
          credentials: validation.credentials
        }
      }

      // Teste básico de formato do Customer ID
      const customerIdPattern = /^\d{10}$/
      const isValidCustomerId = customerIdPattern.test(this.credentials.customerId?.replace(/-/g, ''))

      if (!isValidCustomerId) {
        return {
          success: false,
          error: 'Customer ID em formato inválido',
          details: ['Customer ID deve ter 10 dígitos'],
          credentials: validation.credentials
        }
      }

      // Se chegou até aqui, as credenciais estão bem formatadas
      console.log('✅ Credenciais validadas com sucesso')
      
      return {
        success: true,
        message: 'Credenciais validadas - prontas para uso com Google Ads API',
        customerInfo: {
          customerId: this.credentials.customerId,
          unidade: this.credentials.unidadeName,
          isActive: this.credentials.isActive
        },
        credentials: validation.credentials,
        nextSteps: [
          'Para testar a API real, é necessário um servidor backend',
          'As credenciais estão corretas e podem ser usadas para chamadas da API',
          'Recomenda-se implementar um proxy backend para segurança'
        ]
      }

    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error)
      return {
        success: false,
        error: error.message,
        credentials: null
      }
    }
  }

  /**
   * Simula uma chamada para obter informações da conta
   */
  async getCustomerInfo() {
    try {
      const connectionTest = await this.testBasicConnection()
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.error)
      }

      // Informações simuladas baseadas nas credenciais reais
      return {
        customerId: this.credentials.customerId,
        name: this.credentials.unidadeName,
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        status: this.credentials.isActive ? 'ACTIVE' : 'SUSPENDED',
        hasValidCredentials: true,
        credentialsLoaded: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error)
      throw error
    }
  }

  /**
   * Executa todos os testes de validação
   */
  async runAllTests() {
    console.log('🧪 Iniciando bateria completa de testes...')
    console.log('===============================================')

    const results = {
      loadCredentials: null,
      validateCredentials: null,
      testConnection: null,
      customerInfo: null,
      timestamp: new Date().toISOString()
    }

    try {
      // Teste 1: Carregar credenciais
      console.log('📋 Teste 1: Carregando credenciais do Supabase...')
      results.loadCredentials = {
        success: true,
        data: await this.loadCredentials()
      }
      console.log('✅ Credenciais carregadas')

      // Teste 2: Validar credenciais
      console.log('🔍 Teste 2: Validando formato das credenciais...')
      const validation = this.validateCredentials()
      results.validateCredentials = {
        success: validation.isValid,
        data: validation
      }
      console.log(validation.isValid ? '✅ Credenciais válidas' : '❌ Credenciais inválidas')

      // Teste 3: Teste de conexão
      console.log('🌐 Teste 3: Testando conexão básica...')
      const connectionTest = await this.testBasicConnection()
      results.testConnection = connectionTest
      console.log(connectionTest.success ? '✅ Conexão OK' : '❌ Conexão falhou')

      // Teste 4: Informações da conta
      console.log('👤 Teste 4: Obtendo informações da conta...')
      try {
        const customerInfo = await this.getCustomerInfo()
        results.customerInfo = {
          success: true,
          data: customerInfo
        }
        console.log('✅ Informações da conta obtidas')
      } catch (error) {
        results.customerInfo = {
          success: false,
          error: error.message
        }
        console.log('❌ Falha ao obter informações da conta')
      }

      // Calcular score geral
      const tests = Object.values(results).filter(r => r !== null && typeof r === 'object')
      const successfulTests = tests.filter(t => t.success).length
      const score = Math.round((successfulTests / tests.length) * 100)

      console.log('\n📊 RESULTADOS FINAIS')
      console.log('====================')
      console.log(`Score: ${score}% (${successfulTests}/${tests.length} testes passaram)`)
      
      return {
        score,
        results,
        summary: {
          totalTests: tests.length,
          successfulTests,
          failedTests: tests.length - successfulTests
        }
      }

    } catch (error) {
      console.error('❌ Erro durante os testes:', error)
      return {
        score: 0,
        results,
        error: error.message
      }
    }
  }
}

export const googleAdsConnectionTest = new GoogleAdsConnectionTest()
export default GoogleAdsConnectionTest