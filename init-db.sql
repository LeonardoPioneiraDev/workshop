-- ==========================================
-- 🗄️ WORKSHOP DATABASE - INICIALIZAÇÃO
-- ==========================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Garantir permissões
GRANT ALL PRIVILEGES ON SCHEMA public TO workshop;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workshop;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workshop;

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE '🚀 Workshop Database inicializado com sucesso!';
    RAISE NOTICE '📅 Timestamp: %', NOW();
    RAISE NOTICE '🌍 Timezone: %', current_setting('timezone');
    RAISE NOTICE '👤 Usuário: workshop';
    RAISE NOTICE '🗄️ Database: workshop_db';
END $$;