// Teste direto da conexão Firebird
import Firebird from 'node-firebird';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const firebirdConfig = {
  host: process.env.FIREBIRD_HOST || 'localhost',
  port: parseInt(process.env.FIREBIRD_PORT) || 3050,
  database: 'psbd.FDB', // Banco principal
  user: process.env.FIREBIRD_USER || 'OFICIALMED-TESTE',
  password: process.env.FIREBIRD_PASSWORD || 'OficialmEd07@',
  lowercase_keys: false,
  role: null,
  pageSize: 4096,
  charset: process.env.FIREBIRD_CHARSET || 'WIN1252'
};

console.log('🔥 Testando conexão direta com Firebird...');
console.log('📊 Configuração:', firebirdConfig);

Firebird.attach(firebirdConfig, (err, db) => {
  if (err) {
    console.error('❌ Erro ao conectar com Firebird:', err);
    return;
  }

  console.log('✅ Conexão estabelecida com sucesso!');
  
  // Testar uma query simples
  db.query('SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE', (err, result) => {
    if (err) {
      console.error('❌ Erro na query:', err);
    } else {
      console.log('🎉 Query executada com sucesso!');
      console.log('📅 Hora do servidor:', result[0].CURRENT_TIMESTAMP);
      
      // Listar tabelas do sistema
      db.query('SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG = 0', (err, tables) => {
        if (err) {
          console.error('❌ Erro ao listar tabelas:', err);
        } else {
          console.log('📋 Tabelas encontradas:', tables.length);
          tables.slice(0, 10).forEach(table => {
            console.log('  -', table.RDB$RELATION_NAME.trim());
          });
        }
      });
    }
    
    // Fechar conexão
    db.detach((err) => {
      if (err) {
        console.error('⚠️ Erro ao fechar conexão:', err);
      } else {
        console.log('🔚 Conexão fechada');
      }
    });
  });
});
