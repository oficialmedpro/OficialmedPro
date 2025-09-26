/**
 * Serviço para integração com a API do Firebird
 * Conecta com o backend Node.js que possui o connector node-firebird
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

class FirebirdService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/firebird`;
    console.log('🔥 FirebirdService inicializado com URL:', this.baseURL);
  }

  /**
   * Faz requisição HTTP para a API
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      console.log(`🌐 Fazendo requisição: ${config.method || 'GET'} ${url}`);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Resposta recebida:', data);

      return data;

    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      throw error;
    }
  }

  /**
   * Testa a conexão com o banco Firebird
   */
  async testConnection() {
    try {
      console.log('🧪 Testando conexão com Firebird...');
      const response = await this.request('/test-connection');

      return {
        success: response.success,
        message: response.message,
        data: response.data,
        error: response.error,
        timestamp: response.timestamp
      };

    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Lista todas as tabelas do banco
   */
  async getTables() {
    try {
      console.log('📋 Buscando lista de tabelas...');
      const response = await this.request('/tables');

      return {
        success: response.success,
        data: response.data || [],
        count: response.count || 0
      };

    } catch (error) {
      console.error('❌ Erro ao listar tabelas:', error);
      throw new Error(`Erro ao listar tabelas: ${error.message}`);
    }
  }

  /**
   * Obtém a estrutura de uma tabela específica
   */
  async getTableStructure(tableName) {
    try {
      console.log(`📋 Buscando estrutura da tabela: ${tableName}`);
      const response = await this.request(`/tables/${tableName}/structure`);

      return {
        success: response.success,
        data: response.data,
        count: response.count || 0
      };

    } catch (error) {
      console.error(`❌ Erro ao obter estrutura da tabela ${tableName}:`, error);
      throw new Error(`Erro ao obter estrutura da tabela: ${error.message}`);
    }
  }

  /**
   * Busca dados de uma tabela com filtros opcionais
   */
  async getTableData(tableName, options = {}) {
    try {
      const {
        fields = '*',
        where = '',
        orderBy = '',
        limit = 50,
        offset = 0
      } = options;

      console.log(`🔍 Buscando dados da tabela: ${tableName}`);

      const queryParams = new URLSearchParams({
        fields,
        where,
        orderBy,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await this.request(`/tables/${tableName}/data?${queryParams}`);

      return {
        success: response.success,
        data: response.data || [],
        count: response.count || 0,
        hasMore: response.hasMore || false,
        pagination: response.pagination
      };

    } catch (error) {
      console.error(`❌ Erro ao buscar dados da tabela ${tableName}:`, error);
      throw new Error(`Erro ao buscar dados da tabela: ${error.message}`);
    }
  }

  /**
   * Executa uma query SQL customizada
   */
  async executeQuery(sql, params = [], options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;

      console.log('🔍 Executando query customizada...');

      const response = await this.request('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql,
          params,
          limit,
          offset
        })
      });

      return {
        success: response.success,
        data: response.data || [],
        count: response.count || 0,
        hasMore: response.hasMore || false,
        pagination: response.pagination
      };

    } catch (error) {
      console.error('❌ Erro ao executar query:', error);
      throw new Error(`Erro ao executar query: ${error.message}`);
    }
  }

  /**
   * Busca dados com paginação automática
   */
  async getTableDataPaginated(tableName, options = {}) {
    try {
      const { pageSize = 50, page = 1, ...otherOptions } = options;
      const offset = (page - 1) * pageSize;

      const result = await this.getTableData(tableName, {
        ...otherOptions,
        limit: pageSize,
        offset
      });

      return {
        ...result,
        currentPage: page,
        pageSize,
        totalPages: result.hasMore ? page + 1 : page // Estimativa
      };

    } catch (error) {
      console.error('❌ Erro na busca paginada:', error);
      throw error;
    }
  }

  /**
   * Utilitário para formatar dados de resposta
   */
  formatResponse(response, defaultData = []) {
    return {
      success: response?.success || false,
      data: response?.data || defaultData,
      count: response?.count || 0,
      error: response?.error || null,
      hasMore: response?.hasMore || false
    };
  }

  /**
   * Valida se uma tabela existe
   */
  async tableExists(tableName) {
    try {
      const tables = await this.getTables();
      const tableNames = tables.data.map(table => table.name.toUpperCase());
      return tableNames.includes(tableName.toUpperCase());

    } catch (error) {
      console.error('❌ Erro ao verificar existência da tabela:', error);
      return false;
    }
  }

  /**
   * Obtém informações resumidas do banco
   */
  async getDatabaseInfo() {
    try {
      console.log('ℹ️ Obtendo informações do banco...');

      const [connectionTest, tables] = await Promise.all([
        this.testConnection(),
        this.getTables()
      ]);

      return {
        connection: connectionTest,
        tablesCount: tables.count,
        tables: tables.data?.slice(0, 10) || [], // Primeiras 10 tabelas
        hasMoreTables: tables.count > 10
      };

    } catch (error) {
      console.error('❌ Erro ao obter informações do banco:', error);
      throw new Error(`Erro ao obter informações do banco: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const firebirdService = new FirebirdService();
export default firebirdService;