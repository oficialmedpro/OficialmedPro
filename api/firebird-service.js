import Firebird from 'node-firebird';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Configuração do Firebird baseada no seu docker-compose
 */
const firebirdConfig = {
  host: process.env.FIREBIRD_HOST || 'localhost',
  port: parseInt(process.env.FIREBIRD_PORT) || 3050,
  database: process.env.FIREBIRD_DATABASE || 'psbd.FDB',
  user: process.env.FIREBIRD_USER || 'OFICIALMED-TESTE',
  password: process.env.FIREBIRD_PASSWORD || 'OficialmEd07@',
  lowercase_keys: false, // Manter nomes originais das colunas
  role: null,
  pageSize: 4096,
  charset: process.env.FIREBIRD_CHARSET || 'WIN1252',
  // Configuração para Firebird 3.0
  wireCrypt: 'DISABLED',
  connectionTimeout: 30,
  // Forçar protocolo antigo
  protocol: 'TCP'
};

class FirebirdService {
  constructor() {
    this.connectionPool = [];
    this.maxConnections = 5;
    console.log('🔥 FirebirdService inicializado');
    console.log('📊 Configuração:', {
      host: firebirdConfig.host,
      port: firebirdConfig.port,
      database: firebirdConfig.database,
      user: firebirdConfig.user,
      charset: firebirdConfig.charset
    });
  }

  /**
   * Cria uma nova conexão com o Firebird
   */
  createConnection() {
    return new Promise((resolve, reject) => {
      console.log('🔗 Criando nova conexão Firebird...');

      Firebird.attach(firebirdConfig, (err, db) => {
        if (err) {
          console.error('❌ Erro ao conectar com Firebird:', err);
          reject(err);
          return;
        }

        console.log('✅ Conexão Firebird estabelecida');
        resolve(db);
      });
    });
  }

  /**
   * Executa uma query no Firebird
   */
  async executeQuery(sql, params = []) {
    let db = null;

    try {
      console.log('🔍 Executando query:', sql.substring(0, 100) + '...');
      console.log('📋 Parâmetros:', params);

      db = await this.createConnection();

      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
          if (err) {
            console.error('❌ Erro na query:', err);
            reject(err);
            return;
          }

          console.log(`✅ Query executada com sucesso - ${result.length} registros`);
          resolve(result);
        });
      });

    } catch (error) {
      console.error('❌ Erro ao executar query:', error);
      throw error;
    } finally {
      // Fechar conexão
      if (db) {
        try {
          db.detach((err) => {
            if (err) console.error('⚠️ Erro ao fechar conexão:', err);
            else console.log('🔚 Conexão Firebird fechada');
          });
        } catch (closeError) {
          console.error('⚠️ Erro ao fechar conexão:', closeError);
        }
      }
    }
  }

  /**
   * Testa a conexão com o banco
   */
  async testConnection() {
    try {
      console.log('🧪 Testando conexão Firebird...');

      const result = await this.executeQuery('SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE');

      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        serverTime: result[0].CURRENT_TIMESTAMP,
        config: {
          host: firebirdConfig.host,
          port: firebirdConfig.port,
          database: firebirdConfig.database,
          user: firebirdConfig.user,
          charset: firebirdConfig.charset
        }
      };

    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return {
        success: false,
        error: error.message,
        config: {
          host: firebirdConfig.host,
          port: firebirdConfig.port,
          database: firebirdConfig.database,
          user: firebirdConfig.user,
          charset: firebirdConfig.charset
        }
      };
    }
  }

  /**
   * Lista todas as tabelas do banco
   */
  async listTables() {
    try {
      console.log('📋 Listando tabelas do banco...');

      const query = `
        SELECT
          RDB$RELATION_NAME as TABLE_NAME,
          RDB$SYSTEM_FLAG as IS_SYSTEM_TABLE
        FROM RDB$RELATIONS
        WHERE RDB$VIEW_BLR IS NULL
          AND RDB$SYSTEM_FLAG = 0
        ORDER BY RDB$RELATION_NAME
      `;

      const result = await this.executeQuery(query);

      const tables = result.map(row => ({
        name: row.TABLE_NAME.trim(),
        isSystemTable: row.IS_SYSTEM_TABLE === 1
      }));

      console.log(`✅ ${tables.length} tabelas encontradas`);
      return tables;

    } catch (error) {
      console.error('❌ Erro ao listar tabelas:', error);
      throw error;
    }
  }

  /**
   * Descreve a estrutura de uma tabela
   */
  async describeTable(tableName) {
    try {
      console.log(`📋 Descrevendo tabela: ${tableName}`);

      const query = `
        SELECT
          r.RDB$FIELD_NAME as FIELD_NAME,
          r.RDB$FIELD_POSITION as FIELD_POSITION,
          f.RDB$FIELD_TYPE as FIELD_TYPE,
          f.RDB$FIELD_SUB_TYPE as FIELD_SUB_TYPE,
          f.RDB$FIELD_LENGTH as FIELD_LENGTH,
          f.RDB$FIELD_PRECISION as FIELD_PRECISION,
          f.RDB$FIELD_SCALE as FIELD_SCALE,
          r.RDB$NULL_FLAG as NOT_NULL,
          r.RDB$DEFAULT_SOURCE as DEFAULT_VALUE
        FROM RDB$RELATION_FIELDS r
        LEFT JOIN RDB$FIELDS f ON r.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME
        WHERE r.RDB$RELATION_NAME = ?
        ORDER BY r.RDB$FIELD_POSITION
      `;

      const result = await this.executeQuery(query, [tableName.toUpperCase()]);

      const fields = result.map(row => ({
        name: row.FIELD_NAME.trim(),
        position: row.FIELD_POSITION,
        type: this.getFieldTypeName(row.FIELD_TYPE, row.FIELD_SUB_TYPE),
        length: row.FIELD_LENGTH,
        precision: row.FIELD_PRECISION,
        scale: row.FIELD_SCALE,
        notNull: row.NOT_NULL === 1,
        defaultValue: row.DEFAULT_VALUE ? row.DEFAULT_VALUE.trim() : null
      }));

      console.log(`✅ ${fields.length} campos encontrados na tabela ${tableName}`);
      return fields;

    } catch (error) {
      console.error(`❌ Erro ao descrever tabela ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Converte código de tipo do Firebird para nome legível
   */
  getFieldTypeName(fieldType, subType) {
    const typeMap = {
      7: 'SMALLINT',
      8: 'INTEGER',
      9: 'QUAD',
      10: 'FLOAT',
      11: 'D_FLOAT',
      12: 'DATE',
      13: 'TIME',
      14: 'CHAR',
      16: 'BIGINT',
      27: 'DOUBLE',
      35: 'TIMESTAMP',
      37: 'VARCHAR',
      261: subType === 0 ? 'BLOB' : subType === 1 ? 'TEXT BLOB' : 'BLOB'
    };

    return typeMap[fieldType] || `UNKNOWN(${fieldType})`;
  }

  /**
   * Executa uma consulta customizada com paginação
   */
  async customQuery(sql, params = [], options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;

      // Adicionar paginação se necessário
      let finalSql = sql;
      if (limit && limit > 0) {
        finalSql += ` ROWS ${offset + 1} TO ${offset + limit}`;
      }

      const result = await this.executeQuery(finalSql, params);

      return {
        data: result,
        count: result.length,
        hasMore: result.length === limit
      };

    } catch (error) {
      console.error('❌ Erro na consulta customizada:', error);
      throw error;
    }
  }

  /**
   * Busca dados de uma tabela com filtros básicos
   */
  async selectFromTable(tableName, options = {}) {
    try {
      const {
        fields = '*',
        where = '',
        orderBy = '',
        limit = 100,
        offset = 0
      } = options;

      let sql = `SELECT ${fields} FROM ${tableName}`;

      if (where) {
        sql += ` WHERE ${where}`;
      }

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }

      return await this.customQuery(sql, [], { limit, offset });

    } catch (error) {
      console.error(`❌ Erro ao buscar dados da tabela ${tableName}:`, error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const firebirdService = new FirebirdService();
export default firebirdService;