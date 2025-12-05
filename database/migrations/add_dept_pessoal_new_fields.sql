-- SQL para adicionar novos campos na tabela dept_pessoal_snapshot
-- Execute este script no PostgreSQL

-- 1. Adicionar coluna DATA_AFASTAMENTO
ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS data_afastamento DATE;

-- 2. Adicionar coluna CID_MEDICO
ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS cid_medico VARCHAR(10);

-- 3. Adicionar coluna DESCRICAO_CID
ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS descricao_cid VARCHAR(255);

-- 4. Adicionar comentários nas colunas
COMMENT ON COLUMN workshop.dept_pessoal_snapshot.data_afastamento IS 'Data do afastamento mais recente do funcionário';
COMMENT ON COLUMN workshop.dept_pessoal_snapshot.cid_medico IS 'Código CID do afastamento';
COMMENT ON COLUMN workshop.dept_pessoal_snapshot.descricao_cid IS 'Descrição do CID médico';

-- 5. Verificar se as colunas foram criadas
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'workshop' 
  AND table_name = 'dept_pessoal_snapshot'
  AND column_name IN ('data_afastamento', 'cid_medico', 'descricao_cid')
ORDER BY ordinal_position;
