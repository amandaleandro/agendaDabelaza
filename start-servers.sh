#!/bin/bash

# Start PostgreSQL
docker compose up -d postgres

# Wait for Postgres
sleep 3

# Start Backend in background
cd backend
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Start Frontend in background
cd ../frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ Servidores iniciados:"
echo "   Backend: http://localhost:3001/api"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Para ver logs:"
echo "   tail -f /tmp/backend.log"
echo "   tail -f /tmp/frontend.log"
echo ""
echo "Para parar:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
