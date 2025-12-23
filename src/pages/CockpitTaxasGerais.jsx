import React, { useState, useEffect, useRef } from 'react';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { getCockpitVendedoresConfig, getMetasVendedores, getEntradasVendedoresHoje, getOrcamentosVendedoresHoje, getVendasVendedoresHoje } from '../service/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, Sun, Moon, Plus, Minus } from 'lucide-react';

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
        const [configs, metasData] = await Promise.all([
          getCockpitVendedoresConfig(),
          getMetasVendedores()
        ]);

        const configsAtivas = configs.filter(c => c.ativo);
        const todosIds = [...new Set(configsAtivas.map(c => c.vendedor_id_sprint))].filter(id => id !== null && id !== undefined);
        
        const funilIdsMap = {};
        configsAtivas.forEach(c => {
          if (c.vendedor_id_sprint && c.funil_id) {
            funilIdsMap[c.vendedor_id_sprint] = c.funil_id;
          }
        });

        // Buscar dados agregados
        const [entradasData, orcamentosData, vendasData] = await Promise.all([
          getEntradasVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getOrcamentosVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getVendasVendedoresHoje(todosIds, dataSelecionada, funilIdsMap)
        ]);

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
          // Caso contrário, calcular somando todas as metas individuais
          const metasPorVendedor = {};
          metasData.forEach(meta => {
            const vendedorId = meta.vendedor_id_sprint;
            if (vendedorId !== 0) { // Ignorar metas gerais (0)
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
  }, [dataSelecionada]);

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
    if (!meta || meta === 0) return '';
    const porcentagem = (atual / meta) * 100;
    if (porcentagem >= 100) return 'cockpit-vendedores-good';
    if (porcentagem >= 81) return 'cockpit-vendedores-warning-light';
    if (porcentagem >= 51) return 'cockpit-vendedores-warning';
    return 'cockpit-vendedores-bad';
  };

  const formatarPorcentagemRealizado = (atual, meta) => {
    if (!meta || meta === 0) return '—';
    const porcentagem = (atual / meta) * 100;
    const falta = 100 - porcentagem;
    return `${porcentagem.toFixed(1).replace('.', ',')}% (falta ${falta.toFixed(1).replace('.', ',')}%)`;
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
                <div className="cockpit-vendedores-taxa-detail">Entrada → Orçamento</div>
              </div>

              <div className="cockpit-vendedores-taxa">
                <div className="cockpit-vendedores-taxa-label">Conversão</div>
                <div className="cockpit-vendedores-taxa-valor">
                  {formatarConversao(dadosAgregados.conversaoOrcVenda)}
                  <span>({dadosAgregados.vendas}/{dadosAgregados.orcamentos})</span>
                </div>
                <div className="cockpit-vendedores-taxa-detail">Orçamento → Venda</div>
              </div>
            </div>
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

