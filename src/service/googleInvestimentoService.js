import { getTodayDateSP, getStartOfDaySP, getEndOfDaySP } from '../utils/utils'

/**
 * Service para buscar investimento em mídia paga (Google) no Supabase
 * Tabela: investimento_patrocinados (schema api)
 * Campos: data (date/timestamp), valor (numeric), plataforma (text)
 */
export const googleInvestimentoService = {
  /**
   * Retorna a soma do valor investido no período para plataforma="google"
   * @param {string|null} startDate YYYY-MM-DD (timezone São Paulo)
   * @param {string|null} endDate YYYY-MM-DD (timezone São Paulo)
   * @returns {Promise<{ total: number, items: Array }>} total em BRL
   */
  async getInvestimentoTotal(startDate = null, endDate = null) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

    // Datas default: hoje
    const start = startDate ? getStartOfDaySP(startDate) : getStartOfDaySP(getTodayDateSP())
    const end = endDate ? getEndOfDaySP(endDate) : getEndOfDaySP(getTodayDateSP())

    // Monta URL com filtros (PostgREST)
    const url = `${supabaseUrl}/rest/v1/investimento_patrocinados?select=data,valor,plataforma&plataforma=eq.google&data=gte.${encodeURIComponent(start)}&data=lte.${encodeURIComponent(end)}`

    const response = await fetch(url, {
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
      const text = await response.text()
      console.error('❌ Erro ao buscar investimento Google:', response.status, text)
      throw new Error(text || `HTTP ${response.status}`)
    }

    const rows = await response.json()
    const total = (rows || []).reduce((sum, row) => sum + (Number(row.valor) || 0), 0)
    return { total, items: rows || [] }
  }
}

export default googleInvestimentoService


