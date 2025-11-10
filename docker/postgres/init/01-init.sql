-- ==========================================
-- Ì∑ÑÔ∏è INICIALIZA√á√ÉO DO BANCO WORKSHOP
-- ==========================================

-- Criar extens√µes √∫teis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar schema se n√£o existir
CREATE SCHEMA IF NOT EXISTS public;

-- Garantir permiss√µes
GRANT ALL PRIVILEGES ON DATABASE workshop_db TO workshop;
GRANT ALL PRIVILEGES ON SCHEMA public TO workshop;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workshop;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workshop;

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Log de inicializa√ß√£o
DO $$
BEGIN
    RAISE NOTICE '‚úÖ Database workshop_db initialized successfully!';
    RAISE NOTICE 'Ì≥Ö Timezone: %', current_setting('timezone');
    RAISE NOTICE 'Ì¥ß Extensions: uuid-ossp, pgcrypto';
    RAISE NOTICE 'Ì±§ User: workshop';
    RAISE NOTICE 'Ì∑ÑÔ∏è Database: workshop_db';
END $$;
