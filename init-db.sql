-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS oracle_cache;

-- Usar o schema criado
SET search_path TO oracle_cache;

-- Tabela para armazenar metadados das consultas
CREATE TABLE IF NOT EXISTS query_cache (
    id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64) UNIQUE NOT NULL,
    query_text TEXT NOT NULL,
    parameters JSONB,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_query_hash ON query_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_created_at ON query_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_expires_at ON query_cache(expires_at);

-- Tabela para log de consultas
CREATE TABLE IF NOT EXISTS query_log (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    parameters JSONB,
    execution_time_ms INTEGER,
    rows_returned INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar automaticamente o updated_at
CREATE TRIGGER update_query_cache_updated_at 
BEFORE UPDATE ON query_cache 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Criar usuário específico para a aplicação (opcional)
-- CREATE USER app_user WITH PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON SCHEMA oracle_cache TO app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA oracle_cache TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA oracle_cache TO app_user;