// Função utilitária para filtro Google Ads padronizado
export function getGoogleAdsOriginFilter() {
  return `&or=(origem_oportunidade.eq.Google Ads,utm_source.eq.google,utm_source.eq.GoogleAds)`;
}

// Função utilitária para Postgres puro (SQL)
export const googleAdsOriginSQL = `(
  origem_oportunidade = 'Google Ads'
  OR utm_source = 'google'
  OR utm_source = 'GoogleAds'
)`;
