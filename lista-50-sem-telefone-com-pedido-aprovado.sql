-- 📋 LISTA: 50 Clientes SEM TELEFONE mas COM PEDIDO APROVADO
-- Para verificar no ERP

SELECT
    pc.id as id_prime,
    pc.nome,
    pc.email,
    pc.cpf_cnpj,
    pc.telefone,
    COUNT(DISTINCT pp.id) as total_pedidos_aprovados,
    MIN(pp.data_criacao) as primeira_compra,
    MAX(pp.data_criacao) as ultima_compra,
    SUM(pp.valor_total) as valor_total_comprado,
    STRING_AGG(DISTINCT pp.codigo_orcamento_original::text, ', ' ORDER BY pp.codigo_orcamento_original::text) as codigos_orcamento
FROM api.prime_clientes pc
INNER JOIN api.prime_pedidos pp ON pc.id = pp.cliente_id
WHERE pc.ativo = true
AND (pc.telefone IS NULL OR pc.telefone = '')
AND pp.status_aprovacao = 'APROVADO'
GROUP BY pc.id, pc.nome, pc.email, pc.cpf_cnpj, pc.telefone
ORDER BY MAX(pp.data_criacao) DESC
LIMIT 50;
