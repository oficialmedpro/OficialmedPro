/**
 * Teste de conexão
 */
async function handleTestConnection() {
  try {
    const credentials = await getGoogleAdsCredentials()
    
    const results = await queryGoogleAds(credentials, `
      SELECT 
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conexão estabelecida com sucesso',
        customerInfo: {
          customerId: credentials.customer_id,
          customerName: results[0]?.customer?.descriptive_name || credentials.unidade_name,
          unidade: credentials.unidade_name
        },
        isRealData: true,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        isRealData: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}