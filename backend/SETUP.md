# Backend Setup Guide - AppointPro Beauty

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 12
- npm or yarn

### 1. Environment Setup

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

**Important variables:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/agendei"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
API_PORT=3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at: `http://localhost:3000/api`

---

## 📁 Project Structure

```
src/
├── core/
│   ├── application/        # Use cases (business logic)
│   │   ├── appointments/
│   │   ├── clients/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── professionals/
│   │   ├── schedules/
│   │   ├── services/
│   │   └── subscriptions/
│   ├── domain/             # Domain entities & rules
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── gateways/
│   │   ├── plans/
│   │   ├── repositories/
│   │   └── services/
│   └── infrastructure/     # Implementation details
│       ├── database/       # Prisma repositories
│       ├── http/           # Controllers & DTOs
│       ├── auth/           # JWT & guards
│       ├── payment-gateway/# Stripe integration
│       └── config/         # Configuration
├── modules/                # NestJS modules
└── main.ts
```

---

## 🏗️ Architecture

This project follows **Clean Architecture** with **DDD (Domain-Driven Design)**:

- **Domain Layer**: Pure business rules, no external dependencies
- **Application Layer**: Use cases that orchestrate domain logic
- **Infrastructure Layer**: Implementation details (database, HTTP, payments)

---

## 📚 Core Modules

### AppointmentModule
- Create appointments
- Cancel appointments
- Add products to appointments

### ClientModule
- Create client profiles

### SubscriptionModule
- Create subscriptions
- Cancel subscriptions

### PaymentModule
- Create deposit payments
- Stripe webhook handling

### ProfessionalModule
- Create professionals
- Manage services
- Set schedules

### ProductModule
- Create products
- List products by professional

---

## 🔌 API Endpoints

See [../API.md](../API.md) for complete API documentation.

### Main Endpoints:

**Appointments:**
- POST `/appointments` - Create appointment
- DELETE `/appointments/:id` - Cancel appointment
- POST `/appointments/:id/products` - Add product to appointment

**Clients:**
- POST `/clients` - Create client

**Subscriptions:**
- POST `/subscriptions` - Create subscription
- DELETE `/subscriptions/:id` - Cancel subscription

**Payments:**
- POST `/payments` - Create payment
- POST `/webhooks/stripe` - Stripe webhook

**Professionals:**
- POST `/professionals` - Create professional
- POST `/professionals/:id/services` - Create service
- GET `/professionals/:id/services` - List services
- POST `/professionals/schedules` - Set schedule

**Products:**
- POST `/products` - Create product
- GET `/professionals/:id/products` - List products

---

## 🗄️ Database

The project uses **Prisma ORM** with PostgreSQL.

### Key Entities:
- `Appointment` - Client bookings
- `Client` - Client profiles
- `Payment` - Payment records
- `Plan` - Subscription plans
- `Product` - Services/products offered
- `Professional` - Service providers
- `Schedule` - Professional availability
- `Service` - Service details
- `Subscription` - Client subscriptions

### View Schema:
```bash
npx prisma studio
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🔑 Authentication

- JWT-based authentication via `@nestjs/jwt`
- Tokens include user ID and role
- Protected endpoints use `@UseGuards(JwtAuthGuard)`

---

## 💳 Payment Integration

Stripe integration handles:
- Deposit payments
- Webhooks for payment confirmation
- Payment status updates

Configure Stripe keys in `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest"
}
```

---

## 📝 Logging

Configure logging in `src/core/infrastructure/config/`.

---

## 🛠️ Development Commands

```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Lint code
npm run lint

# Format code
npm run format

# Prisma migrations
npx prisma migrate dev
npx prisma migrate deploy
```

---

## 📚 Additional Resources

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [API Documentation](../API.md)

---

## 🔗 Related Projects

- Frontend: `../frontend/`
- Docs: `../API.md`
