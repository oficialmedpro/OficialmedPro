/**
 * Script para testar conexão com o banco de dados do Typebot
 * 
 * Uso:
 *   npm install pg
 *   node scripts/test-typebot-connection.js
 * 
 * Ou se já tiver pg instalado globalmente:
 *   node scripts/test-typebot-connection.js
 */

// Verificar se pg está instalado
import pg from 'pg';
const { Client } = pg;

// Configurações do banco de dados
const config = {
  host: '72.60.61.40',
  port: 5432,
  user: 'postgres',
  password: '9acf019d669f6ab91d86',
  database: 'typebot',
  // Opções de conexão
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
};

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados Typebot...\n');
  console.log('Configurações:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}\n`);

  const client = new Client(config);

  try {
    console.log('⏳ Tentando conectar...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar query simples
    console.log('📊 Testando query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query executada com sucesso!');
    console.log(`   Versão do PostgreSQL: ${result.rows[0].version}\n`);

    // Listar tabelas
    console.log('📋 Listando tabelas do banco...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Tabelas encontradas:');
      tables.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada no schema public');
    }

    // Verificar tabelas do Typebot especificamente
    console.log('\n🔍 Verificando tabelas do Typebot...');
    const typebotTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%Typebot%' OR table_name LIKE '%typebot%')
      ORDER BY table_name
    `);
    
    if (typebotTables.rows.length > 0) {
      console.log('✅ Tabelas do Typebot encontradas:');
      typebotTables.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }

    // Contar registros em algumas tabelas principais
    console.log('\n📊 Estatísticas do banco:');
    try {
      const typebotCount = await client.query('SELECT COUNT(*) as count FROM "Typebot"');
      console.log(`   Typebots: ${typebotCount.rows[0].count}`);
    } catch (e) {
      console.log('   Typebots: Tabela não encontrada');
    }

    try {
      const publicTypebotCount = await client.query('SELECT COUNT(*) as count FROM "PublicTypebot"');
      console.log(`   Public Typebots: ${publicTypebotCount.rows[0].count}`);
    } catch (e) {
      console.log('   Public Typebots: Tabela não encontrada');
    }

    console.log('\n✅ Teste completo! O banco está acessível e funcionando.\n');
    console.log('💡 Você pode usar essas configurações no NocoDB:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Username: ${config.user}`);
    console.log(`   Password: ${config.password}`);
    console.log(`   Database: ${config.database}`);

  } catch (error) {
    console.error('\n❌ Erro ao conectar ao banco de dados:\n');
    console.error('Mensagem:', error.message);
    console.error('\nDetalhes do erro:');
    
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possíveis causas:');
      console.error('   1. Porta não está exposta no EasyPanel');
      console.error('   2. PostgreSQL não está escutando em todas as interfaces');
      console.error('   3. Firewall bloqueando a conexão');
      console.error('   4. Serviço não está rodando');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Possíveis causas:');
      console.error('   1. Firewall bloqueando a conexão');
      console.error('   2. IP incorreto');
      console.error('   3. Rede não acessível');
    } else if (error.code === '28P01') {
      console.error('\n💡 Possíveis causas:');
      console.error('   1. Senha incorreta');
      console.error('   2. Usuário não existe');
    } else if (error.code === '3D000') {
      console.error('\n💡 Possíveis causas:');
      console.error('   1. Banco de dados não existe');
      console.error('   2. Nome do banco incorreto');
    }

    console.error('\n📚 Consulte o guia: docs/CONECTAR_TYPEBOT_NOCODB.md');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar teste
testConnection().catch(console.error);

