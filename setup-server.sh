#!/bin/bash

# Script de Configuração Inicial do Servidor
# Execute este script no servidor de produção ANTES do primeiro deploy

set -e

echo "🚀 Configurando servidor para Agendei..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se é root ou sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}⚠️  Este script precisa ser executado com sudo${NC}"
   exit 1
fi

# 1. Atualizar sistema
echo -e "${BLUE}📦 Atualizando sistema...${NC}"
apt-get update
apt-get upgrade -y

# 2. Instalar dependências básicas
echo -e "${BLUE}📦 Instalando dependências...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw

# 3. Instalar Docker
echo -e "${BLUE}🐳 Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Adicionar usuário atual ao grupo docker
    if [ -n "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        echo -e "${GREEN}✅ Usuário $SUDO_USER adicionado ao grupo docker${NC}"
    fi
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

# 4. Instalar Docker Compose
echo -e "${BLUE}🐳 Instalando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose ${COMPOSE_VERSION} instalado${NC}"
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

# 5. Configurar Firewall
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload
echo -e "${GREEN}✅ Firewall configurado${NC}"

# 6. Criar diretório do projeto
echo -e "${BLUE}📁 Criando estrutura de diretórios...${NC}"
PROJECT_DIR="/home/$SUDO_USER/agendei"
mkdir -p $PROJECT_DIR
chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR

# 7. Instalar Certbot (Let's Encrypt)
echo -e "${BLUE}🔐 Instalando Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot
    echo -e "${GREEN}✅ Certbot instalado${NC}"
else
    echo -e "${GREEN}✅ Certbot já instalado${NC}"
fi

# 8. Configurar swap (se não existir)
if [ ! -f /swapfile ]; then
    echo -e "${BLUE}💾 Criando swap de 2GB...${NC}"
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    echo -e "${GREEN}✅ Swap criado${NC}"
else
    echo -e "${GREEN}✅ Swap já configurado${NC}"
fi

# 9. Otimizações do sistema
echo -e "${BLUE}⚙️  Aplicando otimizações...${NC}"
cat >> /etc/sysctl.conf << EOF

# Otimizações para aplicações web
vm.swappiness=10
net.ipv4.tcp_fin_timeout=30
net.ipv4.tcp_keepalive_time=1200
net.core.somaxconn=4096
net.ipv4.tcp_max_syn_backlog=8096
EOF
sysctl -p

# 10. Criar script de backup
echo -e "${BLUE}💾 Criando script de backup...${NC}"
cat > /usr/local/bin/backup-agendei.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/backup/agendei"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec agendei-postgres pg_dump -U agendei agendei > $BACKUP_DIR/db_backup_$DATE.sql

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "db_backup_*.sql" -type f -mtime +7 -delete

echo "✅ Backup concluído: $BACKUP_DIR/db_backup_$DATE.sql"
BACKUP_EOF

chmod +x /usr/local/bin/backup-agendei.sh

# Adicionar ao cron (backup diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-agendei.sh") | crontab -

echo ""
echo -e "${GREEN}✅ Configuração concluída com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. Configure os secrets no GitHub Actions (veja DEPLOY_SECRETS.md)"
echo "2. Configure o DNS apontando para este servidor"
echo "3. Execute o workflow de deploy no GitHub"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Faça logout e login novamente para aplicar as permissões do Docker${NC}"
echo ""
echo -e "${BLUE}📊 Informações do servidor:${NC}"
echo "   IP: $(curl -s ifconfig.me)"
echo "   Docker: $(docker --version)"
echo "   Docker Compose: $(docker-compose --version)"
echo "   Diretório do projeto: $PROJECT_DIR"
echo ""
echo -e "${GREEN}🎉 Servidor pronto para receber o deploy!${NC}"
