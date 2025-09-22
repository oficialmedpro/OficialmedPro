import bcrypt from 'bcryptjs';

/**
 * Utilitários para hash de senhas
 */

/**
 * Gera hash de uma senha
 * @param {string} password - Senha em texto plano
 * @param {number} rounds - Número de rounds do bcrypt (padrão: 10)
 * @returns {Promise<string>} Hash da senha
 */
export const hashPassword = async (password, rounds = 10) => {
  return await bcrypt.hash(password, rounds);
};

/**
 * Verifica se uma senha corresponde ao hash
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash da senha
 * @returns {Promise<boolean>} True se a senha estiver correta
 */
export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Gera senhas hash para usuários de teste
 * Use este script para atualizar senhas no banco de dados
 */
export const generateTestPasswords = async () => {
  const passwords = {
    'admin': 'admin123',
    'vendedor.teste': 'vendedor123',
    'oficialmedPRO': 'Oficial07@@pro'
  };

  console.log('🔐 Gerando hashes para senhas de teste:');
  console.log('=====================================');
  
  for (const [username, password] of Object.entries(passwords)) {
    const hash = await hashPassword(password);
    console.log(`\nUsuário: ${username}`);
    console.log(`Senha: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(`SQL: UPDATE api.users SET password_hash = '${hash}' WHERE username = '${username}';`);
  }
  
  console.log('\n=====================================');
  console.log('✅ Execute os comandos SQL no Supabase para atualizar as senhas');
};

// Se executado diretamente, gera as senhas
if (typeof window === 'undefined') {
  generateTestPasswords().catch(console.error);
}
