'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import {
  LogOut,
  LayoutDashboard,
  Globe,
  Scissors,
  Calendar,
  User,
  Package,
  Briefcase,
  CreditCard,
  Bell,
  DollarSign,
  Clock,
  X,
  Check,
  BarChart3,
  Crown,
  Settings,
  Sparkles,
  Gift
} from 'lucide-react';

const api = new ApiClient();

interface Notification {
  id: string;
  type: 'appointment' | 'payment';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const [appointments, payments] = await Promise.all([
        api.listAppointments().catch(() => []),
        api.listPayments().catch(() => [])
      ]);

      const notifs: Notification[] = [];

      // Recent appointments (last 24h)
      const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      const recentAppointments = appointments
        .filter(apt => new Date(apt.createdAt) > oneDayAgo && apt.status === 'SCHEDULED')
        .slice(0, 5);

      recentAppointments.forEach(apt => {
        notifs.push({
          id: `apt-${apt.id}`,
          type: 'appointment',
          title: 'Novo Agendamento',
          message: `Agendamento para ${apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleDateString('pt-BR') : 'data não definida'}`,
          time: formatTimeAgo(new Date(apt.createdAt)),
          read: false
        });
      });

      // Pending payments
      const pendingPayments = payments
        .filter(p => p.status === 'PENDING')
        .slice(0, 5);

      pendingPayments.forEach(payment => {
        notifs.push({
          id: `pay-${payment.id}`,
          type: 'payment',
          title: 'Pagamento Pendente',
          message: `R$ ${(Number(payment.amount) || 0).toFixed(2)} aguardando confirmação`,
          time: formatTimeAgo(new Date(payment.createdAt)),
          read: false
        });
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Reload notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/landing', label: 'Landing Page', icon: Globe },
    { href: '/admin/servicos', label: 'Serviços', icon: Scissors },
    { href: '/admin/planos-servicos', label: 'Planos', icon: Package },
    { href: '/admin/produtos', label: 'Produtos', icon: Package },
    { href: '/admin/profissionais', label: 'Profissionais', icon: Briefcase },
    { href: '/admin/clientes', label: 'Clientes', icon: User },
    { href: '/admin/assinatura', label: 'Meu Plano', icon: Crown },
    { href: '/admin/assinatura-clientes', label: 'Créditos Clientes', icon: Gift },
    { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
    { href: '/admin/agenda', label: 'Agenda', icon: Calendar },
    { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
    { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-[#0b1224] px-4 py-6">
          <Link href="/admin/dashboard" className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20">
              A
            </div>
            <span className="text-lg font-semibold text-white">AppointPro<span className="text-indigo-400">Beauty</span></span>
          </Link>

          <nav className="space-y-1 text-sm font-medium text-slate-300">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-300'
                      : 'hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 md:hidden">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20">
                    A
                  </div>
                  <span className="text-base font-semibold text-white">AppointPro<span className="text-indigo-400">Beauty</span></span>
                </Link>
              </div>

              {user && (
                <div className="flex items-center gap-3 ml-auto">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
