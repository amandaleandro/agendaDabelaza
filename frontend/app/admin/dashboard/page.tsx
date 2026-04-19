'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { PaymentStatus, Appointment, Service, Professional } from '@/types';
import {
  Calendar,
  DollarSign,
  Users,
  Scissors,
  ArrowRight,
  Package,
  Briefcase,
  CreditCard,
  Globe,
  TrendingUp,
  TrendingDown,
  Loader2,
  Activity,
} from 'lucide-react';
import {
  formatSaoPauloDate,
  formatSaoPauloTime,
  getNowSaoPauloDateKey,
  getSaoPauloDateKey,
} from '@/lib/saoPauloDateTime';

const api = new ApiClient();

interface DashboardStats {
  totalAppointments: number;
  totalRevenue: number;
  totalClients: number;
  totalServices: number;
  recentAppointments: Appointment[];
  topServices: Array<{ service: Service; count: number }>;
  revenueByDay: Array<{ day: string; amount: number }>;
  topProfessionals: Array<{ professional: Professional; revenue: number }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, loadFromStorage } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardDataLegacy = useCallback(async () => {
    try {
      const [appointments, services] = await Promise.all([
        api.listAppointments().catch(() => []),
        api.listServices().catch(() => []),
      ]);

      const [payments, professionals, clients] = await Promise.all([
        api.listPayments().catch(() => []),
        api.listProfessionals().catch(() => []),
        api.listClients().catch(() => []),
      ]);

      const paidPayments = (payments || []).filter((payment) => payment.status === PaymentStatus.PAID);
      const totalRevenue = paidPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return getSaoPauloDateKey(date);
      });

      const revenueByDay = last7Days.map((day) => {
        const dayPayments = paidPayments.filter((payment) => (payment.createdAt || '').startsWith(day));
        const amount = dayPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
        const dayName = formatSaoPauloDate(`${day}T12:00:00`, { weekday: 'short' });
        return { day: dayName, amount };
      });

      const serviceCounts = (appointments || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.serviceId] = (acc[curr.serviceId] || 0) + 1;
        return acc;
      }, {});

      const topServices = Object.entries(serviceCounts)
        .map(([serviceId, count]) => {
          const service = services.find((item) => item.id === serviceId);
          return { service: service!, count };
        })
        .filter((item) => item.service)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const professionalRevenue = (appointments || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.professionalId] = (acc[curr.professionalId] || 0) + (Number(curr.price) || 0);
        return acc;
      }, {});

      const topProfessionals = Object.entries(professionalRevenue)
        .map(([professionalId, revenue]) => {
          const professional = professionals.find((item) => item.id === professionalId);
          return { professional: professional!, revenue };
        })
        .filter((item) => item.professional)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        totalAppointments: (appointments || []).length,
        totalRevenue,
        totalClients: (clients || []).length,
        totalServices: (services || []).length,
        recentAppointments: (appointments || []).slice(0, 5),
        topServices,
        revenueByDay,
        topProfessionals,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [dashboardStats, revenueData] = await Promise.all([
        api.getDashboardStats().catch((err) => {
          console.error('Erro ao carregar stats:', err);
          return null;
        }),
        api.getDashboardRevenueByDay(7).catch((err) => {
          console.error('Erro ao carregar receita:', err);
          return [];
        }),
      ]);

      if (!dashboardStats) {
        return loadDashboardDataLegacy();
      }

      setStats({
        totalAppointments: dashboardStats.totalAppointments || 0,
        totalRevenue: dashboardStats.totalRevenue || 0,
        totalClients: dashboardStats.totalClients || 0,
        totalServices: dashboardStats.totalServices || 0,
        recentAppointments: dashboardStats.recentAppointments || [],
        topServices: dashboardStats.topServices || [],
        revenueByDay: revenueData || [],
        topProfessionals: [],
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      await loadDashboardDataLegacy();
    } finally {
      setLoading(false);
    }
  }, [loadDashboardDataLegacy]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      void loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData, router]);

  const shortcuts = [
    { title: 'Produtos', icon: Package, href: '/admin/produtos', color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { title: 'ServiÃ§os', icon: Scissors, href: '/admin/servicos', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { title: 'Profissionais', icon: Briefcase, href: '/admin/profissionais', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Pagamentos', icon: CreditCard, href: '/admin/pagamentos', color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Clientes', icon: Users, href: '/admin/clientes', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Landing Page', icon: Globe, href: '/admin/landing', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ];

  if (loading || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    { label: 'Agendamentos', value: stats.totalAppointments.toString(), icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: '+12%' },
    { label: 'Receita', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '+8%' },
    { label: 'Clientes', value: stats.totalClients.toString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: '+5%' },
    { label: 'ServiÃ§os', value: stats.totalServices.toString(), icon: Scissors, color: 'text-orange-400', bg: 'bg-orange-400/10', trend: '0%' },
  ];

  const maxRevenue = Math.max(...stats.revenueByDay.map((day) => day.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          VisÃ£o geral do seu negÃ³cio hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith('+');
          return (
            <div key={stat.label} className="group rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5 transition-all hover:border-slate-700 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className={`rounded-lg p-3 ${stat.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {isPositive ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">{stat.trend}</span>
                    </>
                  ) : stat.trend === '0%' ? (
                    <span className="text-slate-500">{stat.trend}</span>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-400" />
                      <span className="text-red-400">{stat.trend}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mb-1 break-words text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5 lg:col-span-2 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <Activity className="h-5 w-5 text-indigo-400" />
                Receita dos Ãšltimos 7 Dias
              </h3>
              <p className="mt-1 text-sm text-slate-400">TendÃªncia de faturamento</p>
            </div>
          </div>

          <div className="flex h-48 items-end justify-between gap-2 overflow-x-auto pb-2 sm:gap-3">
            {stats.revenueByDay.map((day) => (
              <div key={day.day} className="flex min-w-[2.75rem] flex-1 flex-col items-center gap-2">
                <div className="text-center text-[10px] font-semibold text-emerald-400 sm:text-xs">
                  {day.amount > 0 ? `R$ ${day.amount.toFixed(0)}` : ''}
                </div>
                <div
                  className="group relative w-full cursor-pointer rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all hover:from-indigo-500 hover:to-indigo-300"
                  style={{ height: `${(day.amount / maxRevenue) * 100}%`, minHeight: day.amount > 0 ? '8px' : '2px' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                    R$ {day.amount.toFixed(2)}
                  </div>
                </div>
                <div className="text-[10px] uppercase text-slate-500 sm:text-xs">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Scissors className="h-5 w-5 text-orange-400" />
            Top ServiÃ§os
          </h3>
          <div className="space-y-3">
            {stats.topServices.map((item, index) => (
              <div key={`${item.service.id}-${index}`} className="flex flex-col gap-3 rounded-lg bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : index === 1
                          ? 'bg-slate-500/20 text-slate-400'
                          : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{item.service.name}</p>
                    <p className="text-xs text-slate-500">{item.count} agendamentos</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">R$ {item.service.price.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold text-white">Acesso RÃ¡pido</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <button
                key={shortcut.href}
                onClick={() => router.push(shortcut.href)}
                className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4 transition-all hover:border-slate-700 hover:scale-105"
              >
                <div className={`rounded-lg p-3 ${shortcut.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${shortcut.color}`} />
                </div>
                <span className="text-center text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                  {shortcut.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Calendar className="h-5 w-5 text-blue-400" />
              Agendamentos Recentes
            </h3>
            <button
              onClick={() => router.push('/admin/agenda')}
              className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {stats.recentAppointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum agendamento ainda</p>
            ) : (
              stats.recentAppointments.map((appointment) => {
                const displayDate = appointment.scheduledAt
                  ? getSaoPauloDateKey(appointment.scheduledAt)
                  : getNowSaoPauloDateKey();
                const displayTime = appointment.scheduledAt
                  ? formatSaoPauloTime(appointment.scheduledAt, { hour: '2-digit', minute: '2-digit' })
                  : '';
                const clientName = appointment.user?.name || 'Cliente';

                return (
                  <div key={appointment.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/50">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{clientName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(displayDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} Ã s {displayTime}
                      </p>
                    </div>
                    <div
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        appointment.status === 'SCHEDULED'
                          ? 'bg-amber-500/10 text-amber-400'
                          : appointment.status === 'COMPLETED'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {appointment.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Briefcase className="h-5 w-5 text-blue-400" />
            Top Profissionais
          </h3>
          <div className="space-y-3">
            {stats.topProfessionals.map((item) => (
              <div key={item.professional.id} className="flex flex-col gap-3 rounded-lg bg-slate-800/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white">
                    {item.professional.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{item.professional.name}</p>
                    <p className="truncate text-xs text-slate-500">{item.professional.email}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">R$ {item.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
