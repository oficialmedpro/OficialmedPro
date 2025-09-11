// Serviço para métricas de oportunidades com origem Google (oportunidade_sprint)
// Usa PostgREST direto, como no restante do projeto

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

const headers = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': supabaseSchema,
  'Content-Profile': supabaseSchema
}

// Monta filtro de origem Google (mais flexível)
const googleOriginFilter = () => {
  // Inclui origem_oportunidade = 'Google Ads' e variações em utm_source
  return `or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`
}

export const googleOportunidadesService = {
  /**
   * Retorna métricas do período:
   * - ganhas (count, sum valor)
   * - perdidas (count, sum valor)
   * - abertas (count atual)
   * - criadas (para taxa de conversão)
   */
  async getPeriodoMetrics(startISODate, endISODate) {
    const origin = googleOriginFilter()

    const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${startISODate}&gain_date=lte.${endISODate}T23:59:59&${origin}`
    const perdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${startISODate}&lost_date=lte.${endISODate}T23:59:59&${origin}`
    const abertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&${origin}`
    const criadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${startISODate}&create_date=lte.${endISODate}T23:59:59&${origin}`

    const [ganhasRes, perdidasRes, abertasRes, criadasRes] = await Promise.all([
      fetch(ganhasUrl, { headers }),
      fetch(perdidasUrl, { headers }),
      fetch(abertasUrl, { headers }),
      fetch(criadasUrl, { headers })
    ])

    const safeJson = async (res) => (res.ok ? res.json() : [])
    const [ganhas, perdidas, abertas, criadas] = await Promise.all([
      safeJson(ganhasRes),
      safeJson(perdidasRes),
      safeJson(abertasRes),
      safeJson(criadasRes)
    ])

    const sum = (arr) => arr.reduce((acc, r) => acc + (Number(r.value) || 0), 0)

    const totalGanhas = ganhas.length
    const valorGanho = sum(ganhas)
    const totalPerdidas = perdidas.length
    const valorPerda = sum(perdidas)
    const totalAbertas = abertas.length
    const totalCriadas = criadas.length

    const taxaConversao = totalCriadas > 0 ? (totalGanhas / totalCriadas) * 100 : 0

    return {
      totalGanhas,
      valorGanho,
      totalPerdidas,
      valorPerda,
      totalAbertas,
      totalCriadas,
      taxaConversao
    }
  }
}

export default googleOportunidadesService


