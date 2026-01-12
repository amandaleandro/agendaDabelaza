#!/bin/bash

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instalar Node 20
echo "Instalando Node.js 20..."
nvm install 20

# Usar Node 20
nvm use 20

# Verificar versões
echo ""
echo "✅ Node instalado:"
node --version

echo "✅ npm instalado:"
npm --version

# Iniciar servidores
echo ""
echo "Iniciando servidores..."

cd /home/amanda.carmo/amanda/agendei

# PostgreSQL
docker compose up -d postgres
sleep 3

# Backend
cd backend
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend iniciado (PID: $BACKEND_PID)"

# Frontend
cd ../frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend iniciado (PID: $FRONTEND_PID)"

echo ""
echo "✅ Servidores rodando!"
echo "   Backend: http://localhost:3001/api"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Ver logs:"
echo "   tail -f /tmp/backend.log"
echo "   tail -f /tmp/frontend.log"
