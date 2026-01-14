'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { Payment, PaymentStatus, Appointment, Service, Professional } from '@/types';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Scissors, 
  ArrowRight, 
  Clock,
  Package,
  Briefcase,
  CreditCard,
  Crown,
  PieChart,
  Globe,
  Box,
  Settings,
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

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
  const { isAuthenticated, loadFromStorage, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      loadDashboardData();
    }
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Usar endpoint otimizado do dashboard
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
        // Fallback para modo antigo se o endpoint novo falhar
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
        topProfessionals: [], // TODO: implementar
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Fallback para modo antigo
      await loadDashboardDataLegacy();
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardDataLegacy = async () => {
    try {
      // Carregar dados de forma incremental para melhor UX
      
      // Primeira onda: dados mais críticos
      const [appointments, services] = await Promise.all([
        api.listAppointments().catch(() => []),
        api.listServices().catch(() => []),
      ]);

      // Segunda onda: dados complementares
      const [payments, professionals, clients] = await Promise.all([
        api.listPayments().catch(() => []),
        api.listProfessionals().catch(() => []),
        api.listClients().catch(() => []),
      ]);

      // Calculate revenue
      const paidPayments = (payments || []).filter(p => p.status === PaymentStatus.PAID);
      const totalRevenue = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Revenue by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueByDay = last7Days.map(day => {
        const dayPayments = paidPayments.filter(p => (p.createdAt || '').startsWith(day));
        const amount = dayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const dayName = new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
        return { day: dayName, amount };
      });

      // Top services
      const serviceCounts = (appointments || []).reduce((acc: any, curr) => {
        acc[curr.serviceId] = (acc[curr.serviceId] || 0) + 1;
        return acc;
      }, {});

      const topServices = Object.entries(serviceCounts)
        .map(([serviceId, count]) => {
          const service = services.find(s => s.id === serviceId);
          return { service: service!, count: count as number };
        })
        .filter(item => item.service)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top professionals
      const professionalRevenue = (appointments || []).reduce((acc: any, curr) => {
        acc[curr.professionalId] = (acc[curr.professionalId] || 0) + (Number(curr.price) || 0);
        return acc;
      }, {});

      const topProfessionals = Object.entries(professionalRevenue)
        .map(([profId, revenue]) => {
          const professional = professionals.find(p => p.id === profId);
          return { professional: professional!, revenue: revenue as number };
        })
        .filter(item => item.professional)
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
  };

  const shortcuts = [
    { title: 'Produtos', icon: Package, href: '/admin/produtos', color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { title: 'Serviços', icon: Scissors, href: '/admin/servicos', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { title: 'Profissionais', icon: Briefcase, href: '/admin/profissionais', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Pagamentos', icon: CreditCard, href: '/admin/pagamentos', color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Clientes', icon: Users, href: '/admin/clientes', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Landing Page', icon: Globe, href: '/admin/landing', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ];

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    { label: 'Agendamentos', value: stats.totalAppointments.toString(), icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: '+12%' },
    { label: 'Receita', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '+8%' },
    { label: 'Clientes', value: stats.totalClients.toString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: '+5%' },
    { label: 'Serviços', value: stats.totalServices.toString(), icon: Scissors, color: 'text-orange-400', bg: 'bg-orange-400/10', trend: '0%' },
  ];

  const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Visão geral do seu negócio hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith('+');
          return (
            <div key={index} className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 hover:border-slate-700 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {isPositive ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">{stat.trend}</span>
                    </>
                  ) : stat.trend === '0%' ? (
                    <span className="text-slate-500">{stat.trend}</span>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">{stat.trend}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                Receita dos Últimos 7 Dias
              </h3>
              <p className="text-sm text-slate-400 mt-1">Tendência de faturamento</p>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-48 gap-3">
            {stats.revenueByDay.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold text-emerald-400">
                  {day.amount > 0 ? `R$ ${day.amount.toFixed(0)}` : ''}
                </div>
                <div 
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 transition-all cursor-pointer relative group"
                  style={{ height: `${(day.amount / maxRevenue) * 100}%`, minHeight: day.amount > 0 ? '8px' : '2px' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    R$ {day.amount.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-slate-500 uppercase">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Scissors className="h-5 w-5 text-orange-400" />
            Top Serviços
          </h3>
          <div className="space-y-3">
            {stats.topServices.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-500/20 text-slate-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.service.name}</p>
                    <p className="text-xs text-slate-500">{item.count} agendamentos</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">R$ {item.service.price.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {shortcuts.map((shortcut, index) => {
            const Icon = shortcut.icon;
            return (
              <button
                key={index}
                onClick={() => router.push(shortcut.href)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-slate-700 hover:scale-105 transition-all group"
              >
                <div className={`p-3 rounded-lg ${shortcut.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${shortcut.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{shortcut.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Agendamentos Recentes
            </h3>
            <button 
              onClick={() => router.push('/admin/agenda')}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {stats.recentAppointments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Nenhum agendamento ainda</p>
            ) : (
              stats.recentAppointments.map((appointment) => {
                const displayDate = appointment.date || (appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                const displayTime = appointment.slot || (appointment.scheduledAt ? new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
                const clientName = appointment.client?.name || 'Cliente';
                
                return (
                  <div key={appointment.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {clientName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(displayDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {displayTime}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      appointment.status === 'SCHEDULED' ? 'bg-amber-500/10 text-amber-400' :
                      appointment.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Professionals */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-400" />
            Top Profissionais
          </h3>
          <div className="space-y-3">
            {stats.topProfessionals.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {item.professional.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.professional.name}</p>
                    <p className="text-xs text-slate-500">{item.professional.email}</p>
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
