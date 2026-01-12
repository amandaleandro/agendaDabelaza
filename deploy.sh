#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploy Agendei - Magalu Cloud${NC}\n"

# Verificar se .env.production existe
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Arquivo .env.production não encontrado!${NC}"
    echo -e "${YELLOW}Copie .env.production.example para .env.production e preencha os valores${NC}"
    exit 1
fi

# Carregar variáveis
source .env.production

# Verificar variáveis obrigatórias
if [ -z "$REGISTRY_NAMESPACE" ] || [ -z "$DOMAIN_APP" ] || [ -z "$DOMAIN_API" ]; then
    echo -e "${RED}❌ Variáveis REGISTRY_NAMESPACE, DOMAIN_APP e DOMAIN_API são obrigatórias!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Construindo imagens...${NC}"

# Build Backend
echo -e "${GREEN}Backend...${NC}"
cd backend
docker build -t registry.magalu.cloud/${REGISTRY_NAMESPACE}/agendei-backend:${VERSION} .
docker push registry.magalu.cloud/${REGISTRY_NAMESPACE}/agendei-backend:${VERSION}
cd ..

# Build Frontend
echo -e "${GREEN}Frontend...${NC}"
cd frontend
docker build -t registry.magalu.cloud/${REGISTRY_NAMESPACE}/agendei-frontend:${VERSION} .
docker push registry.magalu.cloud/${REGISTRY_NAMESPACE}/agendei-frontend:${VERSION}
cd ..

echo -e "\n${YELLOW}⚙️  Configurando Nginx...${NC}"

# Substituir domínios no nginx.conf
sed -i "s/DOMAIN_APP/${DOMAIN_APP}/g" nginx.conf
sed -i "s/DOMAIN_API/${DOMAIN_API}/g" nginx.conf

echo -e "\n${YELLOW}🔐 Gerando certificados SSL com Let's Encrypt...${NC}"

# Criar diretório para SSL
mkdir -p ssl

# Iniciar nginx temporário para validação
docker-compose -f docker-compose.production.yml up -d nginx

# Obter certificados
docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/certbot_data:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email seu@email.com \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN_APP} \
  -d ${DOMAIN_API}

echo -e "\n${YELLOW}🔄 Parando containers antigos...${NC}"
docker-compose -f docker-compose.production.yml down

echo -e "\n${YELLOW}🚀 Iniciando aplicação...${NC}"
docker-compose -f docker-compose.production.yml up -d

echo -e "\n${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 10

echo -e "\n${YELLOW}🗄️  Aplicando migrações do banco...${NC}"
docker exec agendei-backend npx prisma migrate deploy

echo -e "\n${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "\n${GREEN}🌐 Acessos:${NC}"
echo -e "   Frontend: https://${DOMAIN_APP}"
echo -e "   Backend:  https://${DOMAIN_API}/api"
echo -e "\n${YELLOW}📊 Verificar logs:${NC}"
echo -e "   docker-compose -f docker-compose.production.yml logs -f"
echo -e "\n${YELLOW}🔄 Reiniciar serviços:${NC}"
echo -e "   docker-compose -f docker-compose.production.yml restart"
