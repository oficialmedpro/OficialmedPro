import { supabase } from './supabase.js';

class MetasService {

  /**
   * Busca todas as metas ativas agrupadas por vendedor
   */
  async getAllMetas() {
    try {
      console.log('🎯 Buscando todas as metas...');

      const { data, error } = await supabase
        .schema('api')
        .from('metas')
        .select('*')
        .eq('ativo', true)
        .order('vendedor_id', { nullsFirst: false })
        .order('tipo_meta')
        .order('nome_meta');

      if (error) {
        console.error('❌ Erro ao buscar metas:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} metas encontradas`);

      // Agrupar metas por vendedor
      const metasAgrupadas = this.groupMetasByVendedor(data || []);

      return metasAgrupadas;

    } catch (error) {
      console.error('❌ Erro no serviço de metas:', error);
      throw error;
    }
  }

  /**
   * Agrupa metas por vendedor
   */
  groupMetasByVendedor(metas) {
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
  }

  /**
   * Atualiza uma meta específica
   */
  async updateMeta(metaId, dadosAtualizados) {
    try {
      console.log(`🔄 Atualizando meta ${metaId}:`, dadosAtualizados);

      // Adicionar timestamp de atualização
      const dadosCompletos = {
        ...dadosAtualizados,
        data_atualizacao: new Date().toISOString()
      };

      const { data, error } = await supabase
        .schema('api')
        .from('metas')
        .update(dadosCompletos)
        .eq('id', metaId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar meta:', error);
        throw error;
      }

      console.log('✅ Meta atualizada com sucesso:', data[0]);
      return data[0];

    } catch (error) {
      console.error('❌ Erro ao atualizar meta:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova meta
   */
  async createMeta(novaMeta) {
    try {
      console.log('➕ Criando nova meta:', novaMeta);

      const dadosCompletos = {
        ...novaMeta,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        ativo: true
      };

      const { data, error } = await supabase
        .schema('api')
        .from('metas')
        .insert([dadosCompletos])
        .select();

      if (error) {
        console.error('❌ Erro ao criar meta:', error);
        throw error;
      }

      console.log('✅ Meta criada com sucesso:', data[0]);
      return data[0];

    } catch (error) {
      console.error('❌ Erro ao criar meta:', error);
      throw error;
    }
  }

  /**
   * Desativa uma meta (soft delete)
   */
  async deactivateMeta(metaId) {
    try {
      console.log(`🗑️ Desativando meta ${metaId}`);

      const { data, error } = await supabase
        .schema('api')
        .from('metas')
        .update({
          ativo: false,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', metaId)
        .select();

      if (error) {
        console.error('❌ Erro ao desativar meta:', error);
        throw error;
      }

      console.log('✅ Meta desativada com sucesso');
      return data[0];

    } catch (error) {
      console.error('❌ Erro ao desativar meta:', error);
      throw error;
    }
  }

  /**
   * Busca vendedores para popular dropdown
   */
  async getVendedores() {
    try {
      console.log('👥 Buscando vendedores da tabela api.vendedores...');

      // Primeiro tenta com id_sprint
      let { data, error } = await supabase
        .schema('api')
        .from('vendedores')
        .select('id_sprint, nome')
        .order('nome');

      // Se der erro, tenta com id
      if (error) {
        console.log('🔄 Tentando com campo "id" ao invés de "id_sprint"...');
        const result = await supabase
          .schema('api')
          .from('vendedores')
          .select('id, nome')
          .order('nome');

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Erro ao buscar vendedores da tabela vendedores:', error);
        console.log('🔄 Usando fallback - buscando das metas...');
        // Se não tiver tabela vendedores, retornar lista dos vendedores das metas
        return await this.getVendedoresFromMetas();
      }

      const vendedoresMapeados = data?.map(v => ({
        id: v.id_sprint || v.id,
        nome: v.nome
      })) || [];
      console.log(`✅ ${data?.length || 0} vendedores encontrados da tabela vendedores:`, vendedoresMapeados);
      return vendedoresMapeados;

    } catch (error) {
      console.error('❌ Erro crítico ao buscar vendedores:', error);
      console.log('🔄 Usando fallback - buscando das metas...');
      return await this.getVendedoresFromMetas();
    }
  }

  /**
   * Busca vendedores únicos das metas (fallback)
   */
  async getVendedoresFromMetas() {
    try {
      const { data, error } = await supabase
        .schema('api')
        .from('metas')
        .select('vendedor_id')
        .not('vendedor_id', 'is', null)
        .eq('ativo', true);

      if (error) throw error;

      // Extrair vendedores únicos
      const vendedoresUnicos = [...new Set(data.map(m => m.vendedor_id))];

      return vendedoresUnicos.map(id => ({
        id,
        nome: `Vendedor ${id}`
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar vendedores das metas:', error);
      return [];
    }
  }
}

export const metasService = new MetasService();
export default metasService;