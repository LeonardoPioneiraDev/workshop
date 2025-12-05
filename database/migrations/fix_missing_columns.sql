-- Script para verificar e adicionar colunas faltantes na tabela dept_pessoal_snapshot
-- Execute este script no PostgreSQL

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'workshop' 
  AND table_name = 'dept_pessoal_snapshot'
ORDER BY ordinal_position;

-- 2. Adicionar colunas que podem estar faltando (se não existirem)
ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS dtcompetquita DATE;

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS idquita VARCHAR(50);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS dtdesligquita DATE;

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS valerefeicfunc VARCHAR(1);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS dttransffunc DATE;

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS descsecao VARCHAR(255);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS descsetor VARCHAR(255);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS endereco VARCHAR(255);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS casa VARCHAR(50);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS fonefunc VARCHAR(20);

ALTER TABLE workshop.dept_pessoal_snapshot 
ADD COLUMN IF NOT EXISTS fone2func VARCHAR(20);

-- 3. Verificar novamente para confirmar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'workshop' 
  AND table_name = 'dept_pessoal_snapshot'
ORDER BY ordinal_position;
