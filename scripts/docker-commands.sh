#!/bin/bash

# ==========================================
# 🐳 WORKSHOP - COMANDOS DOCKER
# ==========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Função para build completo
build_all() {
    log "🚀 Iniciando build completo do Workshop..."
    
    # Limpar containers e imagens antigas
    log "�� Limpando containers antigos..."
    docker-compose down --remove-orphans || true
    docker system prune -f
    
    # Build das imagens
    log "🔨 Construindo imagens..."
    docker-compose build --no-cache
    
    log "✅ Build completo finalizado!"
}

# Função para iniciar em produção
start_production() {
    log "🚀 Iniciando Workshop em modo produção..."
    
    docker-compose up -d
    
    log "⏳ Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar health checks
    log "🏥 Verificando health checks..."
    docker-compose ps
    
    log "✅ Workshop iniciado em produção!"
    log "🌐 Frontend: http://10.10.100.176:3001"
    log "🚀 Backend: http://10.10.100.176:3333"
    log "📚 API Docs: http://10.10.100.176:3333/api"
    log "🗄️ PostgreSQL: localhost:5433"
}

# Função para iniciar em desenvolvimento
start_development() {
    log "🛠️ Iniciando Workshop em modo desenvolvimento..."
    
    docker-compose -f docker-compose.dev.yml up -d
    
    log "⏳ Aguardando serviços ficarem prontos..."
    sleep 20
    
    log "✅ Workshop iniciado em desenvolvimento!"
    log "🌐 Frontend: http://localhost:3001"
    log "�� Backend: http://localhost:3333"
    log "🐛 Debug: localhost:9229"
}

# Função para parar todos os serviços
stop_all() {
    log "🛑 Parando todos os serviços..."
    
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    
    log "✅ Todos os serviços parados!"
}

# Função para logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        log "📋 Mostrando logs de todos os serviços..."
        docker-compose logs -f
    else
        log "📋 Mostrando logs do serviço: $service"
        docker-compose logs -f "$service"
    fi
}

# Função para status
show_status() {
    log "📊 Status dos serviços:"
    docker-compose ps
    
    log "💾 Uso de volumes:"
    docker volume ls | grep workshop
    
    log "🌐 Redes:"
    docker network ls | grep workshop
}

# Função para limpeza completa
clean_all() {
    warn "⚠️ Esta operação irá remover TODOS os dados do Workshop!"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "�� Iniciando limpeza completa..."
        
        # Parar todos os serviços
        docker-compose down -v --remove-orphans
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        
        # Remover imagens
        docker rmi $(docker images | grep workshop | awk '{print $3}') 2>/dev/null || true
        
        # Remover volumes
        docker volume rm $(docker volume ls | grep workshop | awk '{print $2}') 2>/dev/null || true
        
        # Remover redes
        docker network rm $(docker network ls | grep workshop | awk '{print $2}') 2>/dev/null || true
        
        # Limpeza geral
        docker system prune -af --volumes
        
        log "✅ Limpeza completa finalizada!"
    else
        log "❌ Limpeza cancelada."
    fi
}

# Função para backup
backup_data() {
    local backup_dir="./backups/$(date +'%Y%m%d_%H%M%S')"
    
    log "💾 Criando backup em: $backup_dir"
    mkdir -p "$backup_dir"
    
    # Backup do banco
    log "🗄️ Fazendo backup do PostgreSQL..."
    docker-compose exec -T postgres pg_dump -U workshop workshop_db > "$backup_dir/workshop_db.sql"
    
    # Backup dos volumes
    log "📁 Fazendo backup dos volumes..."
    docker run --rm -v workshop_backend_logs:/data -v $(pwd)/$backup_dir:/backup alpine tar czf /backup/backend_logs.tar.gz -C /data .
    docker run --rm -v workshop_backend_uploads:/data -v $(pwd)/$backup_dir:/backup alpine tar czf /backup/backend_uploads.tar.gz -C /data .
    
    log "✅ Backup criado em: $backup_dir"
}

# Função para restaurar backup
restore_data() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        error "❌ Especifique o diretório do backup!"
        echo "Uso: $0 restore <diretório_do_backup>"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        error "❌ Diretório de backup não encontrado: $backup_dir"
        exit 1
    fi
    
    warn "⚠️ Esta operação irá sobrescrever os dados atuais!"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "🔄 Restaurando backup de: $backup_dir"
        
        # Restaurar banco
        if [ -f "$backup_dir/workshop_db.sql" ]; then
            log "🗄️ Restaurando PostgreSQL..."
            docker-compose exec -T postgres psql -U workshop -d workshop_db < "$backup_dir/workshop_db.sql"
        fi
        
        # Restaurar volumes
        if [ -f "$backup_dir/backend_logs.tar.gz" ]; then
            log "📁 Restaurando logs..."
            docker run --rm -v workshop_backend_logs:/data -v $(pwd)/$backup_dir:/backup alpine tar xzf /backup/backend_logs.tar.gz -C /data
        fi
        
        if [ -f "$backup_dir/backend_uploads.tar.gz" ]; then
            log "📁 Restaurando uploads..."
            docker run --rm -v workshop_backend_uploads:/data -v $(pwd)/$backup_dir:/backup alpine tar xzf /backup/backend_uploads.tar.gz -C /data
        fi
        
        log "✅ Backup restaurado com sucesso!"
    else
        log "❌ Restauração cancelada."
    fi
}

# Menu principal
case "$1" in
    "build")
        build_all
        ;;
    "start"|"up")
        start_production
        ;;
    "dev")
        start_development
        ;;
    "stop"|"down")
        stop_all
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status"|"ps")
        show_status
        ;;
    "clean")
        clean_all
        ;;
    "backup")
        backup_data
        ;;
    "restore")
        restore_data "$2"
        ;;
    "restart")
        stop_all
        sleep 5
        start_production
        ;;
    "restart-dev")
        docker-compose -f docker-compose.dev.yml down
        sleep 5
        start_development
        ;;
    *)
        echo "🐳 Workshop Docker Commands"
        echo ""
        echo "Uso: $0 <comando> [opções]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  build          - Construir todas as imagens"
        echo "  start|up       - Iniciar em produção"
        echo "  dev            - Iniciar em desenvolvimento"
        echo "  stop|down      - Parar todos os serviços"
        echo "  restart        - Reiniciar em produção"
        echo "  restart-dev    - Reiniciar em desenvolvimento"
        echo "  logs [serviço] - Mostrar logs (opcional: especificar serviço)"
        echo "  status|ps      - Mostrar status dos serviços"
        echo "  backup         - Criar backup dos dados"
        echo "  restore <dir>  - Restaurar backup"
        echo "  clean          - Limpeza completa (CUIDADO!)"
        echo ""
        echo "Exemplos:"
        echo "  $0 build"
        echo "  $0 start"
        echo "  $0 dev"
        echo "  $0 logs backend"
        echo "  $0 backup"
        echo "  $0 restore ./backups/20241201_120000"
        ;;
esac