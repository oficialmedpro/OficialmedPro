/**
 * Constantes para o Cockpit de Vendedores
 * Funis comerciais de Apucarana (unidade [1])
 */

// IDs dos funis comerciais de Apucarana
export const FUNIS_COMERCIAIS_APUCARANA = [6, 14, 33, 41, 38];

// Mapeamento de funil para campo cadastro
export const FUNIL_PARA_CAMPO_CADASTRO = {
  6: 'cadastro_compra',      // [1] COMERCIAL APUCARANA
  14: 'cadastro_recompra',   // [1] RECOMPRA APUCARANA
  33: 'cadastro_ativacao',   // [1] ATIVAÇÃO COMERCIAL
  41: 'cadastro_monitoramento', // [1] MONITORAMENTO COMERCIAL
  38: 'cadastro_reativacao'  // [1] REATIVAÇÃO COMERCIAL
};

// Mapeamento de funil para campo entrada
export const FUNIL_PARA_CAMPO_ENTRADA = {
  6: 'entrada_compra',
  14: 'entrada_recompra',
  33: 'entrada_ativacao',
  41: 'entrada_monitoramento',
  38: 'entrada_reativacao'
};

