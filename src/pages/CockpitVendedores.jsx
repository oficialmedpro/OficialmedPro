import React, { useState, useEffect, useRef } from 'react';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { getVendedoresPorIds, getFunisPorIds, getCockpitVendedoresConfig, getTiposSecao, getMetasVendedores, getMetaVendedorPorDia, getMetasRondas, getNomesMetas, getEntradasVendedoresHoje, getEntradasVendedoresPorRonda, getOrcamentosVendedoresHoje, getOrcamentosVendedoresPorRonda } from '../service/supabase';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, MoreVertical, Target } from 'lucide-react';

const CockpitVendedores = () => {
  const navigate = useNavigate();
  const [vendedoresNomes, setVendedoresNomes] = useState({});
  const [funisNomes, setFunisNomes] = useState({});
  const [configVendedores, setConfigVendedores] = useState([]);
  const [tiposSecao, setTiposSecao] = useState([]);
  const [metas, setMetas] = useState([]);
  const [metasRondas, setMetasRondas] = useState([]);
  const [nomesMetas, setNomesMetas] = useState([]);
  const [entradasHoje, setEntradasHoje] = useState({}); // { user_id: count }
  const [entradasPorRonda, setEntradasPorRonda] = useState({}); // { user_id: { '10h': count, '12h': count, ... } }
  const [orcamentosHoje, setOrcamentosHoje] = useState({}); // { user_id: count }
  const [orcamentosPorRonda, setOrcamentosPorRonda] = useState({}); // { user_id: { '10h': count, '12h': count, ... } }
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    // Data padrão = hoje na timezone Brasil em formato YYYY-MM-DD
    const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Buscar configuração e nomes dos vendedores do banco de dados
  useEffect(() => {
    const buscarDados = async () => {
      try {
        // Buscar configuração do cockpit, tipos de seção, metas, metas por ronda e nomes de metas
        const [configs, tipos, metasData, metasRondasData, nomesMetasData] = await Promise.all([
          getCockpitVendedoresConfig(),
          getTiposSecao(),
          getMetasVendedores(),
          getMetasRondas(),
          getNomesMetas()
        ]);
        
        // Filtrar apenas configurações ativas
        const configsAtivas = configs.filter(c => c.ativo);
        
        // Ordenar tipos de seção por ordem
        const tiposOrdenados = tipos
          .filter(t => t.ativo)
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        setTiposSecao(tiposOrdenados);
        setConfigVendedores(configsAtivas);
        setMetas(metasData || []);
        setMetasRondas(metasRondasData || []);
        setNomesMetas(nomesMetasData || []);

        // Coletar todos os IDs de vendedores únicos
        const todosIds = [...new Set(
          configsAtivas.map(c => c.vendedor_id_sprint)
        )].filter(id => id !== null && id !== undefined);

        if (todosIds.length === 0) {
          console.warn('⚠️ [CockpitVendedores] Nenhum vendedor configurado na tabela cockpit_vendedores_config');
          setLoading(false);
          return;
        }

        // Coletar todos os IDs de funis únicos
        const todosIdsFunils = [...new Set(
          configsAtivas.map(c => c.funil_id).filter(id => id !== null && id !== undefined)
        )];

        // Buscar nomes dos vendedores e funis
        const [vendedores, funis] = await Promise.all([
          getVendedoresPorIds(todosIds),
          getFunisPorIds(todosIdsFunils)
        ]);
        
        // Criar mapa de id_sprint -> nome
        const mapaNomesVendedores = {};
        if (vendedores && Array.isArray(vendedores)) {
          vendedores.forEach(v => {
            mapaNomesVendedores[v.id_sprint] = v.nome;
          });
        }

        // Criar mapa de nomes dos funis
        const mapaNomesFunis = {};
        if (funis && Array.isArray(funis)) {
          funis.forEach(f => {
            mapaNomesFunis[f.id_funil_sprint] = f.nome_funil;
          });
        }

        setVendedoresNomes(mapaNomesVendedores);
        setFunisNomes(mapaNomesFunis);
        
        // Criar mapeamento de user_id -> funil_id para filtrar corretamente
        const funilIdsMap = {};
        configsAtivas.forEach(c => {
          if (c.vendedor_id_sprint && c.funil_id) {
            funilIdsMap[c.vendedor_id_sprint] = c.funil_id;
          }
        });
        
        // Buscar entradas e orçamentos de hoje e por ronda inicialmente (filtrando por funil_id)
        const [entradasHojeInicial, entradasPorRondaInicial, orcamentosHojeInicial, orcamentosPorRondaInicial] = await Promise.all([
          getEntradasVendedoresHoje(todosIds, null, funilIdsMap),
          getEntradasVendedoresPorRonda(todosIds, null, funilIdsMap),
          getOrcamentosVendedoresHoje(todosIds, null, funilIdsMap),
          getOrcamentosVendedoresPorRonda(todosIds, null, funilIdsMap)
        ]);
        setEntradasHoje(entradasHojeInicial);
        setEntradasPorRonda(entradasPorRondaInicial);
        setOrcamentosHoje(orcamentosHojeInicial);
        setOrcamentosPorRonda(orcamentosPorRondaInicial);
        
        console.log('✅ [CockpitVendedores] Dados carregados:', {
          configs: configsAtivas.length,
          tipos: tiposOrdenados.length,
          vendedores: vendedores.length,
          nomesVendedores: Object.keys(mapaNomesVendedores).length,
          funis: funis.length,
          nomesFunis: Object.keys(mapaNomesFunis).length,
          entradasHoje: Object.keys(entradasHojeInicial).length,
          entradasPorRonda: Object.keys(entradasPorRondaInicial).length
        });
      } catch (error) {
        console.error('❌ [CockpitVendedores] Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, []);

  // Buscar entradas (Entrada) para a data selecionada
  useEffect(() => {
    const carregarEntradas = async () => {
      try {
        if (!configVendedores || configVendedores.length === 0) return;

        // Coletar todos os IDs de vendedores únicos a partir da config
        const todosIds = [...new Set(
          configVendedores.map(c => c.vendedor_id_sprint)
        )].filter(id => id !== null && id !== undefined);

        if (todosIds.length === 0) return;

        // Criar mapeamento de user_id -> funil_id para filtrar corretamente
        const funilIdsMap = {};
        configVendedores.forEach(c => {
          if (c.vendedor_id_sprint && c.funil_id) {
            funilIdsMap[c.vendedor_id_sprint] = c.funil_id;
          }
        });

        // Buscar entradas e orçamentos do dia e por ronda (filtrando por funil_id)
        const [entradasDia, entradasRonda, orcamentosDia, orcamentosRonda] = await Promise.all([
          getEntradasVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getEntradasVendedoresPorRonda(todosIds, dataSelecionada, funilIdsMap),
          getOrcamentosVendedoresHoje(todosIds, dataSelecionada, funilIdsMap),
          getOrcamentosVendedoresPorRonda(todosIds, dataSelecionada, funilIdsMap)
        ]);
        
        setEntradasHoje(entradasDia);
        setEntradasPorRonda(entradasRonda);
        setOrcamentosHoje(orcamentosDia);
        setOrcamentosPorRonda(orcamentosRonda);

        console.log('📊 [CockpitVendedores] Entradas e orçamentos carregados para data', dataSelecionada, {
          entradasDia,
          entradasRonda,
          orcamentosDia,
          orcamentosRonda
        });
      } catch (error) {
        console.error('❌ [CockpitVendedores] Erro ao carregar entradas:', error);
      }
    };

    carregarEntradas();
  }, [configVendedores, dataSelecionada]);

  // Função para obter o label de um tipo de seção
  const getTipoSecaoLabel = (tipoNome) => {
    const tipo = tiposSecao.find(t => t.nome === tipoNome);
    return tipo?.label || tipoNome;
  };

  // Função para obter meta de ronda baseado no dia da semana e horário
  const getMetaRondaPorDia = (vendedorId, nomeMeta, horario) => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = domingo, 6 = sábado
    
    let diaSemanaMeta = 'seg_sex';
    
    if (diaSemana === 6) { // Sábado
      diaSemanaMeta = 'sabado';
    } else if (diaSemana === 0) { // Domingo - usa meta do sábado
      diaSemanaMeta = 'sabado';
    } else { // Segunda a Sexta
      diaSemanaMeta = 'seg_sex';
    }
    
    const meta = metasRondas.find(m => 
      m.vendedor_id_sprint === vendedorId &&
      m.nome_meta === nomeMeta &&
      m.horario === horario &&
      m.dia_semana === diaSemanaMeta &&
      m.ativo === true
    );
    
    return meta?.valor_meta || null;
  };

  // Agrupar configurações por tipo de seção dinamicamente
  const configVendedoresPorTipo = React.useMemo(() => {
    if (!configVendedores || configVendedores.length === 0 || !tiposSecao || tiposSecao.length === 0) {
      return {};
    }

    const agrupado = {};
    tiposSecao.forEach(tipo => {
      agrupado[tipo.nome] = configVendedores
        .filter(c => c.tipo_secao === tipo.nome)
        .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao)
        .map(c => ({ idVendedor: c.vendedor_id_sprint, idFunil: c.funil_id }));
    });

    return agrupado;
  }, [configVendedores, tiposSecao]);

  // Criar dados por tipo de seção dinamicamente
  const dadosPorTipo = React.useMemo(() => {
    if (!tiposSecao || tiposSecao.length === 0 || !configVendedoresPorTipo) {
      return {};
    }

    // Determinar dia da semana atual e horários disponíveis
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = domingo, 6 = sábado
    const isSabado = diaSemana === 6 || diaSemana === 0; // Sábado ou Domingo (usa meta de sábado)
    const horariosRondas = isSabado ? ['10h', '12h'] : ['10h', '12h', '14h', '16h', '18h'];

    const dados = {};
    tiposSecao.forEach(tipo => {
      const configs = configVendedoresPorTipo[tipo.nome] || [];
      dados[tipo.nome] = configs.map((config, index) => {
        // Buscar metas para este vendedor baseado no dia da semana atual
        const metasArray = Array.isArray(metas) ? metas : [];
        const metaEntrada = getMetaVendedorPorDia(metasArray, config.idVendedor, 'Entrada');
        const metaOrcamentos = getMetaVendedorPorDia(metasArray, config.idVendedor, 'Orçamentos');
        const metaVendas = getMetaVendedorPorDia(metasArray, config.idVendedor, 'Vendas');
        const metaValor = getMetaVendedorPorDia(metasArray, config.idVendedor, 'Valor');
        const metaTicketMedio = getMetaVendedorPorDia(metasArray, config.idVendedor, 'Ticket_Medio');
        const metaConversao = getMetaVendedorPorDia(metasArray, config.idVendedor, 'Conversão');

        // Buscar metas por ronda para cada horário disponível
        const rondasComMetas = horariosRondas.map(horario => {
          const metaEntradaRonda = getMetaRondaPorDia(config.idVendedor, 'Entrada', horario);
          const metaOrcamentoRonda = getMetaRondaPorDia(config.idVendedor, 'Orçamentos', horario);
          const metaVendasRonda = getMetaRondaPorDia(config.idVendedor, 'Vendas', horario);
          const metaValorRonda = getMetaRondaPorDia(config.idVendedor, 'Valor', horario);
          const metaTicketMedioRonda = getMetaRondaPorDia(config.idVendedor, 'Ticket_Medio', horario);
          const metaConversaoRonda = getMetaRondaPorDia(config.idVendedor, 'Conversão', horario);

          // Buscar entradas reais por ronda para este vendedor
          const entradaAtualRonda = entradasPorRonda[config.idVendedor]?.[horario] || 0;
          const entradaVariacaoRonda = metaEntradaRonda && metaEntradaRonda > 0 
            ? Math.round(((entradaAtualRonda - metaEntradaRonda) / metaEntradaRonda) * 100) 
            : 0;
          
          // Buscar orçamentos reais por ronda para este vendedor
          const orcamentoAtualRonda = orcamentosPorRonda[config.idVendedor]?.[horario] || 0;
          const orcamentoVariacaoRonda = metaOrcamentoRonda && metaOrcamentoRonda > 0
            ? Math.round(((orcamentoAtualRonda - metaOrcamentoRonda) / metaOrcamentoRonda) * 100)
            : 0;

          return {
            horario: horario,
            entrada: { atual: entradaAtualRonda, meta: metaEntradaRonda, variacao: entradaVariacaoRonda },
            orcamento: { atual: orcamentoAtualRonda, meta: metaOrcamentoRonda, variacao: orcamentoVariacaoRonda },
            vendas: { atual: 0, meta: metaVendasRonda, variacao: 0 },
            valor: { atual: 0, meta: metaValorRonda, variacao: 0 },
            ticketMedio: { atual: 0, meta: metaTicketMedioRonda, variacao: 0 },
            conversao: { atual: 0, meta: metaConversaoRonda, variacao: 0 }
          };
        });

        // Buscar contagem de entradas de hoje para este vendedor
        const entradaAtual = entradasHoje[config.idVendedor] || 0;
        // Calcular variação percentual: ((atual - meta) / meta) * 100
        const entradaVariacao = metaEntrada && metaEntrada > 0 
          ? Math.round(((entradaAtual - metaEntrada) / metaEntrada) * 100) 
          : 0;
        
        // Buscar contagem de orçamentos de hoje para este vendedor
        const orcamentoAtual = orcamentosHoje[config.idVendedor] || 0;
        const orcamentoVariacao = metaOrcamentos && metaOrcamentos > 0
          ? Math.round(((orcamentoAtual - metaOrcamentos) / metaOrcamentos) * 100)
          : 0;
        
        return {
          idVendedor: config.idVendedor,
          idFunil: config.idFunil,
          nome: vendedoresNomes[config.idVendedor] || `Vendedor ${index + 1}`,
          entrada: { atual: entradaAtual, meta: metaEntrada, variacao: entradaVariacao },
          orcamentos: { atual: orcamentoAtual, meta: metaOrcamentos, variacao: orcamentoVariacao },
          vendas: { atual: 0, meta: metaVendas, variacao: 0 },
          valor: { atual: 0, meta: metaValor, variacao: 0 },
          ticketMedio: { atual: 0, meta: metaTicketMedio, variacao: 0 },
          conversao: { atual: 0, meta: metaConversao, variacao: 0 },
          qualificacao: { taxa: 0, atual: 0, total: 0, taxaAlvo: false },
          conversaoOrcVenda: { taxa: 0, atual: 0, total: 0, taxaAlvo: false },
          rondas: rondasComMetas,
          botao: funisNomes[config.idFunil] || tipo.label.split(' ')[0] || tipo.label // Nome do funil ou primeira palavra do label
        };
      });
    });

    return dados;
  }, [vendedoresNomes, funisNomes, configVendedoresPorTipo, tiposSecao, metas, metasRondas, entradasHoje, entradasPorRonda, orcamentosHoje, orcamentosPorRonda]);

  /**
   * Formata a porcentagem realizada e o que falta (se aplicável)
   * @param {number} atual - valor atual
   * @param {number|null|undefined} meta - valor da meta
   * @returns {string} formato: "12.5%" ou "12.5% (falta 87.5%)" ou "120%"
   */
  const formatarPorcentagemRealizado = (atual, meta) => {
    if (!meta || meta === 0 || meta === null || meta === undefined) return '—';
    
    const porcentagem = (atual / meta) * 100;
    const porcentagemFormatada = porcentagem % 1 === 0 
      ? porcentagem.toString() 
      : porcentagem.toFixed(1).replace('.', ',');
    
    if (porcentagem >= 100) {
      return `${porcentagemFormatada}%`;
    } else {
      const falta = 100 - porcentagem;
      const faltaFormatada = falta % 1 === 0 
        ? falta.toString() 
        : falta.toFixed(1).replace('.', ',');
      return `${porcentagemFormatada}% (falta ${faltaFormatada}%)`;
    }
  };

  const formatarVariacao = (variacao) => {
    if (variacao === 0) return '↓ 0%';
    if (variacao > 0) return `↑ ${variacao}%`;
    return `↓ ${Math.abs(variacao)}%`;
  };

  const formatarVariacaoPP = (variacao) => {
    if (variacao === 0) return '↓ 0 p.p.';
    if (variacao > 0) return `↑ ${variacao} p.p.`;
    return `↓ ${Math.abs(variacao)} p.p.`;
  };

  const formatarConversao = (valor) => {
    if (valor % 1 === 0) {
      return `${valor}%`;
    }
    return `${valor.toFixed(1).replace('.', ',')}%`;
  };

  const formatarTaxa = (taxa) => {
    if (taxa % 1 === 0) {
      return `${taxa}%`;
    }
    return `${taxa.toFixed(1).replace('.', ',')}%`;
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === '') return '—';
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return '—';
    return `R$ ${numValor.toFixed(2).replace('.', ',')}`;
  };

  /**
   * Calcula a porcentagem do realizado em relação à meta
   * @param {number} atual - valor atual/realizado
   * @param {number|null|undefined} meta - valor da meta
   * @returns {number} porcentagem (0-100+), ou 0 se meta não existir
   */
  const getPorcentagemMeta = (atual, meta) => {
    if (!meta || meta === 0 || meta === null || meta === undefined) return 0;
    const porcentagem = (atual / meta) * 100;
    return Math.round(porcentagem * 100) / 100; // Arredondar para 2 casas decimais
  };

  /**
   * Retorna a classe CSS baseada na porcentagem da meta
   * @param {number} porcentagem - porcentagem do realizado (0-100+)
   * @returns {string} classe CSS: 'bad', 'warning', 'warning-light', ou 'good'
   */
  const getClassePorPorcentagem = (porcentagem) => {
    if (porcentagem >= 100) {
      return 'good'; // Verde bem vivo - 100% ou acima
    } else if (porcentagem >= 81) {
      return 'warning-light'; // Amarelo quase verde - 81% a 99%
    } else if (porcentagem >= 51) {
      return 'warning'; // Laranja/amarelo - 51% a 80%
    } else {
      return 'bad'; // Vermelho - 0% a 50%
    }
  };

  /**
   * Retorna a classe CSS para uma métrica baseada em atual e meta
   * @param {number} atual - valor atual
   * @param {number|null|undefined} meta - valor da meta
   * @returns {string} classe CSS
   */
  const getClasseMetrica = (atual, meta) => {
    const porcentagem = getPorcentagemMeta(atual, meta);
    return getClassePorPorcentagem(porcentagem);
  };

  const renderCardVendedor = (vendedor, index) => {
    // Calcular classe baseada na porcentagem da entrada (para manter compatibilidade com código antigo)
    const classeEntrada = getClasseMetrica(vendedor.entrada.atual, vendedor.entrada.meta);
    const isBad = classeEntrada === 'bad'; // Mantido para compatibilidade, mas vamos usar classes específicas

    return (
      <div key={index} className="cockpit-vendedores-card">
        <div className="cockpit-vendedores-card-header">
          <h3 className="cockpit-vendedores-card-nome">{vendedor.nome}</h3>
          <span className="cockpit-vendedores-btn">{vendedor.botao}</span>
        </div>

        {/* SUMMARY TOP - 6 widgets */}
        <div className="cockpit-vendedores-metricas-gerais">
          <div className="cockpit-vendedores-metrica">
            <div className="cockpit-vendedores-metrica-label">Entrada</div>
            <div className="cockpit-vendedores-metrica-valor">
              <div className="cockpit-vendedores-metrica-row-main">
                <span className="cockpit-vendedores-metrica-meta">{vendedor.entrada.meta ?? '—'}</span>
                <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(vendedor.entrada.atual, vendedor.entrada.meta)}`}>/ {vendedor.entrada.atual}</span>
              </div>
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(vendedor.entrada.atual, vendedor.entrada.meta)}`}>
                  {formatarPorcentagemRealizado(vendedor.entrada.atual, vendedor.entrada.meta)}
                </span>
              </div>
            </div>
          </div>

          <div className="cockpit-vendedores-metrica">
            <div className="cockpit-vendedores-metrica-label">Orçamentos</div>
            <div className="cockpit-vendedores-metrica-valor">
              <div className="cockpit-vendedores-metrica-row-main">
                <span className="cockpit-vendedores-metrica-meta">{vendedor.orcamentos.meta ?? '—'}</span>
                <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(vendedor.orcamentos.atual, vendedor.orcamentos.meta)}`}>/ {vendedor.orcamentos.atual}</span>
              </div>
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(vendedor.orcamentos.atual, vendedor.orcamentos.meta)}`}>
                  {formatarPorcentagemRealizado(vendedor.orcamentos.atual, vendedor.orcamentos.meta)}
                </span>
              </div>
            </div>
          </div>

          <div className="cockpit-vendedores-metrica">
            <div className="cockpit-vendedores-metrica-label">Vendas</div>
            <div className="cockpit-vendedores-metrica-valor">
              <div className="cockpit-vendedores-metrica-row-main">
                <span className="cockpit-vendedores-metrica-meta">{vendedor.vendas.meta ?? '—'}</span>
                <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(vendedor.vendas.atual, vendedor.vendas.meta)}`}>/ {vendedor.vendas.atual}</span>
              </div>
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(vendedor.vendas.atual, vendedor.vendas.meta)}`}>
                  {formatarPorcentagemRealizado(vendedor.vendas.atual, vendedor.vendas.meta)}
                </span>
              </div>
            </div>
          </div>

          <div className="cockpit-vendedores-metrica">
            <div className="cockpit-vendedores-metrica-label">Valor</div>
            <div className="cockpit-vendedores-metrica-valor">
              <div className="cockpit-vendedores-metrica-row-main">
                <span className="cockpit-vendedores-metrica-meta">{vendedor.valor.meta ?? '—'}</span>
                <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(vendedor.valor.atual, vendedor.valor.meta)}`}>/ {vendedor.valor.atual}</span>
              </div>
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(vendedor.valor.atual, vendedor.valor.meta)}`}>
                  {formatarPorcentagemRealizado(vendedor.valor.atual, vendedor.valor.meta)}
                </span>
              </div>
            </div>
          </div>

          <div className="cockpit-vendedores-metrica">
            <div className="cockpit-vendedores-metrica-label">Ticket Médio</div>
            <div className="cockpit-vendedores-metrica-valor">
              <div className="cockpit-vendedores-metrica-row-main">
                <span className="cockpit-vendedores-metrica-meta">{vendedor.ticketMedio.meta ?? '—'}</span>
                <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(vendedor.ticketMedio.atual, vendedor.ticketMedio.meta)}`}>/ {vendedor.ticketMedio.atual}</span>
              </div>
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(vendedor.ticketMedio.atual, vendedor.ticketMedio.meta)}`}>
                  {formatarPorcentagemRealizado(vendedor.ticketMedio.atual, vendedor.ticketMedio.meta)}
                </span>
              </div>
            </div>
          </div>

          <div className="cockpit-vendedores-metrica">
            <div className="cockpit-vendedores-metrica-label">Conversão</div>
            <div className="cockpit-vendedores-metrica-valor">
              <div className="cockpit-vendedores-metrica-row-main">
                <span className="cockpit-vendedores-metrica-meta">
                  {vendedor.conversao.meta !== null && vendedor.conversao.meta !== undefined 
                    ? formatarConversao(vendedor.conversao.meta) 
                    : '—'}
                </span>
                <span className={`cockpit-vendedores-metrica-real ${getClasseMetrica(vendedor.conversao.atual, vendedor.conversao.meta)}`}>/ {formatarConversao(vendedor.conversao.atual)}</span>
              </div>
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className={`cockpit-vendedores-metrica-variacao ${getClasseMetrica(vendedor.conversao.atual, vendedor.conversao.meta)}`}>
                  {formatarPorcentagemRealizado(vendedor.conversao.atual, vendedor.conversao.meta)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI ROW - 2 boxes */}
        <div className="cockpit-vendedores-taxas">
          <div className="cockpit-vendedores-taxa">
            <div className="cockpit-vendedores-taxa-label">
              {vendedor.qualificacao.taxaAlvo ? 'Qualificação (Entrada → Orç.)' : 'Qualificação'}
            </div>
            <div className="cockpit-vendedores-taxa-valor">
              {formatarTaxa(vendedor.qualificacao.taxa)}
              <span>({vendedor.qualificacao.atual} / {vendedor.qualificacao.total})</span>
            </div>
            <div className="cockpit-vendedores-taxa-detail">
              {vendedor.qualificacao.taxaAlvo ? 'taxa alvo' : 'Entrada → Orçamento'}
            </div>
          </div>

          <div className="cockpit-vendedores-taxa">
            <div className="cockpit-vendedores-taxa-label">
              {vendedor.conversaoOrcVenda.taxaAlvo ? 'Conversão (Orç. → Venda)' : 'Conversão'}
            </div>
            <div className="cockpit-vendedores-taxa-valor">
              {formatarTaxa(vendedor.conversaoOrcVenda.taxa)}
              <span>({vendedor.conversaoOrcVenda.atual} / {vendedor.conversaoOrcVenda.total})</span>
            </div>
            <div className="cockpit-vendedores-taxa-detail">
              {vendedor.conversaoOrcVenda.taxaAlvo ? 'taxa alvo' : 'Orçamento → Venda'}
            </div>
          </div>
        </div>

        {/* TABELA DE RONDAS */}
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
              {vendedor.rondas.map((ronda, rondaIndex) => (
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
    );
  };

  return (
    <div className="cockpit-vendedores-page">
      <div className="cockpit-vendedores-container">
        <div className="cockpit-vendedores-header">
          <div className="cockpit-vendedores-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-vendedores-logo" />
          </div>
          <div className="cockpit-vendedores-header-center">
            <h1 className="cockpit-vendedores-titulo">Cockpit – Vendedores</h1>
            <div className="cockpit-vendedores-descricao">
              Meta / Realizado no formato 40 / 32 com % acima/abaixo. Topo: Entrada, Orçamentos, Vendas, Conversão. Meio: Qualificação e Conversão. Base: rondas (10h, 12h, 16h, 18h).
            </div>
          </div>
          <div className="cockpit-vendedores-header-right">
            <div className="cockpit-vendedores-date-filter">
              <label htmlFor="data-filtro">Data:</label>
              <input
                id="data-filtro"
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>
            <div className="cockpit-vendedores-menu-container" ref={menuRef}>
              <button 
                className="cockpit-vendedores-menu-trigger"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Menu de navegação"
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="cockpit-vendedores-menu-dropdown">
                  <button 
                    className="cockpit-vendedores-menu-item active"
                    onClick={() => setShowMenu(false)}
                  >
                    <LayoutDashboard size={18} />
                    <span>Cockpit de Vendedores</span>
                  </button>
                  <button 
                    className="cockpit-vendedores-menu-item"
                    onClick={() => {
                      navigate('/cockpit-vendedores-config');
                      setShowMenu(false);
                    }}
                  >
                    <Settings size={18} />
                    <span>Área Administrativa</span>
                  </button>
                  <button 
                    className="cockpit-vendedores-menu-item"
                    onClick={() => {
                      navigate('/cockpit-metas-vendedores');
                      setShowMenu(false);
                    }}
                  >
                    <Target size={18} />
                    <span>Metas Diárias</span>
                  </button>
                  <button 
                    className="cockpit-vendedores-menu-item"
                    onClick={() => {
                      navigate('/cockpit-metas-rondas');
                      setShowMenu(false);
                    }}
                  >
                    <Target size={18} />
                    <span>Metas por Ronda</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {tiposSecao.map(tipo => {
          const vendedoresTipo = dadosPorTipo[tipo.nome] || [];
          if (vendedoresTipo.length === 0) return null;

          return (
            <div key={tipo.id} className="cockpit-vendedores-secao">
              <h2 className="cockpit-vendedores-secao-titulo">{tipo.label}</h2>
              <div className="cockpit-vendedores-grid">
                {vendedoresTipo.map((vendedor, index) => renderCardVendedor(vendedor, index))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CockpitVendedores;