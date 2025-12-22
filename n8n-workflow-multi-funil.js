// ============================================================================
// MAPEAMENTO DINÂMICO DE FUNIS E CAMPOS DE ENTRADA
// ============================================================================
// Este código será usado no node "Adicionar Wrapper" do n8n
// ============================================================================

// Mapeamento de funis baseado no crm_column
const FUNIS_CONFIG = {
  // Funil 6 - COMPRA
  6: {
    name: "COMPRA",
    entradaField: "entrada_compra",
    crmColumns: [130, 231, 82, 207, 83, 85, 232],
    entradaColumn: 130 // crm_column da etapa ENTRADA
  },
  // Funil 14 - RECOMPRA
  14: {
    name: "RECOMPRA",
    entradaField: "entrada_recompra",
    crmColumns: [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150],
    entradaColumn: 202 // crm_column da etapa ENTRADA
  },
  // TODO: Adicionar outros funis quando souber os IDs
  // Funil ATIVACAO
  // X: {
  //   name: "ATIVACAO",
  //   entradaField: "entrada_ativacao",
  //   crmColumns: [...],
  //   entradaColumn: XXX
  // },
  // Funil MONITORAMENTO
  // X: {
  //   name: "MONITORAMENTO",
  //   entradaField: "entrada_monitoramento",
  //   crmColumns: [...],
  //   entradaColumn: XXX
  // },
  // Funil REATIVACAO
  // X: {
  //   name: "REATIVACAO",
  //   entradaField: "entrada_reativacao",
  //   crmColumns: [...],
  //   entradaColumn: XXX
  // }
};

// Função para identificar o funil pelo crm_column
function getFunilByColumn(crmColumn) {
  for (const [funilId, config] of Object.entries(FUNIS_CONFIG)) {
    if (config.crmColumns.includes(crmColumn)) {
      return { funilId: parseInt(funilId), config };
    }
  }
  return null;
}

// Função principal para processar o body
const webhookData = $input.item.json;
const body = webhookData.body || webhookData;

// Converter ID para número
if (body && body.id && typeof body.id === 'string') {
  body.id = parseInt(body.id, 10);
}

// Identificar funil pelo crm_column recebido (ou pelo campo de entrada)
let funilConfig = null;
let entradaFieldName = null;
let entradaColumnId = null;

// Opção 1: Se crm_column já vier no payload
if (body.crm_column) {
  const crmColumn = parseInt(body.crm_column) || 0;
  const funilInfo = getFunilByColumn(crmColumn);
  
  if (funilInfo) {
    funilConfig = funilInfo.config;
    entradaFieldName = funilInfo.config.entradaField;
    entradaColumnId = funilInfo.config.entradaColumn;
  }
}

// Opção 2: Se não identificou pelo crm_column, tentar identificar pelo campo de entrada
if (!funilConfig) {
  // Verificar qual campo de entrada tem valor
  if (body.entrada_compra) {
    funilConfig = FUNIS_CONFIG[6];
    entradaFieldName = "entrada_compra";
    entradaColumnId = 130;
  } else if (body.entrada_recompra) {
    funilConfig = FUNIS_CONFIG[14];
    entradaFieldName = "entrada_recompra";
    entradaColumnId = 202;
  } else if (body.entrada_ativacao) {
    // TODO: Configurar quando souber os IDs
    entradaFieldName = "entrada_ativacao";
    // entradaColumnId = XXX;
  } else if (body.entrada_monitoramento) {
    // TODO: Configurar quando souber os IDs
    entradaFieldName = "entrada_monitoramento";
    // entradaColumnId = XXX;
  } else if (body.entrada_reativacao) {
    // TODO: Configurar quando souber os IDs
    entradaFieldName = "entrada_reativacao";
    // entradaColumnId = XXX;
  }
}

// Se identificou o funil e estamos na etapa de ENTRADA, usar o crm_column correto
if (funilConfig && entradaColumnId) {
  // Se o crm_column atual corresponde à etapa de entrada, manter
  // Caso contrário, se estamos preenchendo um campo de entrada, usar o crm_column de entrada
  const currentColumn = parseInt(body.crm_column) || 0;
  
  // Se há um campo de entrada preenchido E o crm_column atual não corresponde, ajustar
  if (body[entradaFieldName] && currentColumn !== entradaColumnId) {
    body.crm_column = entradaColumnId;
  }
} else {
  // Fallback: se não identificou, usar crm_column fixo 130 (COMPRA) como padrão
  body.crm_column = body.crm_column || 130;
}

return {
  json: {
    p_payload: body
  }
};


