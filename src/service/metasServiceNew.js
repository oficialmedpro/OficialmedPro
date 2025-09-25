/**
 * 🎯 METAS SERVICE NEW
 *
 * Serviço para buscar e gerenciar metas da tabela api.metas
 * agrupados por vendedor, com funcionalidades CRUD
 */

// Configurações do Supabase
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🎯 BUSCAR TODAS AS METAS ATIVAS
 */
export const getAllMetasNew = async () => {
  try {
    console.log('🎯 Buscando todas as metas ativas...');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/metas?select=*&ativo=eq.true&order=vendedor_id.nullsfirst,tipo_meta,nome_meta`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ ${data?.length || 0} metas encontradas`);

    // Agrupar metas por vendedor
    const metasAgrupadas = groupMetasByVendedor(data || []);

    return metasAgrupadas;

  } catch (error) {
    console.error('❌ Erro ao buscar metas:', error);
    throw error;
  }
};

/**
 * 🗂️ AGRUPAR METAS POR VENDEDOR
 */
const groupMetasByVendedor = (metas) => {
  const grupos = {
    gerais: [], // Metas sem vendedor_id
    vendedores: {} // Metas por vendedor
  };

  metas.forEach(meta => {
    if (!meta.vendedor_id) {
      // Metas gerais (sem vendedor)
      grupos.gerais.push(meta);
    } else {
      // Metas por vendedor
      if (!grupos.vendedores[meta.vendedor_id]) {
        grupos.vendedores[meta.vendedor_id] = [];
      }
      grupos.vendedores[meta.vendedor_id].push(meta);
    }
  });

  console.log('📊 Metas agrupadas:', {
    gerais: grupos.gerais.length,
    vendedores: Object.keys(grupos.vendedores).length
  });

  return grupos;
};

/**
 * 🔄 ATUALIZAR META
 */
export const updateMetaNew = async (metaId, dadosAtualizados) => {
  try {
    console.log(`🔄 Atualizando meta ${metaId}:`, dadosAtualizados);

    // Adicionar timestamp de atualização
    const dadosCompletos = {
      ...dadosAtualizados,
      data_atualizacao: new Date().toISOString()
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/metas?id=eq.${metaId}`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dadosCompletos)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao atualizar meta:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Meta atualizada com sucesso:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ Erro ao atualizar meta:', error);
    throw error;
  }
};

/**
 * ➕ CRIAR NOVA META
 */
export const createMetaNew = async (novaMeta) => {
  try {
    console.log('➕ Criando nova meta:', novaMeta);

    const dadosCompletos = {
      ...novaMeta,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
      ativo: true
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/metas`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dadosCompletos)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao criar meta:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Meta criada com sucesso:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ Erro ao criar meta:', error);
    throw error;
  }
};

/**
 * 🗑️ DESATIVAR META (SOFT DELETE)
 */
export const deactivateMetaNew = async (metaId) => {
  try {
    console.log(`🗑️ Desativando meta ${metaId}`);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/metas?id=eq.${metaId}`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ativo: false,
          data_atualizacao: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao desativar meta:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Meta desativada com sucesso');
    return data[0];

  } catch (error) {
    console.error('❌ Erro ao desativar meta:', error);
    throw error;
  }
};

/**
 * 👥 BUSCAR VENDEDORES DA TABELA VENDEDORES
 */
export const getVendedoresNew = async () => {
  try {
    console.log('👥 Buscando vendedores...');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/vendedores?select=id_sprint,nome&order=nome`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao buscar vendedores:', errorText);
      // Fallback para buscar das metas
      return await getVendedoresFromMetasNew();
    }

    const data = await response.json();
    const vendedoresList = data.map(v => ({
      id: v.id_sprint,
      nome: v.nome
    }));

    console.log(`✅ ${vendedoresList.length} vendedores encontrados`);
    return vendedoresList;

  } catch (error) {
    console.error('❌ Erro ao buscar vendedores:', error);
    return await getVendedoresFromMetasNew();
  }
};

/**
 * 👥 BUSCAR VENDEDORES ÚNICOS DAS METAS (FALLBACK)
 */
export const getVendedoresFromMetasNew = async () => {
  try {
    console.log('👥 Buscando vendedores das metas...');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/metas?select=vendedor_id&ativo=eq.true&vendedor_id=not.is.null`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao buscar vendedores:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extrair vendedores únicos
    const vendedoresUnicos = [...new Set(data.map(m => m.vendedor_id))];

    const vendedoresList = vendedoresUnicos.map(id => ({
      id,
      nome: `Vendedor ${id}`
    }));

    console.log(`✅ ${vendedoresList.length} vendedores únicos encontrados`);
    return vendedoresList;

  } catch (error) {
    console.error('❌ Erro ao buscar vendedores das metas:', error);
    return [];
  }
};