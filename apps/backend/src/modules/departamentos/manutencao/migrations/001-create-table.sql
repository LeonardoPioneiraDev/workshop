-- Script SQL para criar tabela manutencao_ordem_servico
-- Executar no PostgreSQL: docker exec -it workshop-postgres psql -U workshop -d workshop_db -f <caminho_do_arquivo>

-- Criar tabela manutencao_ordem_servico
CREATE TABLE IF NOT EXISTS manutencao_ordem_servico (
  codigo_interno_os INTEGER PRIMARY KEY,
  numero_os VARCHAR(50) NOT NULL,
  codigo_veiculo INTEGER NOT NULL,
  codigo_garagem INTEGER NOT NULL,
  prefixo_veiculo VARCHAR(20),
  placa_veiculo VARCHAR(20),
  condicao_veiculo VARCHAR(50),
  data_abertura VARCHAR(20),
  data_fechamento VARCHAR(20),
  hora_abertura VARCHAR(20),
  tipo_os_descricao VARCHAR(50),
  tipo_os VARCHAR(10),
  condicao_os_descricao VARCHAR(50),
  condicao_os VARCHAR(10),
  codigo_origem_os INTEGER,
  usuario_abertura VARCHAR(100),
  descricao_origem VARCHAR(255),
  descricao_servico TEXT,
  codigo_setor INTEGER,
  codigo_grupo_servico INTEGER,
  grupo_servico VARCHAR(255),
  garagem VARCHAR(100),
  tipo_problema VARCHAR(50),
  dias_em_andamento DECIMAL(10, 2),
  km_execucao DECIMAL(10, 2),
  valor_mao_obra_terceiros DECIMAL(12, 2) DEFAULT 0,
  valor_pecas_terceiros DECIMAL(12, 2) DEFAULT 0,
  eh_socorro VARCHAR(20),
  data_sincronizacao DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar comentários nas colunas
COMMENT ON TABLE manutencao_ordem_servico IS 'Tabela de Ordens de Serviço de Manutenção';
COMMENT ON COLUMN manutencao_ordem_servico.codigo_interno_os IS 'Código interno da OS no sistema Globus';
COMMENT ON COLUMN manutencao_ordem_servico.numero_os IS 'Número da Ordem de Serviço';
COMMENT ON COLUMN manutencao_ordem_servico.codigo_veiculo IS 'Código do veículo';
COMMENT ON COLUMN manutencao_ordem_servico.codigo_garagem IS 'Código da garagem';
COMMENT ON COLUMN manutencao_ordem_servico.prefixo_veiculo IS 'Prefixo do veículo';
COMMENT ON COLUMN manutencao_ordem_servico.placa_veiculo IS 'Placa do veículo';
COMMENT ON COLUMN manutencao_ordem_servico.condicao_veiculo IS 'Condição do veículo (Ativo, Inativo)';
COMMENT ON COLUMN manutencao_ordem_servico.data_abertura IS 'Data de abertura da OS (DD/MM/YYYY)';
COMMENT ON COLUMN manutencao_ordem_servico.data_fechamento IS 'Data de fechamento da OS (DD/MM/YYYY)';
COMMENT ON COLUMN manutencao_ordem_servico.hora_abertura IS 'Hora de abertura da OS';
COMMENT ON COLUMN manutencao_ordem_servico.tipo_os_descricao IS 'Descrição do tipo de OS (Corretiva, Preventiva)';
COMMENT ON COLUMN manutencao_ordem_servico.tipo_os IS 'Código do tipo de OS';
COMMENT ON COLUMN manutencao_ordem_servico.condicao_os_descricao IS 'Descrição da condição da OS (Aberta, Fechada)';
COMMENT ON COLUMN manutencao_ordem_servico.condicao_os IS 'Código da condição da OS';
COMMENT ON COLUMN manutencao_ordem_servico.codigo_origem_os IS 'Código da origem da OS';
COMMENT ON COLUMN manutencao_ordem_servico.usuario_abertura IS 'Usuário que abriu a OS';
COMMENT ON COLUMN manutencao_ordem_servico.descricao_origem IS 'Descrição da origem da OS';
COMMENT ON COLUMN manutencao_ordem_servico.descricao_servico IS 'Descrição do serviço realizado';
COMMENT ON COLUMN manutencao_ordem_servico.codigo_setor IS 'Código do setor';
COMMENT ON COLUMN manutencao_ordem_servico.codigo_grupo_servico IS 'Código do grupo de serviço';
COMMENT ON COLUMN manutencao_ordem_servico.grupo_servico IS 'Descrição do grupo de serviço';
COMMENT ON COLUMN manutencao_ordem_servico.garagem IS 'Nome da garagem';
COMMENT ON COLUMN manutencao_ordem_servico.tipo_problema IS 'Tipo de problema (QUEBRA, DEFEITO)';
COMMENT ON COLUMN manutencao_ordem_servico.dias_em_andamento IS 'Dias em andamento da OS';
COMMENT ON COLUMN manutencao_ordem_servico.km_execucao IS 'Quilometragem na execução';
COMMENT ON COLUMN manutencao_ordem_servico.valor_mao_obra_terceiros IS 'Valor da mão de obra de terceiros';
COMMENT ON COLUMN manutencao_ordem_servico.valor_pecas_terceiros IS 'Valor de peças de terceiros';
COMMENT ON COLUMN manutencao_ordem_servico.eh_socorro IS 'Indica se é socorro (Sim/Não)';
COMMENT ON COLUMN manutencao_ordem_servico.data_sincronizacao IS 'Data da sincronização dos dados';
COMMENT ON COLUMN manutencao_ordem_servico.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN manutencao_ordem_servico.updated_at IS 'Data de atualização do registro';

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_manutencao_os_numero ON manutencao_ordem_servico(numero_os);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_veiculo ON manutencao_ordem_servico(codigo_veiculo);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_garagem ON manutencao_ordem_servico(codigo_garagem);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_prefixo ON manutencao_ordem_servico(prefixo_veiculo);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_placa ON manutencao_ordem_servico(placa_veiculo);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_tipo ON manutencao_ordem_servico(tipo_os);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_condicao ON manutencao_ordem_servico(condicao_os);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_data_abertura ON manutencao_ordem_servico(data_abertura);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_data_sincronizacao ON manutencao_ordem_servico(data_sincronizacao);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_garagem_nome ON manutencao_ordem_servico(garagem);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_manutencao_os_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_manutencao_os_updated_at ON manutencao_ordem_servico;
CREATE TRIGGER trigger_update_manutencao_os_updated_at
  BEFORE UPDATE ON manutencao_ordem_servico
  FOR EACH ROW
  EXECUTE FUNCTION update_manutencao_os_updated_at();

-- Mensagem de sucesso
SELECT '✅ Tabela manutencao_ordem_servico criada com sucesso!' as status;
SELECT '✅ Índices criados com sucesso!' as status;
SELECT '✅ Trigger de atualização criado com sucesso!' as status;
