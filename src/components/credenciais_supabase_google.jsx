import React, { useState, useEffect } from 'react'
import { googleAdsConnectionTest } from '../service/googleAdsConnectionTest.js'
import './credenciais_supabase_google.css'

// Configurações do Supabase (mesmo padrão do supabase.js)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

const CredenciaisSupabaseGoogle = () => {
  const [unidade, setUnidade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testResults, setTestResults] = useState(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const carregarUnidade = async () => {
      try {
        setLoading(true)
        console.log('🔍 Carregando unidade com código_sprint="[1]"...')
        
        // Usar abordagem HTTP direta igual ao getUnidades() que funciona
        const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=id,unidade,codigo_sprint,status,google_customer_id,google_developer_token,google_client_id,google_client_secret,google_refresh_token,google_ads_active&codigo_sprint=eq.[1]`, {
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
        setUnidade(unidadeData)
        console.log('✅ Unidade carregada:', unidadeData)
        
      } catch (err) {
        console.error('❌ Erro ao carregar unidade:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    carregarUnidade()
  }, [])

  const testarConexao = async () => {
    try {
      setTesting(true)
      setTestResults(null)
      console.log('🧪 Iniciando teste de conexão com Google Ads...')
      
      const results = await googleAdsConnectionTest.runAllTests()
      setTestResults(results)
      console.log('✅ Testes concluídos:', results)
      
    } catch (err) {
      console.error('❌ Erro durante os testes:', err)
      setTestResults({
        score: 0,
        error: err.message,
        results: null
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="credenciais-loading">
        <p>Carregando credenciais Google...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="credenciais-error">
        <p>Erro ao carregar credenciais: {error}</p>
      </div>
    )
  }

  if (!unidade) {
    return (
      <div className="credenciais-not-found">
        <p>Unidade com código_sprint="[1]" não encontrada</p>
      </div>
    )
  }

  return (
    <div className="credenciais-supabase-google">
      <h2>Credenciais Google Ads - {unidade.unidade}</h2>
      
      <div className="credenciais-detalhes">
        <div className="credencial-item">
          <label>Google Customer ID:</label>
          <span>{unidade.google_customer_id || 'Não configurado'}</span>
        </div>
        <div className="credencial-item">
          <label>Google Developer Token:</label>
          <span>{unidade.google_developer_token ? '••••••••' : 'Não configurado'}</span>
        </div>
        <div className="credencial-item">
          <label>Google Client ID:</label>
          <span>{unidade.google_client_id || 'Não configurado'}</span>
        </div>
        <div className="credencial-item">
          <label>Google Client Secret:</label>
          <span>{unidade.google_client_secret ? '••••••••' : 'Não configurado'}</span>
        </div>
        <div className="credencial-item">
          <label>Google Refresh Token:</label>
          <span>{unidade.google_refresh_token ? '••••••••' : 'Não configurado'}</span>
        </div>
        <div className="credencial-item">
          <label>Google Ads Ativo:</label>
          <span className={`status ${unidade.google_ads_active ? 'ativo' : 'inativo'}`}>
            {unidade.google_ads_active ? 'Sim' : 'Não'}
          </span>
        </div>
      </div>

      <div className="teste-conexao">
        <h3>Teste de Conexão</h3>
        <button 
          onClick={testarConexao} 
          disabled={testing}
          className="btn-teste"
        >
          {testing ? 'Testando...' : 'Testar Conexão Google Ads'}
        </button>

        {testResults && (
          <div className="resultado-teste">
            <h4>Resultados do Teste</h4>
            <div className={`score ${testResults.score >= 75 ? 'success' : testResults.score >= 50 ? 'warning' : 'error'}`}>
              Score: {testResults.score}%
            </div>
            
            {testResults.error && (
              <div className="error-message">
                <strong>Erro:</strong> {testResults.error}
              </div>
            )}

            {testResults.results && (
              <div className="detalhes-teste">
                <div className="teste-item">
                  <span>Carregar Credenciais:</span>
                  <span className={testResults.results.loadCredentials?.success ? 'success' : 'error'}>
                    {testResults.results.loadCredentials?.success ? '✅' : '❌'}
                  </span>
                </div>
                <div className="teste-item">
                  <span>Validar Formato:</span>
                  <span className={testResults.results.validateCredentials?.success ? 'success' : 'error'}>
                    {testResults.results.validateCredentials?.success ? '✅' : '❌'}
                  </span>
                </div>
                <div className="teste-item">
                  <span>Teste Conexão:</span>
                  <span className={testResults.results.testConnection?.success ? 'success' : 'error'}>
                    {testResults.results.testConnection?.success ? '✅' : '❌'}
                  </span>
                </div>
                <div className="teste-item">
                  <span>Info da Conta:</span>
                  <span className={testResults.results.customerInfo?.success ? 'success' : 'error'}>
                    {testResults.results.customerInfo?.success ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            )}

            {testResults.results?.testConnection?.nextSteps && (
              <div className="next-steps">
                <h5>Próximos Passos:</h5>
                <ul>
                  {testResults.results.testConnection.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CredenciaisSupabaseGoogle