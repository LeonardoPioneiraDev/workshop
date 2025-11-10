-- Ajustar tamanhos de VARCHAR para comportar dados do Oracle
-- Executar no PostgreSQL

ALTER TABLE manutencao_ordem_servico 
  ALTER COLUMN prefixo_veiculo TYPE varchar(50),
  ALTER COLUMN placa_veiculo TYPE varchar(50),
  ALTER COLUMN condicao_veiculo TYPE varchar(100),
  ALTER COLUMN data_abertura TYPE varchar(50),
  ALTER COLUMN data_fechamento TYPE varchar(50),
  ALTER COLUMN hora_abertura TYPE varchar(50),
  ALTER COLUMN tipo_os_descricao TYPE varchar(100),
  ALTER COLUMN tipo_os TYPE varchar(50),
  ALTER COLUMN condicao_os_descricao TYPE varchar(100),
  ALTER COLUMN condicao_os TYPE varchar(50),
  ALTER COLUMN usuario_abertura TYPE varchar(200),
  ALTER COLUMN eh_socorro TYPE varchar(50);

-- Adicionar comentário
COMMENT ON TABLE manutencao_ordem_servico IS 'Tabela de ordens de serviço sincronizada do Oracle - Campos ajustados para comportar valores maiores';
