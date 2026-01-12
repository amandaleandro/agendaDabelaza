#!/bin/bash

# Agendei - Quick Start Script
# Este script configura e inicia o projeto

set -e

echo "🚀 Agendei - Setup Rápido"
echo "=========================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Verificando pré-requisitos...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js >= 18${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker não encontrado. Alguns serviços podem não funcionar.${NC}"
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Setup Backend
echo -e "\n${BLUE}🔧 Configurando Backend...${NC}"
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env criado. Atualize com suas credenciais Stripe se necessário.${NC}"
fi

# Install dependencies
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install

# Create prisma client
echo -e "${BLUE}🗄️  Configurando banco de dados...${NC}"
npx prisma generate

# Run migrations
echo -e "${BLUE}🔄 Rodando migrações...${NC}"
npx prisma migrate deploy || npx prisma migrate dev

# Optional: seed database
read -p "Deseja carregar dados de teste? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}🌱 Carregando dados de teste...${NC}"
    npm run db:seed
fi

# Build
echo -e "${BLUE}🏗️  Compilando projeto...${NC}"
npm run build

cd ..

echo -e "\n${GREEN}🎉 Setup concluído com sucesso!${NC}"
echo -e "\n${BLUE}📚 Próximas etapas:${NC}"
echo -e "1. Backend: ${YELLOW}cd backend && npm run start:dev${NC}"
echo -e "2. Frontend: ${YELLOW}cd frontend && npm run dev${NC}"
echo -e "\n${BLUE}📖 Documentação:${NC}"
echo -e "- API: ${YELLOW}README.md${NC}"
echo -e "- Backend Setup: ${YELLOW}backend/SETUP.md${NC}"
echo -e "- API Endpoints: ${YELLOW}API.md${NC}"
