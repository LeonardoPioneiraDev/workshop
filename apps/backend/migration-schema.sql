-- Tabela para dados da MAN_OS
CREATE TABLE IF NOT EXISTS man_os_local (
    id SERIAL PRIMARY KEY,
    codigo_os VARCHAR(50) UNIQUE,
    data_abertura TIMESTAMP,
    data_fechamento TIMESTAMP,
    status VARCHAR(50),
    equipamento VARCHAR(100),
    descricao TEXT,
    execucao_manual BOOLEAN DEFAULT false,
    partner VARCHAR(100),
    usuario_fechamento VARCHAR(100),
    data_recolhida TIMESTAMP,
    
    -- Metadados
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_man_os_codigo ON man_os_local(codigo_os);
CREATE INDEX IF NOT EXISTS idx_man_os_data_abertura ON man_os_local(data_abertura);
CREATE INDEX IF NOT EXISTS idx_man_os_status ON man_os_local(status);
CREATE INDEX IF NOT EXISTS idx_man_os_synced ON man_os_local(synced_at);

-- Tabela de controle de sincronização
CREATE TABLE IF NOT EXISTS etl_control (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    last_sync TIMESTAMP,
    total_records INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'idle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir controle inicial
INSERT INTO etl_control (table_name, last_sync, status) 
VALUES ('man_os', NOW(), 'idle') 
ON CONFLICT DO NOTHING;