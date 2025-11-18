/**
 * Script para testar as credenciais do Google Ads
 * Este script verifica se o refresh token está funcionando
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-anon-key'

async function testGoogleCredentials() {
  try {
    console.log('🔍 Testando credenciais do Google Ads...')
    
    // Buscar credenciais do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/unidades?select=*&codigo_sprint=eq.[1]`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    if (!data || data.length === 0) {
      throw new Error('Unidade Apucarana não encontrada')
    }

    const unidade = data[0]
    
    // Validar credenciais
    if (!unidade.google_customer_id || !unidade.google_developer_token || 
        !unidade.google_client_id || !unidade.google_client_secret || 
        !unidade.google_refresh_token || !unidade.google_ads_active) {
      throw new Error('Credenciais incompletas para unidade Apucarana')
    }

    console.log('✅ Credenciais encontradas no banco')
    console.log('🆔 Customer ID:', unidade.google_customer_id)
    console.log('🔑 Developer Token:', unidade.google_developer_token ? `${unidade.google_developer_token.substring(0, 10)}...` : '❌ Ausente')
    console.log('🔑 Client ID:', unidade.google_client_id ? `${unidade.google_client_id.substring(0, 15)}...` : '❌ Ausente')
    console.log('🔑 Refresh Token:', unidade.google_refresh_token ? `${unidade.google_refresh_token.substring(0, 20)}...` : '❌ Ausente')

    // Testar refresh token
    console.log('\n🔑 Testando refresh token...')
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: unidade.google_client_id,
        client_secret: unidade.google_client_secret,
        refresh_token: unidade.google_refresh_token,
        grant_type: 'refresh_token'
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('❌ Erro ao obter access token:', error)
      
      // Verificar se é erro de refresh token expirado
      if (error.includes('invalid_grant')) {
        console.log('\n💡 SOLUÇÃO: O refresh token expirou!')
        console.log('📋 Passos para resolver:')
        console.log('1. Acesse o Google Cloud Console')
        console.log('2. Vá para APIs & Services > Credentials')
        console.log('3. Clique no seu OAuth 2.0 Client ID')
        console.log('4. Gere um novo refresh token')
        console.log('5. Atualize o refresh_token no banco de dados')
      }
      
      throw new Error(`Token error: ${error}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Access token obtido com sucesso!')
    console.log('🔑 Token válido por:', tokenData.expires_in, 'segundos')
    
    return true

  } catch (error) {
    console.error('❌ Erro ao testar credenciais:', error.message)
    return false
  }
}

// Executar teste
testGoogleCredentials()
  .then(success => {
    if (success) {
      console.log('\n🎉 Teste concluído com sucesso!')
    } else {
      console.log('\n💥 Teste falhou!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
