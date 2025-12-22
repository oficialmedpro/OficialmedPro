// ============================================================================
// CÓDIGO PARA O NODE "Adicionar Wrapper" NO N8N
// ============================================================================
// Este código deve ser colado no node "Code" do n8n que processa o webhook
// ============================================================================

// Adicionar wrapper p_payload ao body recebido
// O n8n webhook envia body dentro de um objeto maior
const webhookData = $input.item.json;
const body = webhookData.body || webhookData;

// Garantir que o ID seja número se vier como string
if (body && body.id && typeof body.id === 'string') {
  body.id = parseInt(body.id, 10);
}

// ============================================================================
// MAPEAMENTO DINÂMICO DE FUNIS BASEADO NO CAMPO DE ENTRADA
// ============================================================================
const ENTRADA_FUNIS_CONFIG = {
  'entrada_compra': {
    crm_column: 130,
    funil_id: 6,
    funil_nome: '[1] COMERCIAL APUCARANA'
  },
  'entrada_ativacao': {
    crm_column: 314,
    funil_id: 33,
    funil_nome: '[1] ATIVAÇÃO COMERCIAL'
  },
  'entrada_monitoramento': {
    crm_column: 353,
    funil_id: 41,
    funil_nome: '[1] MONITORAMENTO COMERCIAL'
  },
  'entrada_reativacao': {
    crm_column: 333,
    funil_id: 38,
    funil_nome: '[1] REATIVAÇÃO COMERCIAL'
  },
  'entrada_recompra': {
    crm_column: 202,
    funil_id: 14,
    funil_nome: '[1] RECOMPRA APUCARANA'
  }
};

// ============================================================================
// MAPEAMENTO DINÂMICO DE FUNIS BASEADO NO CAMPO DE ORÇAMENTO/NEGOCIAÇÃO
// ============================================================================
const ORCAMENTO_FUNIS_CONFIG = {
  'orcamento_compra': {
    campo_negociacao: 'negociacao_compra',
    crm_column_orcamento: 207,
    crm_column_negociacao: 83,
    funil_id: 6,
    funil_nome: '[1] COMERCIAL APUCARANA'
  },
  'orcamento_recompra': {
    campo_negociacao: 'negociacao_recompra',
    crm_column_orcamento: 206,
    crm_column_negociacao: 203,
    funil_id: 14,
    funil_nome: '[1] RECOMPRA APUCARANA'
  },
  'orcamento_ativacao': {
    campo_negociacao: 'negociacao_ativacao',
    crm_column_orcamento: 316,
    crm_column_negociacao: 318,
    funil_id: 33,
    funil_nome: '[1] ATIVAÇÃO COMERCIAL'
  },
  'orcamento_monitoramento': {
    campo_negociacao: 'negociacao_monitoramento',
    crm_column_orcamento: 356,
    crm_column_negociacao: 357,
    funil_id: 41,
    funil_nome: '[1] MONITORAMENTO COMERCIAL'
  },
  'orcamento_reativacao': {
    campo_negociacao: 'negociacao_reativacao',
    crm_column_orcamento: 336,
    crm_column_negociacao: 337,
    funil_id: 38,
    funil_nome: '[1] REATIVAÇÃO COMERCIAL'
  }
};

// ============================================================================
// MAPEAMENTO DINÂMICO DE FUNIS BASEADO NO CAMPO DE CADASTRO (VENDAS)
// ============================================================================
const CADASTRO_FUNIS_CONFIG = {
  'cadastro_compra': {
    crm_column: 232,
    funil_id: 6,
    funil_nome: '[1] COMERCIAL APUCARANA'
  },
  'cadastro_recompra': {
    crm_column: 230,
    funil_id: 14,
    funil_nome: '[1] RECOMPRA APUCARANA'
  },
  'cadastro_ativacao': {
    crm_column: 320,
    funil_id: 33,
    funil_nome: '[1] ATIVAÇÃO COMERCIAL'
  },
  'cadastro_monitoramento': {
    crm_column: 359,
    funil_id: 41,
    funil_nome: '[1] MONITORAMENTO COMERCIAL'
  },
  'cadastro_reativacao': {
    crm_column: 339,
    funil_id: 38,
    funil_nome: '[1] REATIVAÇÃO COMERCIAL'
  }
};

// ============================================================================
// LÓGICA DE IDENTIFICAÇÃO: CADASTRO → ORÇAMENTO → ENTRADA
// Prioridade: CADASTRO (vendas) tem maior prioridade
// ============================================================================

let funilConfig = null;
let tipoWebhook = null; // 'cadastro', 'orcamento' ou 'entrada'

// Mapeamento de crm_column para config de CADASTRO (para quando tiver status='gain')
const CRM_COLUMN_TO_CADASTRO = {
  232: CADASTRO_FUNIS_CONFIG['cadastro_compra'],
  230: CADASTRO_FUNIS_CONFIG['cadastro_recompra'],
  320: CADASTRO_FUNIS_CONFIG['cadastro_ativacao'],
  359: CADASTRO_FUNIS_CONFIG['cadastro_monitoramento'],
  339: CADASTRO_FUNIS_CONFIG['cadastro_reativacao']
};

// 1. PRIMEIRO: Verificar se é um webhook de CADASTRO (VENDAS)
// Se o status for 'gain'/'won' ou se tiver campo cadastro_* preenchido
const statusGain = body.status && (body.status === 'gain' || body.status === 'won');

// Verificar campos de CADASTRO preenchidos
for (const [campoCadastro, config] of Object.entries(CADASTRO_FUNIS_CONFIG)) {
  const temCadastro = body[campoCadastro] && body[campoCadastro] !== '' && body[campoCadastro] !== null;
  
  if (temCadastro) {
    funilConfig = config;
    tipoWebhook = 'cadastro';
    body.crm_column = config.crm_column;
    break;
  }
}

// Se não encontrou campo cadastro mas tem status='gain', tentar identificar pelo crm_column
if (!funilConfig && statusGain) {
  if (body.crm_column) {
    const crmColumnNum = parseInt(body.crm_column, 10);
    if (CRM_COLUMN_TO_CADASTRO[crmColumnNum]) {
      funilConfig = CRM_COLUMN_TO_CADASTRO[crmColumnNum];
      tipoWebhook = 'cadastro';
      body.crm_column = funilConfig.crm_column;
    }
  }
  
  // Se ainda não identificou, tentar identificar pelo funil_id que veio no body
  if (!funilConfig && body.funil_id) {
    const funilIdNum = parseInt(body.funil_id, 10);
    // Mapear funil_id para cadastro
    const funilIdToCadastro = {
      6: CADASTRO_FUNIS_CONFIG['cadastro_compra'],
      14: CADASTRO_FUNIS_CONFIG['cadastro_recompra'],
      33: CADASTRO_FUNIS_CONFIG['cadastro_ativacao'],
      41: CADASTRO_FUNIS_CONFIG['cadastro_monitoramento'],
      38: CADASTRO_FUNIS_CONFIG['cadastro_reativacao']
    };
    if (funilIdToCadastro[funilIdNum]) {
      funilConfig = funilIdToCadastro[funilIdNum];
      tipoWebhook = 'cadastro';
      body.crm_column = funilConfig.crm_column;
    }
  }
  
  // Se ainda não identificou com status='gain', tentar identificar pelos campos de entrada/orçamento
  if (!funilConfig) {
    // Verificar por campos de entrada
    for (const [campoEntrada, configEntrada] of Object.entries(ENTRADA_FUNIS_CONFIG)) {
      if (body[campoEntrada] && body[campoEntrada] !== '' && body[campoEntrada] !== null) {
        const funilSufixo = campoEntrada.replace('entrada_', '');
        const campoCadastro = `cadastro_${funilSufixo}`;
        if (CADASTRO_FUNIS_CONFIG[campoCadastro]) {
          funilConfig = CADASTRO_FUNIS_CONFIG[campoCadastro];
          tipoWebhook = 'cadastro';
          body.crm_column = funilConfig.crm_column;
          break;
        }
      }
    }
    
    // Se ainda não identificou, verificar por orçamento
    if (!funilConfig) {
      for (const [campoOrcamento, configOrcamento] of Object.entries(ORCAMENTO_FUNIS_CONFIG)) {
        if ((body[campoOrcamento] && body[campoOrcamento] !== '' && body[campoOrcamento] !== null) ||
            (body[configOrcamento.campo_negociacao] && body[configOrcamento.campo_negociacao] !== '' && body[configOrcamento.campo_negociacao] !== null)) {
          const funilSufixo = campoOrcamento.replace('orcamento_', '');
          const campoCadastro = `cadastro_${funilSufixo}`;
          if (CADASTRO_FUNIS_CONFIG[campoCadastro]) {
            funilConfig = CADASTRO_FUNIS_CONFIG[campoCadastro];
            tipoWebhook = 'cadastro';
            body.crm_column = funilConfig.crm_column;
            break;
          }
        }
      }
    }
  }
  
  // Último fallback: usar COMPRA como padrão
  if (!funilConfig && statusGain) {
    funilConfig = CADASTRO_FUNIS_CONFIG['cadastro_compra'];
    tipoWebhook = 'cadastro';
    body.crm_column = funilConfig.crm_column;
  }
}

// 2. SEGUNDO: Verificar se é um webhook de ORÇAMENTO/NEGOCIAÇÃO
if (!funilConfig) {
  for (const [campoOrcamento, config] of Object.entries(ORCAMENTO_FUNIS_CONFIG)) {
    const campoNegociacao = config.campo_negociacao;
    
    const temOrcamento = body[campoOrcamento] && body[campoOrcamento] !== '' && body[campoOrcamento] !== null;
    const temNegociacao = body[campoNegociacao] && body[campoNegociacao] !== '' && body[campoNegociacao] !== null;
    
    if (temOrcamento || temNegociacao) {
      funilConfig = config;
      tipoWebhook = 'orcamento';
      
      // Determinar qual etapa usar (Orçamento ou Negociação)
      let dataOrcamento = null;
      let dataNegociacao = null;
      
      if (temOrcamento) {
        dataOrcamento = new Date(body[campoOrcamento]);
      }
      if (temNegociacao) {
        dataNegociacao = new Date(body[campoNegociacao]);
      }
      
      // Se ambas existem, usar a mais antiga
      if (dataOrcamento && dataNegociacao) {
        body.crm_column = dataOrcamento <= dataNegociacao ? config.crm_column_orcamento : config.crm_column_negociacao;
      } else if (dataOrcamento) {
        body.crm_column = config.crm_column_orcamento;
      } else if (dataNegociacao) {
        body.crm_column = config.crm_column_negociacao;
      }
      
      break;
    }
  }
}

// 3. TERCEIRO: Se não encontrou cadastro nem orçamento, verificar campos de ENTRADA
if (!funilConfig) {
  for (const [campo, config] of Object.entries(ENTRADA_FUNIS_CONFIG)) {
    if (body[campo] && body[campo] !== '' && body[campo] !== null) {
      funilConfig = config;
      tipoWebhook = 'entrada';
      body.crm_column = config.crm_column;
      break;
    }
  }
}

// 4. Aplicar configuração do funil
if (funilConfig) {
  // Adicionar funil_id e funil_nome se não existirem
  if (!body.funil_id) {
    body.funil_id = funilConfig.funil_id;
  }
  if (!body.funil_nome) {
    body.funil_nome = funilConfig.funil_nome;
  }
} else {
  // Fallback: se não identificou, usar COMPRA (130) como padrão
  body.crm_column = body.crm_column || 130;
  body.funil_id = body.funil_id || 6;
  body.funil_nome = body.funil_nome || '[1] COMERCIAL APUCARANA';
}

return {
  json: {
    p_payload: body
  }
};

