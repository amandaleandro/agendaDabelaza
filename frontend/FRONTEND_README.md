# Frontend - AppointPro Beauty

Interface Next.js para plataforma de agendamento de serviços de beleza.

## 🚀 Setup

### 1. Dependências
```bash
npm install
```

### 2. Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Rodar em Desenvolvimento
```bash
npm run dev
```

A interface estará disponível em: `http://localhost:3001`

## 📁 Estrutura

```
app/                    # Páginas e layout (Next.js 13+)
├── page.tsx           # Home
├── login/             # Login page
├── signup/            # Cadastro page
├── dashboard/         # Dashboard (protegido)
└── appointments/      # Agendamentos page

src/
├── components/        # Componentes React
│   ├── common/       # Componentes reutilizáveis
│   ├── Header.tsx    # Navigation
│   └── Footer.tsx    # Footer
├── hooks/            # Custom hooks
├── lib/              # Utilitários
├── services/         # API client
├── store/            # Estado global (Zustand)
└── types/            # TypeScript types
```

## 🧩 Componentes

### Common Components
- `Button` - Botão reutilizável
- `Input` - Input com validação
- `Card` - Container de conteúdo
- `Modal` - Modal dialog
- `Alert` - Alertas

### Layout
- `Header` - Navegação principal
- `Footer` - Rodapé

## 🔗 API Client

```typescript
import { apiClient } from '@/services/api';

// Criar cliente
const client = await apiClient.createClient({
  name: 'João',
  email: 'joao@example.com',
  phone: '11999999999'
});

// Criar agendamento
const appointment = await apiClient.createAppointment({
  clientId: '...',
  professionalId: '...',
  serviceId: '...',
  scheduledAt: '2025-12-31T10:00:00Z'
});
```

## 🔐 Autenticação

```typescript
import { useAuth } from '@/store/auth';

export default function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Sair</button>
      ) : (
        <button onClick={() => login(token, user)}>Entrar</button>
      )}
    </div>
  );
}
```

## 📝 Páginas

- `/ ` - Home (público)
- `/login` - Login (público)
- `/signup` - Cadastro (público)
- `/dashboard` - Dashboard (protegido)
- `/appointments` - Agendamentos (protegido)

## 📚 Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **clsx** - Class utilities

## 🛠️ Comandos

```bash
npm run dev       # Desenvolvimento
npm run build     # Build para produção
npm run start     # Rodar em produção
npm run lint      # Linting
```

## 🔄 Próximos Passos

- [ ] Autenticação real (JWT backend)
- [x] Integração com pagamentos (Mercado Pago)
- [ ] Notificações em tempo real (WebSockets)
- [ ] Calendário interativo
- [ ] Feedback visual de carregamento
- [ ] Paginação e filtros

## 📝 Notas

- JWT token salvo em localStorage
- Proteção de rotas implementada
- API client pronto com interceptors
- Componentes reutilizáveis
- Responsive design com Tailwind

---

**Desenvolvido com Next.js 16 e React 19**
