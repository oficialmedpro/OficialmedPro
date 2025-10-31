import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, Building2 } from 'lucide-react';
import { MetaAdsCampaign } from '../../services/metaAdsService';
import { GoogleAdsCampaign } from '../../services/googleAdsService';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import CalendarDateFilter from '../filters/CalendarDateFilter';
import './CampaignFilters.css';

type Campaign = MetaAdsCampaign | GoogleAdsCampaign;

interface CampaignFiltersProps {
  campaigns: Campaign[];
  onFilterChange: (filtered: Campaign[]) => void;
  showInsights: boolean;
  dateRange: { since: string; until: string };
  onDateRangeChange: (dateRange: { since: string; until: string }) => void;
  loading: boolean;
  selectedAccount: 'ACCOUNT_1' | 'ACCOUNT_2' | 'ALL';
  onAccountChange: (account: 'ACCOUNT_1' | 'ACCOUNT_2' | 'ALL') => void;
  configuredAccounts: Array<{ key: string; name: string }>;
}

interface Supervisor {
  id: string;
  nome: string;
}

interface Loja {
  id: string;
  nome: string;
}

const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  campaigns,
  onFilterChange,
  showInsights,
  dateRange,
  onDateRangeChange,
  loading,
  selectedAccount,
  onAccountChange,
  configuredAccounts
}) => {
  const { userWithLevel } = useAuth();
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [lojaFilter, setLojaFilter] = useState('');
  
  // Inicializar filtro de supervisor automaticamente se o usuário for supervisor
  useEffect(() => {
    if (userWithLevel?.nivel === 'supervisor' && !supervisorFilter) {
      console.log('🔍 CampaignFilters - Inicializando filtro para supervisor:', userWithLevel.id);
      setSupervisorFilter(userWithLevel.id);
    }
  }, [userWithLevel, supervisorFilter]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojasVisiveis, setLojasVisiveis] = useState<Loja[]>([]);
  const [supervisoresVisiveis, setSupervisoresVisiveis] = useState<Supervisor[]>([]);
  const [lojasComCampanhas, setLojasComCampanhas] = useState<Loja[]>([]);
  const [lojasDoSupervisorSelecionado, setLojasDoSupervisorSelecionado] = useState<Loja[]>([]);

  // Função para extrair nome da loja do título da campanha
  const extractLojaNome = (campaignName: string): string | null => {
    // Padrões suportados:
    // 1. "[nome da loja] - data da campanha"
    // 2. "[nome da loja] data da campanha"
    // 3. "MSG NOME_DA_LOJA dd/mm" (novo padrão)
    
    // Primeiro, remove todos os colchetes
    const cleanName = campaignName.replace(/[\[\]]/g, '');
    
    // Padrão 1: Com hífen
    let match = cleanName.match(/^([^-]+)\s*-\s*/);
    if (match && match[1]) {
      const nomeExtraido = match[1].trim();
      return nomeExtraido.toLowerCase();
    }
    
    // Padrão 2: Formato "MSG NOME_DA_LOJA dd/mm"
    match = cleanName.match(/^MSG\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)\s+\d{1,2}\/\d{1,2}$/i);
    if (match && match[1]) {
      const nomeExtraido = match[1].trim();
      return nomeExtraido.toLowerCase();
    }
    
    // Padrão 3: Tudo antes da primeira data (formato dd/mm/yy ou dd/mm/yyyy)
    match = cleanName.match(/^([^0-9]+?)\s+\d{1,2}\/\d{1,2}(\/\d{2,4})?/);
    if (match && match[1]) {
      const nomeExtraido = match[1].trim();
      return nomeExtraido.toLowerCase();
    }
    
    return null;
  };

  // Função para encontrar loja similar
  const encontrarLojaSimilar = (nomeExtraido: string, lojasDisponiveis: Loja[]): Loja | null => {
    const nomeNormalizado = nomeExtraido.toLowerCase();
    
    // Primeiro, tenta match exato
    const matchExato = lojasDisponiveis.find(loja => 
      loja.nome.toLowerCase() === nomeNormalizado
    );
    if (matchExato) {
      return matchExato;
    }
    
    // Segundo, tenta match por cidade + número (para casos como "MARINGA 3" -> "Maringá - Loja 3")
    const palavrasExtraido = nomeNormalizado.split(' ');
    if (palavrasExtraido.length >= 2) {
      const cidadeExtraido = palavrasExtraido[0];
      const numeroExtraido = palavrasExtraido[1];
      
      const matchCidadeNumero = lojasDisponiveis.find(loja => {
        const nomeLoja = loja.nome.toLowerCase();
        const palavrasLoja = nomeLoja.split(' ');
        
        // Verifica se tem o padrão "cidade - loja numero"
        if (palavrasLoja.length >= 4) {
          const cidadeLoja = palavrasLoja[0];
          const tipoLoja = palavrasLoja[2];
          const numeroLoja = palavrasLoja[3];
          
          // Remove acentos para comparação
          const cidadeLojaSemAcento = cidadeLoja.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const cidadeExtraidoSemAcento = cidadeExtraido.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          if (cidadeLojaSemAcento === cidadeExtraidoSemAcento && 
              tipoLoja === 'loja' && 
              numeroLoja === numeroExtraido) {
            return true;
          }
        }
        return false;
      });
      
      if (matchCidadeNumero) {
        return matchCidadeNumero;
      }
    }
    
    // Terceiro, tenta match por cidade apenas (APENAS se não há número específico na busca)
    if (palavrasExtraido.length === 1) {
      const cidadeExtraido = palavrasExtraido[0];
      const cidadeExtraidoSemAcento = cidadeExtraido.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      const matchCidade = lojasDisponiveis.find(loja => {
        const nomeLoja = loja.nome.toLowerCase();
        const palavrasLoja = nomeLoja.split(' ');
        
        if (palavrasLoja.length >= 1) {
          const cidadeLoja = palavrasLoja[0];
          const cidadeLojaSemAcento = cidadeLoja.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          if (cidadeLojaSemAcento === cidadeExtraidoSemAcento) {
            return true;
          }
        }
        return false;
      });
      
      if (matchCidade) {
        return matchCidade;
      }
    }
    
    return null;
  };

  // Buscar lojas vinculadas ao supervisor selecionado
  useEffect(() => {
    const buscarLojasDoSupervisor = async () => {
      if (!supervisorFilter) {
        setLojasDoSupervisorSelecionado([]);
        return;
      }

      try {
        // Buscar lojas vinculadas ao supervisor na tabela users_regras_lojas
        const { data: lojasVinculadas, error } = await supabase
          .from('users_regras_lojas')
          .select('loja_id')
          .eq('user_regra_id', supervisorFilter);

        if (error) {
          console.error('Erro ao buscar lojas do supervisor:', error);
          setLojasDoSupervisorSelecionado([]);
          return;
        }

        if (lojasVinculadas && lojasVinculadas.length > 0) {
          const lojasIds = lojasVinculadas.map(l => l.loja_id);
          const lojasDoSupervisor = lojas.filter(loja => lojasIds.includes(loja.id));
          setLojasDoSupervisorSelecionado(lojasDoSupervisor);
        } else {
          setLojasDoSupervisorSelecionado([]);
        }
      } catch (error) {
        console.error('Erro ao buscar lojas do supervisor:', error);
        setLojasDoSupervisorSelecionado([]);
      }
    };

    buscarLojasDoSupervisor();
  }, [supervisorFilter, lojas]);

  // Identificar lojas que têm campanhas e são visíveis para o usuário
  useEffect(() => {
    if (campaigns.length === 0 || lojas.length === 0 || lojasVisiveis.length === 0) return;

    const nomesLojasCampanhas = new Set<string>();
    
    // Extrair nomes das lojas das campanhas
    campaigns.forEach(campaign => {
      const nomeLoja = extractLojaNome(campaign.name);
      if (nomeLoja) {
        nomesLojasCampanhas.add(nomeLoja);
      }
    });

    // Filtrar lojas que têm campanhas E são visíveis para o usuário
    const lojasComCampanhasData: Loja[] = [];
    const nomesLojasProcessados = new Set<string>();
    
    // Para cada nome extraído das campanhas, encontrar a loja correspondente
    nomesLojasCampanhas.forEach(nomeExtraido => {
      const lojaEncontrada = encontrarLojaSimilar(nomeExtraido, lojasVisiveis);
      if (lojaEncontrada && !nomesLojasProcessados.has(lojaEncontrada.id)) {
        lojasComCampanhasData.push(lojaEncontrada);
        nomesLojasProcessados.add(lojaEncontrada.id);
      }
    });
    setLojasComCampanhas(lojasComCampanhasData);
  }, [campaigns, lojas, lojasVisiveis]);

  // Carregar supervisores e lojas
  useEffect(() => {
    const carregarDados = async () => {
      if (!userWithLevel) return;

      try {
        // Carregar supervisores
        const { data: supervisoresData, error: supervisoresError } = await supabase
          .from('users_regras')
          .select('id, nome')
          .eq('nivel', 'supervisor')
          .order('nome');

        if (!supervisoresError && supervisoresData) {
          setSupervisores(supervisoresData);
        }

        // Carregar lojas
        const { data: lojasData, error: lojasError } = await supabase
          .from('lojas')
          .select('id, nome')
          .order('nome');

        if (!lojasError && lojasData) {
          setLojas(lojasData);
        }

        // Configurar visibilidade baseada no nível do usuário
        if (userWithLevel.nivel === 'diretor') {
          setSupervisoresVisiveis(supervisoresData || []);
          setLojasVisiveis(lojasData || []);
        } else if (userWithLevel.nivel === 'supervisor') {
          // Supervisor vê apenas suas lojas
          const { data: lojasVinculadas } = await supabase
            .from('users_regras_lojas')
            .select('loja_id')
            .eq('user_regra_id', userWithLevel.id);

          if (lojasVinculadas) {
            const lojasIds = lojasVinculadas.map(l => l.loja_id);
            const lojasDoSupervisor = lojasData?.filter(loja => lojasIds.includes(loja.id)) || [];
            setLojasVisiveis(lojasDoSupervisor);
            // Supervisor vê apenas ele mesmo no filtro
            setSupervisoresVisiveis([{ id: userWithLevel.id, nome: userWithLevel.nome || '' }]);
          }
        } else if (userWithLevel.nivel === 'loja') {
          // Usuário loja vê apenas sua loja
          const lojaDoUsuario = lojasData?.find(loja => loja.id === userWithLevel.loja_id);
          if (lojaDoUsuario) {
            setLojasVisiveis([lojaDoUsuario]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar supervisores e lojas:', error);
      }
    };

    carregarDados();
  }, [userWithLevel]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...campaigns];

    // Filtro por supervisor (baseado nas lojas vinculadas ao supervisor)
    if (supervisorFilter && lojasDoSupervisorSelecionado.length > 0) {
      console.log('🔍 CampaignFilters - Aplicando filtro por supervisor:', {
        supervisorFilter,
        lojasDoSupervisorSelecionado: lojasDoSupervisorSelecionado.map(l => l.nome),
        campanhasAntes: filtered.length
      });
      
      // Filtrar campanhas que correspondem às lojas do supervisor
      filtered = filtered.filter(campaign => {
        const nomeLojaCampanha = extractLojaNome(campaign.name);
        if (!nomeLojaCampanha) {
          return false;
        }
        
        // Verificar se a campanha corresponde a alguma das lojas do supervisor
        return lojasDoSupervisorSelecionado.some(loja => {
          const lojaEncontrada = encontrarLojaSimilar(nomeLojaCampanha, [loja]);
          return lojaEncontrada !== null;
        });
      });
      
      console.log('🔍 CampaignFilters - Campanhas após filtro:', filtered.length);
    }

    // Filtro por loja (baseado no nome da campanha)
    if (lojaFilter) {
      const loja = lojasComCampanhas.find(l => l.id === lojaFilter);
      if (loja) {
        filtered = filtered.filter(campaign => {
          // Extrair nome da loja da campanha
          const nomeLojaCampanha = extractLojaNome(campaign.name);
          
          if (!nomeLojaCampanha) {
            return false;
          }
          
          // Usar a mesma lógica de matching para verificar se a campanha pertence à loja
          const lojaEncontrada = encontrarLojaSimilar(nomeLojaCampanha, [loja]);
          return lojaEncontrada !== null;
        });
      }
    }

    // Ordenação padrão por nome
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    onFilterChange(filtered);
  }, [campaigns, supervisorFilter, lojaFilter, supervisores, lojasComCampanhas, lojasDoSupervisorSelecionado]);

  // Limpar filtro de loja quando mudar o supervisor
  useEffect(() => {
    if (supervisorFilter) {
      setLojaFilter('');
    }
  }, [supervisorFilter]);

  // Determinar quais lojas mostrar no filtro de loja
  const lojasParaMostrar = useMemo(() => {
    if (supervisorFilter && lojasDoSupervisorSelecionado.length > 0) {
      // Filtrar apenas as lojas do supervisor que têm campanhas
      const lojasComCampanhasDoSupervisor = lojasDoSupervisorSelecionado.filter(loja => {
        // Verificar se existe alguma campanha para esta loja
        return campaigns.some(campaign => {
          const nomeLojaCampanha = extractLojaNome(campaign.name);
          if (!nomeLojaCampanha) {
            return false;
          }
          
          const lojaEncontrada = encontrarLojaSimilar(nomeLojaCampanha, [loja]);
          return lojaEncontrada !== null;
        });
      });
      
      return lojasComCampanhasDoSupervisor;
    }
    
    // Se não há supervisor selecionado, mostrar todas as lojas com campanhas
    return lojasComCampanhas;
  }, [supervisorFilter, lojasDoSupervisorSelecionado, campaigns, lojasComCampanhas]);

  return (
    <div className="dashboard-layout-header-filters-grid">
      {/* Seletor de Conta */}
      {configuredAccounts.length > 1 && (
        <div className="header-filters-item">
          <select
            value={selectedAccount}
            onChange={(e) => onAccountChange(e.target.value as 'ACCOUNT_1' | 'ACCOUNT_2' | 'ALL')}
            className="header-filters-select"
            title="Conta"
          >
            <option value="ACCOUNT_1">
              {configuredAccounts.find(acc => acc.key === 'ACCOUNT_1')?.name || 'Conta 1'}
            </option>
            <option value="ACCOUNT_2">
              {configuredAccounts.find(acc => acc.key === 'ACCOUNT_2')?.name || 'Conta 2'}
            </option>
            <option value="ALL">Todas as Contas</option>
          </select>
        </div>
      )}

      {/* Filtro por Supervisor */}
      {supervisoresVisiveis.length > 0 && (
        <div className="header-filters-item">
          <select
            value={supervisorFilter}
            onChange={(e) => setSupervisorFilter(e.target.value)}
            className="header-filters-select"
            title="Supervisor"
          >
            {userWithLevel?.nivel === 'supervisor' ? (
              // Supervisor não vê opção "Todos", apenas ele mesmo
              <option value={userWithLevel.id}>
                {userWithLevel.nome}
              </option>
            ) : (
              // Diretor vê opção "Todos" e todos os supervisores
              <>
                <option value="">Todos Supervisores</option>
                {supervisoresVisiveis.map(supervisor => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.nome}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      )}

      {/* Filtro por Loja */}
      {lojasParaMostrar.length > 0 && (
        <div className="header-filters-item">
          <select
            value={lojaFilter}
            onChange={(e) => setLojaFilter(e.target.value)}
            className="header-filters-select"
            title="Loja"
          >
            <option value="">Todas Lojas</option>
            {lojasParaMostrar.map(loja => (
              <option key={loja.id} value={loja.id}>
                {loja.nome}
              </option>
            ))}
          </select>
        </div>
      )}


      {/* Filtro de Data */}
      <div className="header-filters-item header-filters-item-date">
        <div className="header-filters-date-wrapper">
          <CalendarDateFilter
            onDateRangeChange={(startDate: string, endDate: string) => {
              onDateRangeChange({ since: startDate, until: endDate });
            }}
            initialStartDate={dateRange.since}
            initialEndDate={dateRange.until}
          />
        </div>
      </div>

      {/* Limpar Filtros */}
      {(supervisorFilter || lojaFilter) && (
        <div className="header-filters-item">
          <button
            onClick={() => {
              setSupervisorFilter('');
              setLojaFilter('');
            }}
            className="header-filters-clear-button"
            title="Limpar filtros"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignFilters;

