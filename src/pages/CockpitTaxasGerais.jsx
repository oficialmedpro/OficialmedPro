import React, { useState, useEffect, useRef } from 'react';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { getCockpitVendedoresConfig, getMetasVendedores, getMetasRondas, getEntradasVendedoresHoje, getEntradasVendedoresPorRonda, getOrcamentosVendedoresHoje, getOrcamentosVendedoresPorRonda, getVendasVendedoresHoje, getVendasVendedoresPorRonda, getAllFunis, getAllVendedores } from '../service/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, Sun, Moon, Plus, Minus } from 'lucide-react';
import CockpitFiltros from '../components/CockpitFiltros';

const CockpitTaxasGerais = ({ onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });
  const [dadosAgregados, setDadosAgregados] = useState({
    entradas: 0,
    orcamentos: 0,
    vendas: 0,
    valor: 0,
    ticketMedio: 0,
    qualificacao: 0,
    conversao: 0,
    conversaoOrcVenda: 0
  });
  const [metasGerais, setMetasGerais] = useState({
    entradas: 0,
    orcamentos: 0,
    vendas: 0,
    valor: 0,
    ticketMedio: 0,
    conversao: 0
  });
  const [entradasPorRonda, setEntradasPorRonda] = useState({});
  const [orcamentosPorRonda, setOrcamentosPorRonda] = useState({});
  const [vendasPorRonda, setVendasPorRonda] = useState({});
  const [metasRondas, setMetasRondas] = useState([]);
  
  // Filtros (apenas funil - agrupa vendedores daquele funil)
  const [funilSelecionado, setFunilSelecionado] = useState(null); // null = todos
  const [todosFunis, setTodosFunis] = useState([]);
  const [configVendedores, setConfigVendedores] = useState([]);
  
  // Controles de tema e fonte
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const saved = localStorage.getItem('cockpit-theme');
    return saved === 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('cockpit-font-size');
    return saved || 'md';
  });
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const floatingControlsRef = useRef(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [configs, metasData, funisData] = await Promise.all([
          getCockpitVendedoresConfig(),
          getMetasVendedores(),
          getAllFunis()
        ]);

        setTodosFunis(funisData || []);
        setConfigVendedores(configs.filter(c => c.ativo));

        let configsAtivas = configs.filter(c => c.ativo);
        
        // Aplicar filtro de funil se selecionado (agrupa todos os vendedores daquele funil)
        if (funilSelecionado !== null) {
          configsAtivas = configsAtivas.filter(c => c.funil_id === funilSelecionado);
        }
        
        const todosIds = [...new Set(configsAtivas.map(c => c.vendedor_id_sprint))].filter(id => id !== null && id !== undefined);
        
        const funilIdsMap = {};
        configsAtivas.forEach(c => {
          if (c.vendedor_id_sprint && c.funil_id) {
            funilIdsMap[c.vendedor_id_sprint] = c.funil_id;
          }
        });
        
        // Armazenar IDs dos vendedores filtrados para usar nas metas
        const vendedoresFiltradosSet = new Set(todosIds);

        // Buscar dados agregados (diário e por ronda)
        const [entradasData, entradasRondaData, orcamentosData, orcamentosRondaData, vendasData, vendasRondaData, metasRondasData] = await Promise.all([
          getEntradasVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getEntradasVendedoresPorRonda(todosIds, dataSelecionada, funilIdsMap),
          getOrcamentosVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getOrcamentosVendedoresPorRonda(todosIds, dataSelecionada, funilIdsMap),
          getVendasVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getVendasVendedoresPorRonda(todosIds, dataSelecionada, funilIdsMap),
          getMetasRondas()
        ]);

        setEntradasPorRonda(entradasRondaData);
        setOrcamentosPorRonda(orcamentosRondaData);
        setVendasPorRonda(vendasRondaData);
        setMetasRondas(metasRondasData || []);

        // Somar entradas
        const totalEntradas = Object.values(entradasData).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
        
        // Somar orçamentos
        const totalOrcamentos = Object.values(orcamentosData).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
        
        // Somar vendas, valor e calcular ticket médio
        let totalVendas = 0;
        let valorTotal = 0;
        Object.values(vendasData).forEach(v => {
          if (v && typeof v === 'object') {
            totalVendas += v.contagem || 0;
            valorTotal += v.valorTotal || 0;
          }
        });
        const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

        // Calcular taxas
        const qualificacao = totalEntradas > 0 ? (totalOrcamentos / totalEntradas) * 100 : 0;
        const conversao = totalEntradas > 0 ? (totalVendas / totalEntradas) * 100 : 0;
        const conversaoOrcVenda = totalOrcamentos > 0 ? (totalVendas / totalOrcamentos) * 100 : 0;

        setDadosAgregados({
          entradas: totalEntradas,
          orcamentos: totalOrcamentos,
          vendas: totalVendas,
          valor: valorTotal,
          ticketMedio,
          qualificacao,
          conversao,
          conversaoOrcVenda
        });

        // Calcular metas gerais (soma de todas as metas)
        // Buscar metas gerais (vendedor_id_sprint = 0) primeiro
        const metasGeraisBanco = metasData.filter(m => m.vendedor_id_sprint === 0);
        
        if (metasGeraisBanco.length > 0) {
          // Se existirem metas gerais no banco, usar elas
          const metasObj = {};
          metasGeraisBanco.forEach(meta => {
            metasObj[meta.nome_meta] = parseFloat(meta.valor_meta) || 0;
          });
          
          setMetasGerais({
            entradas: metasObj['Entrada'] || 0,
            orcamentos: metasObj['Orçamentos'] || 0,
            vendas: metasObj['Vendas'] || 0,
            valor: metasObj['Valor'] || 0,
            ticketMedio: metasObj['Ticket_Medio'] || 0,
            conversao: metasObj['Conversão'] || 0
          });
        } else {
          // Caso contrário, calcular somando todas as metas individuais dos vendedores filtrados
          const metasPorVendedor = {};
          metasData.forEach(meta => {
            const vendedorId = meta.vendedor_id_sprint;
            // Filtrar apenas vendedores que estão nos configs filtrados
            if (vendedorId !== 0 && todosIds.includes(vendedorId)) { // Ignorar metas gerais (0) e apenas vendedores filtrados
              if (!metasPorVendedor[vendedorId]) {
                metasPorVendedor[vendedorId] = {};
              }
              metasPorVendedor[vendedorId][meta.nome_meta] = parseFloat(meta.valor_meta) || 0;
            }
          });

          // Somar todas as metas (soma para quantidades, média para porcentagens)
          let totalMetaEntradas = 0;
          let totalMetaOrcamentos = 0;
          let totalMetaVendas = 0;
          let totalMetaValor = 0;
          let somaTicketMedio = 0;
          let somaConversao = 0;
          let countTicketMedio = 0;
          let countConversao = 0;

          Object.values(metasPorVendedor).forEach(metas => {
            totalMetaEntradas += metas['Entrada'] || 0;
            totalMetaOrcamentos += metas['Orçamentos'] || 0;
            totalMetaVendas += metas['Vendas'] || 0;
            totalMetaValor += metas['Valor'] || 0;
            if (metas['Ticket_Medio']) {
              somaTicketMedio += metas['Ticket_Medio'];
              countTicketMedio++;
            }
            if (metas['Conversão']) {
              somaConversao += metas['Conversão'];
              countConversao++;
            }
          });

          const metaTicketMedio = countTicketMedio > 0 ? somaTicketMedio / countTicketMedio : 0;
          const metaConversao = countConversao > 0 ? somaConversao / countConversao : 0;

          setMetasGerais({
            entradas: totalMetaEntradas,
            orcamentos: totalMetaOrcamentos,
            vendas: totalMetaVendas,
            valor: totalMetaValor,
            ticketMedio: metaTicketMedio,
            conversao: metaConversao
          });
        }

      } catch (error) {
        console.error('❌ [CockpitTaxasGerais] Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [dataSelecionada, funilSelecionado]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatingControlsRef.current && !floatingControlsRef.current.contains(event.target)) {
        setShowFloatingControls(false);
      }
    };

    if (showFloatingControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFloatingControls]);

  // Aplicar tema
  useEffect(() => {
    const page = document.querySelector('.cockpit-vendedores-page');
    if (isLightTheme) {
      page?.classList.add('light-theme');
      localStorage.setItem('cockpit-theme', 'light');
    } else {
      page?.classList.remove('light-theme');
      localStorage.setItem('cockpit-theme', 'dark');
    }
  }, [isLightTheme]);

  // Aplicar tamanho de fonte
  useEffect(() => {
    const page = document.querySelector('.cockpit-vendedores-page');
    if (page) {
      page.classList.remove('font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl', 'font-xxl', 'font-xxxl', 'font-xxxxl', 'font-xxxxxl');
      page.classList.add(`font-${fontSize}`);
      localStorage.setItem('cockpit-font-size', fontSize);
    }
  }, [fontSize]);

  // Handlers para controles flutuantes
  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  const increaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const formatarConversao = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '0%';
    return `${valor.toFixed(1).replace('.', ',')}%`;
  };

  const getClasseMetrica = (atual, meta) => {
    if (!meta || meta === 0 || meta === null || meta === undefined) return '';
    const porcentagem = (atual / meta) * 100;
    if (porcentagem >= 100) return 'good';
    if (porcentagem >= 81) return 'warning-light';
    if (porcentagem >= 51) return 'warning';
    return 'bad';
  };

  const formatarPorcentagemRealizado = (atual, meta) => {
    if (!meta || meta === 0) return '—';
    const porcentagem = (atual / meta) * 100;
    const falta = 100 - porcentagem;
    return `${porcentagem.toFixed(1).replace('.', ',')}% (falta ${falta.toFixed(1).replace('.', ',')}%)`;
  };

  // Função para obter meta geral de ronda (vendedor_id_sprint = 0 ou soma das metas dos vendedores filtrados)
  const getMetaGeralRonda = (nomeMeta, horario) => {
    const dataSelecionadaObj = new Date(dataSelecionada + 'T00:00:00');
    const diaSemana = dataSelecionadaObj.getDay();
    const diaSemanaMeta = (diaSemana === 6 || diaSemana === 0) ? 'sabado' : 'seg_sex';
    
    // Obter IDs dos vendedores filtrados
    const vendedoresFiltradosIds = [...new Set(configVendedores
      .filter(c => funilSelecionado === null || c.funil_id === funilSelecionado)
      .map(c => c.vendedor_id_sprint)
      .filter(id => id !== null && id !== undefined)
    )];
    
    // Primeiro tentar buscar meta geral explícita (vendedor_id_sprint = 0)
    const metaGeral = metasRondas.find(m => 
      m.vendedor_id_sprint === 0 &&
      m.nome_meta === nomeMeta &&
      m.horario === horario &&
      m.dia_semana === diaSemanaMeta &&
      m.ativo === true
    );
    
    if (metaGeral?.valor_meta) {
      return parseFloat(metaGeral.valor_meta);
    }
    
    // Se não existe meta geral, calcular soma das metas dos vendedores FILTRADOS
    const metasVendedores = metasRondas.filter(m => 
      m.vendedor_id_sprint !== 0 &&
      m.vendedor_id_sprint !== null &&
      vendedoresFiltradosIds.includes(m.vendedor_id_sprint) &&
      m.nome_meta === nomeMeta &&
      m.horario === horario &&
      m.dia_semana === diaSemanaMeta &&
      m.ativo === true
    );
    
    if (metasVendedores.length === 0) {
      return null;
    }
    
    // Para metas numéricas (Entrada, Orçamentos, Vendas, Valor): somar
    // Para Ticket_Medio e Conversão: calcular média
    if (nomeMeta === 'Ticket_Medio' || nomeMeta === 'Conversão') {
      const soma = metasVendedores.reduce((sum, m) => sum + (parseFloat(m.valor_meta) || 0), 0);
      const media = soma / metasVendedores.length;
      return media;
    } else {
      // Para outras metas: somar
      const soma = metasVendedores.reduce((sum, m) => sum + (parseFloat(m.valor_meta) || 0), 0);
      return soma;
    }
  };

  // Calcular rondas agregadas
  const rondasAgregadas = React.useMemo(() => {
    const hoje = new Date(dataSelecionada);
    const diaSemana = hoje.getDay();
    const isSabado = diaSemana === 6 || diaSemana === 0;
    const horariosRondas = isSabado ? ['10h', '12h'] : ['10h', '12h', '14h', '16h', '18h'];

    return horariosRondas.map(horario => {
      // Somar entradas por ronda
      let totalEntradas = 0;
      Object.values(entradasPorRonda).forEach(porVendedor => {
        if (porVendedor && porVendedor[horario]) {
          totalEntradas += porVendedor[horario] || 0;
        }
      });

      // Somar orçamentos por ronda
      let totalOrcamentos = 0;
      Object.values(orcamentosPorRonda).forEach(porVendedor => {
        if (porVendedor && porVendedor[horario]) {
          totalOrcamentos += porVendedor[horario] || 0;
        }
      });

      // Somar vendas e valor por ronda
      let totalVendas = 0;
      let totalValor = 0;
      Object.keys(vendasPorRonda).forEach(userId => {
        const porVendedor = vendasPorRonda[userId];
        if (porVendedor && typeof porVendedor === 'object') {
          const rondaData = porVendedor[horario];
          if (rondaData && typeof rondaData === 'object') {
            totalVendas += rondaData.contagem || 0;
            totalValor += rondaData.valorTotal || 0;
          }
        }
      });

      const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0;
      const conversao = totalEntradas > 0 ? (totalVendas / totalEntradas) * 100 : 0;

      // Buscar metas gerais de ronda ou calcular
      const metaEntrada = getMetaGeralRonda('Entrada', horario);
      const metaOrcamento = getMetaGeralRonda('Orçamentos', horario);
      const metaVendas = getMetaGeralRonda('Vendas', horario);
      const metaValor = getMetaGeralRonda('Valor', horario);
      const metaTicketMedio = getMetaGeralRonda('Ticket_Medio', horario);
      const metaConversao = getMetaGeralRonda('Conversão', horario);

      return {
        horario,
        entrada: { atual: totalEntradas, meta: metaEntrada },
        orcamento: { atual: totalOrcamentos, meta: metaOrcamento },
        vendas: { atual: totalVendas, meta: metaVendas },
        valor: { atual: totalValor, meta: metaValor },
        ticketMedio: { atual: ticketMedio, meta: metaTicketMedio },
        conversao: { atual: conversao, meta: metaConversao }
      };
    });
  }, [entradasPorRonda, orcamentosPorRonda, vendasPorRonda, metasRondas, dataSelecionada, funilSelecionado, configVendedores]);

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
            <h1 className="cockpit-vendedores-titulo">Taxas Gerais</h1>
            <div className="cockpit-vendedores-descricao">
              Soma de todos os vendedores e funis
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

        {/* Filtros de Funis (agrupa vendedores daquele funil) */}
        <CockpitFiltros
          funis={todosFunis.filter(f => 
            configVendedores.some(c => c.funil_id === (f.id_funil_sprint || f.id))
          )}
          vendedores={[]}
          funilSelecionado={funilSelecionado}
          vendedorSelecionado={null}
          onFunilChange={setFunilSelecionado}
          onVendedorChange={() => {}}
          labelFunil="Funil"
          labelVendedor=""
          mostrarTodos={true}
          ocultarVendedor={true}
        />

        <div className="cockpit-vendedores-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="cockpit-vendedores-card">
            <div className="cockpit-vendedores-card-header">
              <h3 className="cockpit-vendedores-card-nome">Resumo Geral</h3>
            </div>

            <div className="cockpit-vendedores-metricas-gerais">
              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Entrada</div>
                <div className="cockpit-vendedores-metrica-valor">
                  <div className="cockpit-vendedores-metrica-row-meta">
                    <span className="cockpit-vendedores-metrica-meta-label">Meta:</span>
                    <span className="cockpit-vendedores-metrica-meta">{metasGerais.entradas}</span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-real">
                    <span className="cockpit-vendedores-metrica-real-label">Real:</span>
                    <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(dadosAgregados.entradas, metasGerais.entradas)}`}>
                      {dadosAgregados.entradas}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-diff">
                    <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(dadosAgregados.entradas, metasGerais.entradas)}`}>
                      {formatarPorcentagemRealizado(dadosAgregados.entradas, metasGerais.entradas)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Orçamentos</div>
                <div className="cockpit-vendedores-metrica-valor">
                  <div className="cockpit-vendedores-metrica-row-meta">
                    <span className="cockpit-vendedores-metrica-meta-label">Meta:</span>
                    <span className="cockpit-vendedores-metrica-meta">{metasGerais.orcamentos}</span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-real">
                    <span className="cockpit-vendedores-metrica-real-label">Real:</span>
                    <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(dadosAgregados.orcamentos, metasGerais.orcamentos)}`}>
                      {dadosAgregados.orcamentos}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-diff">
                    <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(dadosAgregados.orcamentos, metasGerais.orcamentos)}`}>
                      {formatarPorcentagemRealizado(dadosAgregados.orcamentos, metasGerais.orcamentos)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Vendas</div>
                <div className="cockpit-vendedores-metrica-valor">
                  <div className="cockpit-vendedores-metrica-row-meta">
                    <span className="cockpit-vendedores-metrica-meta-label">Meta:</span>
                    <span className="cockpit-vendedores-metrica-meta">{metasGerais.vendas}</span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-real">
                    <span className="cockpit-vendedores-metrica-real-label">Real:</span>
                    <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(dadosAgregados.vendas, metasGerais.vendas)}`}>
                      {dadosAgregados.vendas}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-diff">
                    <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(dadosAgregados.vendas, metasGerais.vendas)}`}>
                      {formatarPorcentagemRealizado(dadosAgregados.vendas, metasGerais.vendas)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Valor</div>
                <div className="cockpit-vendedores-metrica-valor">
                  <div className="cockpit-vendedores-metrica-row-meta">
                    <span className="cockpit-vendedores-metrica-meta-label">Meta:</span>
                    <span className="cockpit-vendedores-metrica-meta">{formatarMoeda(metasGerais.valor)}</span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-real">
                    <span className="cockpit-vendedores-metrica-real-label">Real:</span>
                    <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(dadosAgregados.valor, metasGerais.valor)}`}>
                      {formatarMoeda(dadosAgregados.valor)}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-diff">
                    <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(dadosAgregados.valor, metasGerais.valor)}`}>
                      {formatarPorcentagemRealizado(dadosAgregados.valor, metasGerais.valor)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Ticket Médio</div>
                <div className="cockpit-vendedores-metrica-valor">
                  <div className="cockpit-vendedores-metrica-row-meta">
                    <span className="cockpit-vendedores-metrica-meta-label">Meta:</span>
                    <span className="cockpit-vendedores-metrica-meta">{formatarMoeda(metasGerais.ticketMedio)}</span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-real">
                    <span className="cockpit-vendedores-metrica-real-label">Real:</span>
                    <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(dadosAgregados.ticketMedio, metasGerais.ticketMedio)}`}>
                      {formatarMoeda(dadosAgregados.ticketMedio)}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-diff">
                    <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(dadosAgregados.ticketMedio, metasGerais.ticketMedio)}`}>
                      {formatarPorcentagemRealizado(dadosAgregados.ticketMedio, metasGerais.ticketMedio)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Conversão</div>
                <div className="cockpit-vendedores-metrica-valor">
                  <div className="cockpit-vendedores-metrica-row-meta">
                    <span className="cockpit-vendedores-metrica-meta-label">Meta:</span>
                    <span className="cockpit-vendedores-metrica-meta">
                      {formatarConversao(metasGerais.conversao)}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-real">
                    <span className="cockpit-vendedores-metrica-real-label">Real:</span>
                    <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(dadosAgregados.conversao, metasGerais.conversao)}`}>
                      {formatarConversao(dadosAgregados.conversao)}
                    </span>
                  </div>
                  <div className="cockpit-vendedores-metrica-row-diff">
                    <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(dadosAgregados.conversao, metasGerais.conversao)}`}>
                      {formatarPorcentagemRealizado(dadosAgregados.conversao, metasGerais.conversao)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cockpit-vendedores-taxas">
              <div className="cockpit-vendedores-taxa">
                <div className="cockpit-vendedores-taxa-label">Qualificação</div>
                <div className="cockpit-vendedores-taxa-valor">
                  {formatarConversao(dadosAgregados.qualificacao)}
                  <span>({dadosAgregados.orcamentos}/{dadosAgregados.entradas})</span>
                </div>
                <div className="cockpit-vendedores-taxa-detail">Entrada/Acolhimento → Orçamento</div>
              </div>

              <div className="cockpit-vendedores-taxa">
                <div className="cockpit-vendedores-taxa-label">Conversão</div>
                <div className="cockpit-vendedores-taxa-valor">
                  {formatarConversao(dadosAgregados.conversao)}
                  <span>({dadosAgregados.vendas}/{dadosAgregados.entradas})</span>
                </div>
                <div className="cockpit-vendedores-taxa-detail">Entrada/Acolhimento → Venda</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Rondas */}
        <div className="cockpit-vendedores-secao">
          <h2 className="cockpit-vendedores-secao-titulo">Métricas por Ronda</h2>
          <div className="cockpit-vendedores-tabela-rondas">
            <table>
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Entrada</th>
                  <th>Orçamento</th>
                  <th>Vendas</th>
                  <th>Valor</th>
                  <th>Ticket Médio</th>
                  <th>Conversão</th>
                </tr>
              </thead>
              <tbody>
                {rondasAgregadas.map((ronda, rondaIndex) => (
                  <tr key={rondaIndex}>
                    <td>{ronda.horario}</td>
                    <td>
                      <div className="cockpit-vendedores-pair">
                        <div className="cockpit-vendedores-pair-main">
                          <span className="cockpit-vendedores-pair-meta">{ronda.entrada.meta ?? '—'}</span>
                          <span className={`cockpit-vendedores-pair-real ${getClasseMetrica(ronda.entrada.atual, ronda.entrada.meta)}`}>/ {ronda.entrada.atual}</span>
                        </div>
                        <div className={`cockpit-vendedores-pair-diff ${getClasseMetrica(ronda.entrada.atual, ronda.entrada.meta)}`}>
                          {formatarPorcentagemRealizado(ronda.entrada.atual, ronda.entrada.meta)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cockpit-vendedores-pair">
                        <div className="cockpit-vendedores-pair-main">
                          <span className="cockpit-vendedores-pair-meta">{ronda.orcamento.meta ?? '—'}</span>
                          <span className={`cockpit-vendedores-pair-real ${getClasseMetrica(ronda.orcamento.atual, ronda.orcamento.meta)}`}>/ {ronda.orcamento.atual}</span>
                        </div>
                        <div className={`cockpit-vendedores-pair-diff ${getClasseMetrica(ronda.orcamento.atual, ronda.orcamento.meta)}`}>
                          {formatarPorcentagemRealizado(ronda.orcamento.atual, ronda.orcamento.meta)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cockpit-vendedores-pair">
                        <div className="cockpit-vendedores-pair-main">
                          <span className="cockpit-vendedores-pair-meta">{ronda.vendas.meta ?? '—'}</span>
                          <span className={`cockpit-vendedores-pair-real ${getClasseMetrica(ronda.vendas.atual, ronda.vendas.meta)}`}>/ {ronda.vendas.atual}</span>
                        </div>
                        <div className={`cockpit-vendedores-pair-diff ${getClasseMetrica(ronda.vendas.atual, ronda.vendas.meta)}`}>
                          {formatarPorcentagemRealizado(ronda.vendas.atual, ronda.vendas.meta)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cockpit-vendedores-pair">
                        <div className="cockpit-vendedores-pair-main">
                          <span className="cockpit-vendedores-pair-meta">{ronda.valor?.meta !== null && ronda.valor?.meta !== undefined ? formatarMoeda(ronda.valor.meta) : '—'}</span>
                          <span className={`cockpit-vendedores-pair-real ${getClasseMetrica(ronda.valor?.atual || 0, ronda.valor?.meta)}`}>/ {formatarMoeda(ronda.valor?.atual || 0)}</span>
                        </div>
                        <div className={`cockpit-vendedores-pair-diff ${getClasseMetrica(ronda.valor?.atual || 0, ronda.valor?.meta)}`}>
                          {formatarPorcentagemRealizado(ronda.valor?.atual || 0, ronda.valor?.meta)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cockpit-vendedores-pair">
                        <div className="cockpit-vendedores-pair-main">
                          <span className="cockpit-vendedores-pair-meta">{ronda.ticketMedio?.meta !== null && ronda.ticketMedio?.meta !== undefined ? formatarMoeda(ronda.ticketMedio.meta) : '—'}</span>
                          <span className={`cockpit-vendedores-pair-real ${getClasseMetrica(ronda.ticketMedio?.atual || 0, ronda.ticketMedio?.meta)}`}>/ {formatarMoeda(ronda.ticketMedio?.atual || 0)}</span>
                        </div>
                        <div className={`cockpit-vendedores-pair-diff ${getClasseMetrica(ronda.ticketMedio?.atual || 0, ronda.ticketMedio?.meta)}`}>
                          {formatarPorcentagemRealizado(ronda.ticketMedio?.atual || 0, ronda.ticketMedio?.meta)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cockpit-vendedores-pair">
                        <div className="cockpit-vendedores-pair-main">
                          <span className="cockpit-vendedores-pair-meta">{ronda.conversao?.meta !== null && ronda.conversao?.meta !== undefined ? formatarConversao(ronda.conversao.meta) : '—'}</span>
                          <span className={`cockpit-vendedores-pair-real ${getClasseMetrica(ronda.conversao?.atual || 0, ronda.conversao?.meta)}`}>/ {formatarConversao(ronda.conversao?.atual || 0)}</span>
                        </div>
                        <div className={`cockpit-vendedores-pair-diff ${getClasseMetrica(ronda.conversao?.atual || 0, ronda.conversao?.meta)}`}>
                          {formatarPorcentagemRealizado(ronda.conversao?.atual || 0, ronda.conversao?.meta)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Controle Flutuante */}
      <div className="cockpit-vendedores-floating-controls" ref={floatingControlsRef}>
        <button
          className="cockpit-vendedores-floating-controls-toggle"
          onClick={() => setShowFloatingControls(!showFloatingControls)}
          aria-label="Abrir controles"
        >
          <SlidersHorizontal size={18} />
        </button>
        {showFloatingControls && (
          <div className="cockpit-vendedores-floating-controls-menu">
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={toggleTheme}
              aria-label={isLightTheme ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
            >
              {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={increaseFontSize}
              disabled={fontSize === 'xxxxxl'}
              aria-label="Aumentar tamanho da fonte"
            >
              <Plus size={18} />
            </button>
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={decreaseFontSize}
              disabled={fontSize === 'xs'}
              aria-label="Diminuir tamanho da fonte"
            >
              <Minus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CockpitTaxasGerais;

