-- View SQL para funcionários ativos por departamento
-- Versão corrigida: exclui desligados e conta jovens aprendizes no departamento

CREATE OR REPLACE VIEW workshop.vw_dept_pessoal_ativos_por_categoria AS
SELECT 
    referencia_date,
    CASE 
        -- Manutenção (PRIORIDADE 1)
        WHEN UPPER(departamento) LIKE '%MANUT%' OR UPPER(area) LIKE '%MANUT%' OR UPPER(funcao) LIKE '%MANUT%' THEN 'MANUTENCAO'
        -- Administração (PRIORIDADE 2 - inclui jovens aprendizes deste depto)
        WHEN UPPER(area) = 'GESTAO' OR UPPER(departamento) LIKE '%ADMIN%' THEN 'ADMINISTRACAO'
        -- Jovem Aprendiz (PRIORIDADE 3 - apenas os que não estão em depto específico)
        WHEN (UPPER(funcao) LIKE '%APRENDIZ%' OR UPPER(funcao) LIKE '%JOVEM%')
             AND UPPER(departamento) NOT LIKE '%ADMIN%'
             AND UPPER(departamento) NOT LIKE '%MANUT%' THEN 'JOVEM_APRENDIZ'
        -- Tráfego/Operação (todos os outros)
        ELSE 'TRAFEGO'
    END AS categoria,
    COUNT(*) AS total
FROM workshop.dept_pessoal_snapshot
WHERE situacao = 'A'  -- Apenas ativos
  AND (dtdesligquita IS NULL OR dtdesligquita > referencia_date)  -- Excluir desligados
GROUP BY referencia_date, categoria
ORDER BY referencia_date DESC, categoria;

-- Comentário atualizado
COMMENT ON VIEW workshop.vw_dept_pessoal_ativos_por_categoria IS 'Agregação de funcionários ativos por categoria: Manutenção, Administração (inclui jovens), Jovem Aprendiz (apenas sem depto específico), Tráfego/Operação. Exclui funcionários com data de desligamento.';

-- Testar a view
SELECT * FROM workshop.vw_dept_pessoal_ativos_por_categoria
ORDER BY referencia_date DESC, categoria;
