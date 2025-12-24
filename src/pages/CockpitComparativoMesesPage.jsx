import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { 
  getAllFunis,
  getAllVendedores
} from '../service/supabase';
import { FUNIS_COMERCIAIS_APUCARANA } from '../service/cockpitConstants';
import { getSupabaseConfig } from '../config/supabase';
import { ArrowLeft } from 'lucide-react';
import CockpitFiltros from '../components/CockpitFiltros';

const CockpitComparativoMesesPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dadosComparativo, setDadosComparativo] = useState([]);
  const [funis, setFunis] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [funilSelecionado, setFunilSelecionado] = useState(null);
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [metricasParaComparar] = useState(['Leads', 'Nº Vendas', 'Faturamento', 'Taxa Conversão', 'Ticket Médio']);

  useEffect(() => {
    carregarDados();
  }, [funilSelecionado, vendedorSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [funisData, vendedoresData] = await Promise.all([
        getAllFunis(),
        getAllVendedores()
      ]);
      
      setFunis(funisData || []);
      setVendedores(vendedoresData || []);
      
      // Data atual
      const hoje = new Date();
      const diaAtual = hoje.getDate();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      
      // Buscar dados dos últimos 6 meses até a data atual
      // TODOS os meses devem comparar até o dia atual (ex: se hoje é 24, todos comparam até dia 24)
      const mesesParaComparar = [];
      for (let i = 0; i < 6; i++) {
        let ano = anoAtual;
        let mes = mesAtual - i;
        while (mes <= 0) {
          mes += 12;
          ano -= 1;
        }
        mesesParaComparar.push({ ano, mes, diaFim: diaAtual }); // SEMPRE usar diaAtual
      }
      
      // Buscar dados de cada mês até a data correspondente
      const dados = await Promise.all(
        mesesParaComparar.map(async ({ ano, mes, diaFim }) => {
          try {
            // Verificar se o dia existe no mês (ex: 31 não existe em fevereiro)
            const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
            const diaParaUsar = Math.min(diaFim, ultimoDiaDoMes);
            
            // Calcular data fim: sempre até o dia atual (ou último dia do mês se o dia não existir)
            const dataFim = new Date(ano, mes - 1, diaParaUsar, 23, 59, 59, 999);
            
            const dataInicio = new Date(ano, mes - 1, 1);
            const inicioISO = dataInicio.toISOString();
            const fimISO = dataFim.toISOString();
            
            // Buscar vendas do período: apenas unidade Apucarana e status='gain'
            const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
            
            let funilFilter = '';
            if (funilSelecionado !== null) {
              funilFilter = `&funil_id=eq.${funilSelecionado}`;
            } else {
              // Se não houver funil específico, usar funis comerciais de Apucarana
              funilFilter = `&funil_id=in.(${FUNIS_COMERCIAIS_APUCARANA.join(',')})`;
            }
            
            const vendedorFilter = vendedorSelecionado !== null ? `&user_id=eq.${vendedorSelecionado}` : '';
            
            // Função auxiliar para buscar todos os dados com paginação
            const buscarTodos = async (url) => {
              let todos = [];
              let offset = 0;
              const limit = 1000; // Limite do PostgREST
              let hasMore = true;
              
              while (hasMore) {
                const urlComPaginacao = `${url}&limit=${limit}&offset=${offset}`;
                const res = await fetch(urlComPaginacao, { 
                  headers: { 
                    'Accept': 'application/json', 
                    'Authorization': `Bearer ${supabaseAnonKey}`, 
                    'apikey': supabaseAnonKey, 
                    'Accept-Profile': 'api', 
                    'Content-Profile': 'api',
                    'Prefer': 'count=exact'
                  } 
                });
                
                if (res.ok) {
                  const dados = await res.json();
                  todos = todos.concat(dados);
                  hasMore = dados.length === limit;
                  offset += limit;
                } else {
                  hasMore = false;
                }
              }
              
              return todos;
            };
            
            // Vendas: apenas unidade Apucarana e status='gain', usando gain_date
            const urlVendas = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,user_id,create_date&status=eq.gain&unidade_id=eq.%5B1%5D&gain_date=gte.${inicioISO}&gain_date=lte.${fimISO}${funilFilter}${vendedorFilter}`;
            
            // Leads: apenas unidade Apucarana, usando create_date
            const urlLeads = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id&unidade_id=eq.%5B1%5D&create_date=gte.${inicioISO}&create_date=lte.${fimISO}${funilFilter}${vendedorFilter}`;
            
            const [todasVendas, todasEntradas] = await Promise.all([
              buscarTodos(urlVendas),
              buscarTodos(urlLeads)
            ]);
            
            // Remover duplicatas
            const vendasUnicas = Array.from(new Map(todasVendas.map(v => [v.id, v])).values());
            const entradasUnicas = Array.from(new Map(todasEntradas.map(e => [e.id, e])).values());
            
            const numeroLeads = entradasUnicas.length;
            const numeroVendas = vendasUnicas.length;
            const faturamento = vendasUnicas.reduce((sum, v) => sum + (parseFloat(v.value) || 0), 0);
            const taxaConversao = numeroLeads > 0 ? (numeroVendas / numeroLeads) * 100 : 0;
            const ticketMedio = numeroVendas > 0 ? faturamento / numeroVendas : 0;
            
            return {
              ano,
              mes,
              diaFim: diaParaUsar,
              numeroLeads,
              numeroVendas,
              faturamento,
              taxaConversao,
              ticketMedio
            };
          } catch (error) {
            console.error(`Erro ao buscar dados de ${ano}-${mes}:`, error);
            const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
            const diaParaUsar = Math.min(diaFim, ultimoDiaDoMes);
            return {
              ano,
              mes,
              diaFim: diaParaUsar,
              numeroLeads: 0,
              numeroVendas: 0,
              faturamento: 0,
              taxaConversao: 0,
              ticketMedio: 0
            };
          }
        })
      );
      
      setDadosComparativo(dados.reverse()); // Mais antigo primeiro
      
    } catch (error) {
      console.error('❌ [CockpitComparativoMeses] Erro ao carregar dados:', error);
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

  // Função para calcular diferença percentual
  const calcularDiferencaPercentual = (valor, valorComparacao) => {
    if (!valorComparacao || valorComparacao === 0) return null;
    return ((valor - valorComparacao) / valorComparacao) * 100;
  };

  // Função para obter classe de cor baseada na variação percentual
  const getClasseVariacao = (variacao) => {
    if (variacao === null || variacao === undefined) return '';
    if (variacao > 10) return 'good'; // > 10% de aumento
    if (variacao > 0) return 'warning-light'; // 0-10% de aumento
    if (variacao > -10) return 'warning'; // 0 a -10%
    return 'bad'; // < -10%
  };

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calcular melhor mês para cada métrica
  const calcularMelhorMes = (dados, campo) => {
    if (!dados || dados.length === 0) return null;
    return dados.reduce((melhor, atual) => {
      return (atual[campo] > melhor[campo]) ? atual : melhor;
    });
  };

  const melhorMesLeads = calcularMelhorMes(dadosComparativo, 'numeroLeads');
  const melhorMesVendas = calcularMelhorMes(dadosComparativo, 'numeroVendas');
  const melhorMesFaturamento = calcularMelhorMes(dadosComparativo, 'faturamento');
  const melhorMesConversao = calcularMelhorMes(dadosComparativo, 'taxaConversao');
  const melhorMesTicket = calcularMelhorMes(dadosComparativo, 'ticketMedio');

  if (loading) {
    return (
      <div className="cockpit-vendedores-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Carregando...</div>
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
            <h1 className="cockpit-vendedores-titulo">Comparativo de Meses</h1>
            <div className="cockpit-vendedores-descricao">
              Comparativo até a data atual de cada mês (ex: 23/12 vs 23/11 vs 23/10) com mapa de calor
            </div>
          </div>
          <div className="cockpit-vendedores-header-right">
            <button
              className="cockpit-vendedores-header-btn"
              onClick={() => navigate('/cockpit-vendedores')}
            >
              <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Voltar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <CockpitFiltros
          funis={funis}
          vendedores={vendedores}
          funilSelecionado={funilSelecionado}
          vendedorSelecionado={vendedorSelecionado}
          onFunilChange={setFunilSelecionado}
          onVendedorChange={setVendedorSelecionado}
          labelFunil="Funil"
          labelVendedor="Vendedor"
          mostrarTodos={true}
        />

        {/* Tabela de Comparativo */}
        <div className="cockpit-vendedores-grid" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
          <div className="cockpit-vendedores-card">
            <div className="cockpit-vendedores-card-header">
              <h3 className="cockpit-vendedores-card-nome">Comparativo até Data Atual</h3>
            </div>
            
            <div className="cockpit-vendedores-tabela-rondas" style={{ padding: '24px', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Data Até</th>
                    {metricasParaComparar.map(metrica => (
                      <th key={metrica} colSpan="3">
                        {metrica}
                        <div style={{ fontSize: '0.85em', fontWeight: 'normal', marginTop: '4px' }}>
                          Valor | vs Mês Passado | vs Melhor
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosComparativo.map((item, index) => {
                    const mesAnterior = index > 0 ? dadosComparativo[index - 1] : null;
                    
                    // Comparações com mês anterior
                    const diffLeadsAnterior = mesAnterior ? calcularDiferencaPercentual(item.numeroLeads, mesAnterior.numeroLeads) : null;
                    const diffVendasAnterior = mesAnterior ? calcularDiferencaPercentual(item.numeroVendas, mesAnterior.numeroVendas) : null;
                    const diffFaturamentoAnterior = mesAnterior ? calcularDiferencaPercentual(item.faturamento, mesAnterior.faturamento) : null;
                    const diffConversaoAnterior = mesAnterior ? calcularDiferencaPercentual(item.taxaConversao, mesAnterior.taxaConversao) : null;
                    const diffTicketAnterior = mesAnterior ? calcularDiferencaPercentual(item.ticketMedio, mesAnterior.ticketMedio) : null;
                    
                    // Comparações com melhor mês
                    const diffLeadsMelhor = melhorMesLeads ? calcularDiferencaPercentual(item.numeroLeads, melhorMesLeads.numeroLeads) : null;
                    const diffVendasMelhor = melhorMesVendas ? calcularDiferencaPercentual(item.numeroVendas, melhorMesVendas.numeroVendas) : null;
                    const diffFaturamentoMelhor = melhorMesFaturamento ? calcularDiferencaPercentual(item.faturamento, melhorMesFaturamento.faturamento) : null;
                    const diffConversaoMelhor = melhorMesConversao ? calcularDiferencaPercentual(item.taxaConversao, melhorMesConversao.taxaConversao) : null;
                    const diffTicketMelhor = melhorMesTicket ? calcularDiferencaPercentual(item.ticketMedio, melhorMesTicket.ticketMedio) : null;
                    
                    return (
                      <tr key={`${item.ano}-${item.mes}`}>
                        <td style={{ fontWeight: 'bold' }}>{nomesMeses[item.mes - 1]}/{item.ano}</td>
                        <td>{item.diaFim}/{item.mes.toString().padStart(2, '0')}</td>
                        {/* Leads */}
                        <td>{item.numeroLeads}</td>
                        <td className={getClasseVariacao(diffLeadsAnterior)}>
                          {diffLeadsAnterior !== null ? `${diffLeadsAnterior >= 0 ? '+' : ''}${diffLeadsAnterior.toFixed(1)}%` : '—'}
                        </td>
                        <td className={getClasseVariacao(diffLeadsMelhor)}>
                          {diffLeadsMelhor !== null ? `${diffLeadsMelhor >= 0 ? '+' : ''}${diffLeadsMelhor.toFixed(1)}%` : '—'}
                        </td>
                        {/* Vendas */}
                        <td>{item.numeroVendas}</td>
                        <td className={getClasseVariacao(diffVendasAnterior)}>
                          {diffVendasAnterior !== null ? `${diffVendasAnterior >= 0 ? '+' : ''}${diffVendasAnterior.toFixed(1)}%` : '—'}
                        </td>
                        <td className={getClasseVariacao(diffVendasMelhor)}>
                          {diffVendasMelhor !== null ? `${diffVendasMelhor >= 0 ? '+' : ''}${diffVendasMelhor.toFixed(1)}%` : '—'}
                        </td>
                        {/* Faturamento */}
                        <td>{formatarMoeda(item.faturamento)}</td>
                        <td className={getClasseVariacao(diffFaturamentoAnterior)}>
                          {diffFaturamentoAnterior !== null ? `${diffFaturamentoAnterior >= 0 ? '+' : ''}${diffFaturamentoAnterior.toFixed(1)}%` : '—'}
                        </td>
                        <td className={getClasseVariacao(diffFaturamentoMelhor)}>
                          {diffFaturamentoMelhor !== null ? `${diffFaturamentoMelhor >= 0 ? '+' : ''}${diffFaturamentoMelhor.toFixed(1)}%` : '—'}
                        </td>
                        {/* Conversão */}
                        <td>{formatarPorcentagem(item.taxaConversao)}</td>
                        <td className={getClasseVariacao(diffConversaoAnterior)}>
                          {diffConversaoAnterior !== null ? `${diffConversaoAnterior >= 0 ? '+' : ''}${diffConversaoAnterior.toFixed(1)}%` : '—'}
                        </td>
                        <td className={getClasseVariacao(diffConversaoMelhor)}>
                          {diffConversaoMelhor !== null ? `${diffConversaoMelhor >= 0 ? '+' : ''}${diffConversaoMelhor.toFixed(1)}%` : '—'}
                        </td>
                        {/* Ticket Médio */}
                        <td>{formatarMoeda(item.ticketMedio)}</td>
                        <td className={getClasseVariacao(diffTicketAnterior)}>
                          {diffTicketAnterior !== null ? `${diffTicketAnterior >= 0 ? '+' : ''}${diffTicketAnterior.toFixed(1)}%` : '—'}
                        </td>
                        <td className={getClasseVariacao(diffTicketMelhor)}>
                          {diffTicketMelhor !== null ? `${diffTicketMelhor >= 0 ? '+' : ''}${diffTicketMelhor.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CockpitComparativoMesesPage;

