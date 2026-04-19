# AppointPro Beauty - Sistema de Agendamento

Uma plataforma completa de agendamento de serviços de beleza com suporte a pagamentos e gestão de profissionais.

## 📋 Sumário

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Setup Rápido](#-setup-rápido)
- [Deploy em Produção](#-deploy-em-produção)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)

---

## ✨ Características

- ✅ **Agendamento**: Clientes podem agendar serviços com profissionais
- ✅ **Gestão de Profissionais**: Criar e gerenciar serviços e disponibilidade
- ✅ **Pagamentos**: Integração com Mercado Pago (PIX e Cartão)
- ✅ **Assinaturas**: Planos FREE, PRO e ENTERPRISE
- ✅ **Autenticação**: JWT-based authentication
- ✅ **Produtos**: Adicionar produtos aos agendamentos
- ✅ **Clean Architecture**: DDD com repositórios e use cases

---

## 🛠️ Stack Tecnológico

### Backend
- **NestJS** - Framework web
- **TypeScript** - Linguagem de programação
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **Mercado Pago** - Pagamentos
- **JWT** - Autenticação

### Frontend
- **Next.js** - Framework React
- **React** - UI framework
- **TypeScript** - Linguagem
- **Tailwind CSS** - Styling

---

## 🚀 Setup Rápido

### Pré-requisitos
- Node.js >= 18
- PostgreSQL >= 12
- Docker (opcional)

### 1. Clone o repositório
```bash
git clone <repository-url>
cd agendei
```

### 2. Setup Backend

```bash
cd backend

# Copiar arquivo de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Rodar migrações
npx prisma migrate dev

# (Opcional) Seed com dados de teste
npm run db:seed

# Iniciar servidor em desenvolvimento
npm run start:dev
```

A API estará disponível em: [http://localhost:3010/api](http://localhost:3010/api)

### 3. Setup Frontend (Opcional)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev
```

A interface estará disponível em: [http://localhost:3003](http://localhost:3003)

---

## � Deploy em Produção

### Deploy Automático com GitHub Actions

Este projeto está configurado com CI/CD completo. Veja os guias:

- **[📖 DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)** - Guia rápido de deploy
- **[🔐 DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md)** - Configuração de secrets
- **[🖥️ DEPLOY_VM.md](./DEPLOY_VM.md)** - Deploy manual em VM

#### Passos Resumidos:

1. **Configure o servidor:**
   ```bash
   # No servidor
   sudo bash setup-server.sh
   ```

2. **Configure os secrets no GitHub:**
   - Settings → Secrets → Actions
   - Adicione: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `VM_HOST`, etc.

3. **Faça o deploy:**
   ```bash
   # Push para main = deploy automático
   git push origin main
   
   # Ou manualmente via GitHub Actions
   ```

Após o deploy, acesse:
- **Frontend**: https://app.seudominio.com
- **Backend**: https://api.seudominio.com

---

## �📁 Estrutura do Projeto

```
agendei/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── core/
│   │   │   ├── application/   # Use cases
│   │   │   ├── domain/        # Entidades & regras
│   │   │   └── infrastructure/# BD, HTTP, Auth
│   │   └── modules/           # Módulos NestJS
│   ├── prisma/                # Schema & migrações
│   ├── test/                  # Testes
│   ├── .env.example           # Variáveis de ambiente
│   └── SETUP.md               # Guia detalhado
│
├── frontend/                  # Interface Next.js
│   ├── app/                   # Páginas e layout
│   ├── components/            # Componentes React
│   └── public/                # Arquivos estáticos
│
├── docker-compose.yml         # Serviços Docker
├── API.md                     # Documentação da API
└── README.md                  # Este arquivo
```

---

## 📚 Documentação

### Backend
- [Backend Setup Guide](backend/SETUP.md) - Instruções detalhadas para configurar o backend
- [API Documentation](API.md) - Endpoints disponíveis com exemplos

### Principais Endpoints

**Clientes:**
```
POST   /api/clients                    - Criar cliente
```

**Profissionais:**
```
POST   /api/professionals              - Criar profissional
POST   /api/professionals/:id/services - Criar serviço
GET    /api/professionals/:id/services - Listar serviços
POST   /api/professionals/schedules    - Definir horário
```

**Agendamentos:**
```
POST   /api/appointments               - Criar agendamento
DELETE /api/appointments/:id           - Cancelar agendamento
```

**Pagamentos:**
```
POST   /api/payments                   - Realizar pagamento
```

**Assinaturas:**
```
POST   /api/subscriptions              - Criar assinatura
DELETE /api/subscriptions/:id          - Cancelar assinatura
```

Veja [API.md](API.md) para documentação completa.

---

## 🐳 Docker Compose

Para rodar PostgreSQL e Redis localmente:

```bash
docker-compose up -d
```

Isto inicia:
- **PostgreSQL** na porta 5432
- **Redis** na porta 6379

Para rodar o ambiente local inteiro em containers:

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

Isto inicia:
- **Backend** na porta 3010
- **Frontend** na porta 3003
- **PostgreSQL** na porta 5432
- **Redis** na porta 6379

---

## 🔧 Comandos Úteis

### Backend

```bash
# Desenvolvimento
npm run start:dev
npm run start:debug

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:watch
npm run test:cov

# Database
npm run db:migrate
npm run db:seed
npm run db:studio

# Linting
npm run lint
npm run format
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build
npm run build
npm run start

# Linting
npm run lint
```

---

## 🔐 Variáveis de Ambiente

### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agendei

# JWT
JWT_SECRET=seu-secret-key
JWT_EXPIRATION=24h

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890...
MERCADOPAGO_PUBLIC_KEY=TEST-abcd1234-5678...

# API
API_PORT=3000
API_URL=http://localhost:3010
FRONTEND_URL=http://localhost:3003
```

Veja [.env.example](backend/.env.example) para referência.

---

## 🌐 Acessar o Sistema

### Desenvolvimento Local

Após iniciar os servidores localmente:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | [http://localhost:3003](http://localhost:3003) | Interface do usuário |
| **Backend API** | [http://localhost:3010/api](http://localhost:3010/api) | API REST |
| **Health Check** | [http://localhost:3010/api/health](http://localhost:3010/api/health) | Status da API |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | Gerenciar banco (após `npm run db:studio`) |

### Produção (após deploy)

| Serviço | URL de Acesso | Descrição |
|---------|---------------|-----------|
| **Frontend** | `http://SEU_IP_DA_VM` | Interface em produção (porta 80) |
| **Backend API** | `http://SEU_IP_DA_VM:3001/api` | API em produção (porta 3001) |
| **Health Check** | `http://SEU_IP_DA_VM:3001/api/health` | Verificar status da API |

**Exemplos com IP real:**
```
Frontend:     http://123.45.67.89
Backend API:  http://123.45.67.89:3001/api
Health Check: http://123.45.67.89:3001/api/health
```

**Com domínio configurado (SSL/HTTPS):**

| Serviço | URL de Acesso | Descrição |
|---------|---------------|-----------|
| **Frontend** | `https://app.seudominio.com` | Interface com SSL |
| **Backend API** | `https://api.seudominio.com` | API com SSL |
| **Health Check** | `https://api.seudominio.com/api/health` | Status da API |

> **💡 Importante:** 
> - **Sem domínio**: Use `http://IP_DA_VM` para frontend e `http://IP_DA_VM:3001` para backend
> - **Com domínio**: Configure DNS e SSL conforme [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)
> - **Porta 80**: Frontend (automaticamente via nginx)
> - **Porta 3001**: Backend API (acessar diretamente ou via nginx se configurado)

---

## 📊 Modelos de Dados

### Client
- ID, Name, Email, Phone, CreatedAt

### Professional
- ID, UserID, Name, Email, Phone, CreatedAt

### Service
- ID, ProfessionalID, Name, Description, Price, DurationMinutes

### Appointment
- ID, ClientID, ProfessionalID, ServiceID, ScheduledAt, Status, Price

### Subscription
- ID, OwnerID, PlanType, Status, StartedAt, ExpiresAt

### Payment
- ID, AppointmentID, Amount, Status, TransactionID, CreatedAt

---

## 🧪 Testes

```bash
cd backend

# Rodar testes
npm run test

# Cobertura
npm run test:cov

# E2E
npm run test:e2e
```

---

## 📞 Contato & Suporte

Para dúvidas ou issues, abra uma issue no repositório.

---

## 📄 Licença

Este projeto está sob a licença UNLICENSED.

---

**Desenvolvido com ❤️ em 2025**
