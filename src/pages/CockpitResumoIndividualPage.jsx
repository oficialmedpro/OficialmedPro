import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { 
  getCockpitVendedoresConfig, 
  getMetasVendedores, 
  getMetaVendedorPorDia,
  getEntradasVendedoresHoje,
  getOrcamentosVendedoresHoje,
  getVendasVendedoresHoje,
  getDiasUteis,
  getVendedoresPorIds
} from '../service/supabase';
import { ArrowLeft } from 'lucide-react';

const CockpitResumoIndividualPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { vendedorId } = useParams();
  const [loading, setLoading] = useState(true);
  const [vendedor, setVendedor] = useState(null);
  const [dadosResumo, setDadosResumo] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });

  useEffect(() => {
    carregarDados();
  }, [vendedorId, dataSelecionada]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      if (!vendedorId) {
        console.error('❌ [CockpitResumoIndividual] vendedorId não fornecido');
        return;
      }

      const vendedorIdNum = parseInt(vendedorId);
      
      // Buscar dados do vendedor
      const vendedoresData = await getVendedoresPorIds([vendedorIdNum]);
      if (vendedoresData.length === 0) {
        console.error('❌ [CockpitResumoIndividual] Vendedor não encontrado');
        return;
      }
      setVendedor(vendedoresData[0]);

      // Buscar configurações do cockpit para este vendedor
      const configs = await getCockpitVendedoresConfig();
      const configVendedor = configs.find(c => c.vendedor_id_sprint === vendedorIdNum && c.ativo);
      
      if (!configVendedor) {
        console.error('❌ [CockpitResumoIndividual] Configuração não encontrada para o vendedor');
        return;
      }

      const funilIdsMap = { [vendedorIdNum]: configVendedor.funil_id };

      // Buscar metas, entradas, orçamentos e vendas
      const [metasData, entradasData, orcamentosData, vendasData, diasUteis] = await Promise.all([
        getMetasVendedores(),
        getEntradasVendedoresHoje([vendedorIdNum], dataSelecionada, funilIdsMap),
        getOrcamentosVendedoresHoje([vendedorIdNum], dataSelecionada, funilIdsMap),
        getVendasVendedoresHoje([vendedorIdNum], dataSelecionada, funilIdsMap),
        (async () => {
          const hoje = new Date();
          const ano = hoje.getFullYear();
          const mes = hoje.getMonth() + 1;
          try {
            return await getDiasUteis(ano, mes);
          } catch (error) {
            console.warn('⚠️ Erro ao buscar dias úteis:', error);
            return null;
          }
        })()
      ]);

      // Buscar metas para o vendedor
      const metasArray = Array.isArray(metasData) ? metasData : [];
      const metaEntrada = getMetaVendedorPorDia(metasArray, vendedorIdNum, 'Entrada');
      const metaOrcamentos = getMetaVendedorPorDia(metasArray, vendedorIdNum, 'Orçamentos');
      const metaVendas = getMetaVendedorPorDia(metasArray, vendedorIdNum, 'Vendas');
      const metaValor = getMetaVendedorPorDia(metasArray, vendedorIdNum, 'Valor');
      const metaTicketMedio = getMetaVendedorPorDia(metasArray, vendedorIdNum, 'Ticket_Medio');
      const metaConversao = getMetaVendedorPorDia(metasArray, vendedorIdNum, 'Conversão');

      // Dados realizados
      const entradaAtual = entradasData[vendedorIdNum] || 0;
      const orcamentoAtual = orcamentosData[vendedorIdNum] || 0;
      const vendasDataVendedor = vendasData[vendedorIdNum] || { contagem: 0, valorTotal: 0, ticketMedio: 0 };
      const vendasAtual = vendasDataVendedor.contagem || 0;
      const valorAtual = vendasDataVendedor.valorTotal || 0;
      const ticketMedioAtual = vendasDataVendedor.ticketMedio || 0;
      const conversaoAtual = entradaAtual > 0 ? (vendasAtual / entradaAtual) * 100 : 0;

      // Calcular meta acumulada
      const calcularMetaAcumulada = (metaTotal, realizadoAtual) => {
        if (!diasUteis || !diasUteis.dias_uteis_restantes || diasUteis.dias_uteis_restantes <= 0) {
          return null;
        }
        if (!metaTotal || metaTotal <= 0) return null;
        if (realizadoAtual >= metaTotal) return 0;
        const metaRestante = metaTotal - realizadoAtual;
        return Math.ceil(metaRestante / diasUteis.dias_uteis_restantes);
      };

      const metaAcumuladaEntrada = calcularMetaAcumulada(metaEntrada, entradaAtual);
      const metaAcumuladaOrcamentos = calcularMetaAcumulada(metaOrcamentos, orcamentoAtual);
      const metaAcumuladaVendas = calcularMetaAcumulada(metaVendas, vendasAtual);
      const metaAcumuladaValor = calcularMetaAcumulada(metaValor, valorAtual);

      // Calcular porcentagem da meta
      const porcentagemMeta = (atual, meta) => {
        if (!meta || meta === 0) return 0;
        return Math.round((atual / meta) * 100 * 10) / 10;
      };

      setDadosResumo({
        metaEntrada,
        metaOrcamentos,
        metaVendas,
        metaValor,
        metaTicketMedio,
        metaConversao,
        entradaAtual,
        orcamentoAtual,
        vendasAtual,
        valorAtual,
        ticketMedioAtual,
        conversaoAtual,
        metaAcumuladaEntrada,
        metaAcumuladaOrcamentos,
        metaAcumuladaVendas,
        metaAcumuladaValor,
        diasUteisRestantes: diasUteis?.dias_uteis_restantes || null,
        porcentagemMetaEntrada: porcentagemMeta(entradaAtual, metaEntrada),
        porcentagemMetaOrcamentos: porcentagemMeta(orcamentoAtual, metaOrcamentos),
        porcentagemMetaVendas: porcentagemMeta(vendasAtual, metaVendas),
        porcentagemMetaValor: porcentagemMeta(valorAtual, metaValor),
        porcentagemMetaTicketMedio: porcentagemMeta(ticketMedioAtual, metaTicketMedio),
        porcentagemMetaConversao: porcentagemMeta(conversaoAtual, metaConversao)
      });

    } catch (error) {
      console.error('❌ [CockpitResumoIndividual] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 'R$ 0,00';
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return 'R$ 0,00';
    return `R$ ${numValor.toFixed(2).replace('.', ',')}`;
  };

  const formatarPorcentagem = (valor) => {
    if (valor === null || valor === undefined) return '0%';
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return '0%';
    if (numValor % 1 === 0) {
      return `${numValor}%`;
    }
    return `${numValor.toFixed(1).replace('.', ',')}%`;
  };

  const getClasseMetrica = (porcentagem) => {
    if (porcentagem >= 100) return 'good';
    if (porcentagem >= 81) return 'warning-light';
    if (porcentagem >= 51) return 'warning';
    return 'bad';
  };

  if (loading) {
    return (
      <div className="cockpit-vendedores-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!vendedor || !dadosResumo) {
    return (
      <div className="cockpit-vendedores-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Vendedor não encontrado</div>
          <button onClick={() => navigate('/cockpit-vendedores')} style={{ marginTop: '20px' }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-vendedores-page">
      <div className="cockpit-vendedores-container">
        <div className="cockpit-vendedores-header">
          <div className="cockpit-vendedores-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-vendedores-logo" />
          </div>
          <div className="cockpit-vendedores-header-center">
            <h1 className="cockpit-vendedores-titulo">Resumo Individual - {vendedor.nome}</h1>
          </div>
          <div className="cockpit-vendedores-header-right">
            <button
              className="cockpit-vendedores-header-btn"
              onClick={() => navigate('/cockpit-vendedores')}
            >
              <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Voltar
            </button>
            <div className="cockpit-vendedores-date-filter">
              <label htmlFor="data-filtro">Data:</label>
              <input
                id="data-filtro"
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="cockpit-vendedores-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="cockpit-vendedores-card">
            <div className="cockpit-vendedores-card-header">
              <h3 className="cockpit-vendedores-card-nome">Resumo Consolidado</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', padding: '24px' }}>
              {/* Meta */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Meta</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text)' }}>
                  {formatarMoeda(dadosResumo.metaValor)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Faturamento mensal
                </div>
              </div>

              {/* Realizado */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Realizado</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: `var(--${getClasseMetrica(dadosResumo.porcentagemMetaValor) === 'good' ? 'success' : getClasseMetrica(dadosResumo.porcentagemMetaValor) === 'warning' ? 'warning' : 'danger'})`
                }}>
                  {formatarMoeda(dadosResumo.valorAtual)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Faturamento atual
                </div>
              </div>

              {/* % da Meta */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>% da Meta</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: `var(--${getClasseMetrica(dadosResumo.porcentagemMetaValor) === 'good' ? 'success' : getClasseMetrica(dadosResumo.porcentagemMetaValor) === 'warning' ? 'warning' : 'danger'})`
                }}>
                  {formatarPorcentagem(dadosResumo.porcentagemMetaValor)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Atingimento da meta
                </div>
              </div>

              {/* Dias Útil Restante */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Dias Útil Restante</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text)' }}>
                  {dadosResumo.diasUteisRestantes !== null ? dadosResumo.diasUteisRestantes : '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Dias úteis restantes do mês
                </div>
              </div>

              {/* Meta Dia Acumulado */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Meta Dia Acumulado</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text)' }}>
                  {dadosResumo.metaAcumuladaValor !== null ? formatarMoeda(dadosResumo.metaAcumuladaValor) : '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Meta diária necessária
                </div>
              </div>

              {/* Ticket Médio */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Ticket Médio</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: `var(--${getClasseMetrica(dadosResumo.porcentagemMetaTicketMedio) === 'good' ? 'success' : getClasseMetrica(dadosResumo.porcentagemMetaTicketMedio) === 'warning' ? 'warning' : 'danger'})`
                }}>
                  {formatarMoeda(dadosResumo.ticketMedioAtual)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Meta: {formatarMoeda(dadosResumo.metaTicketMedio)}
                </div>
              </div>

              {/* Nº Leads */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Nº Leads</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: `var(--${getClasseMetrica(dadosResumo.porcentagemMetaEntrada) === 'good' ? 'success' : getClasseMetrica(dadosResumo.porcentagemMetaEntrada) === 'warning' ? 'warning' : 'danger'})`
                }}>
                  {dadosResumo.entradaAtual}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Meta: {dadosResumo.metaEntrada || '—'}
                </div>
              </div>

              {/* Nº Vendas */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Nº Vendas</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: `var(--${getClasseMetrica(dadosResumo.porcentagemMetaVendas) === 'good' ? 'success' : getClasseMetrica(dadosResumo.porcentagemMetaVendas) === 'warning' ? 'warning' : 'danger'})`
                }}>
                  {dadosResumo.vendasAtual}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Meta: {dadosResumo.metaVendas || '—'}
                </div>
              </div>

              {/* Taxa Conversão */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--card-soft)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Taxa Conversão</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: `var(--${getClasseMetrica(dadosResumo.porcentagemMetaConversao) === 'good' ? 'success' : getClasseMetrica(dadosResumo.porcentagemMetaConversao) === 'warning' ? 'warning' : 'danger'})`
                }}>
                  {formatarPorcentagem(dadosResumo.conversaoAtual)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Meta: {formatarPorcentagem(dadosResumo.metaConversao)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CockpitResumoIndividualPage;

