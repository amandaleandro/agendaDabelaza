'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

export default function AdminAgendeiDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEstablishments: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalAppointments: 0,
    growth: {
      establishments: 12.5,
      subscriptions: 8.3,
      revenue: 15.7,
      users: 10.2
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const metrics = await api.getAdminDashboardMetrics();

      setStats({
        totalEstablishments: metrics.totalEstablishments || 0,
        totalSubscriptions: metrics.totalSubscriptions || 0,
        totalRevenue: metrics.totalRevenue || 0,
        activeUsers: metrics.activeUsers || 0,
        totalAppointments: metrics.totalAppointments || 0,
        growth: {
          establishments: 0,
          subscriptions: 0,
          revenue: 0,
          users: 0
        }
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Estabelecimentos',
      value: stats.totalEstablishments,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      growth: stats.growth.establishments,
      prefix: ''
    },
    {
      title: 'Assinaturas Ativas',
      value: stats.totalSubscriptions,
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      growth: stats.growth.subscriptions,
      prefix: ''
    },
    {
      title: 'Receita Mensal',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      growth: stats.growth.revenue,
      prefix: 'R$ ',
      format: (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      icon: Users,
      color: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      growth: stats.growth.users,
      prefix: ''
    },
  ];

  // TODO: Implementar busca de atividades recentes do banco de dados
  // Por enquanto, lista vazia até que backend implemente endpoint
  const recentActivity: Array<{ type: string; text: string; time: string; status: string }> = [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10">
            <TrendingUp className="h-8 w-8 text-red-400" />
          </div>
          Dashboard do Sistema
        </h1>
        <p className="text-slate-400 mt-2">Visão geral da plataforma Agendei</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.growth > 0;
          
          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(stat.growth)}%
                </div>
              </div>
              
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-white">
                {stat.prefix}
                {stat.format ? stat.format(stat.value) : stat.value}
              </p>
              <p className="text-xs text-slate-500 mt-2">vs. mês anterior</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Distribuição de Planos
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">FREE</span>
                <span className="text-sm font-semibold text-white">45%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-slate-500 to-slate-600 h-3 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">PRO</span>
                <span className="text-sm font-semibold text-white">40%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">ENTERPRISE</span>
                <span className="text-sm font-semibold text-white">15%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Atividade Recente
          </h3>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'success' ? 'bg-emerald-500/10' :
                  activity.status === 'warning' ? 'bg-amber-500/10' :
                  'bg-red-500/10'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className={`w-4 h-4 ${
                      activity.status === 'success' ? 'text-emerald-400' : ''
                    }`} />
                  ) : activity.status === 'warning' ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Saúde do Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">API Status</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">99.9%</p>
            <p className="text-xs text-slate-500 mt-1">Uptime</p>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Latência Média</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">45ms</p>
            <p className="text-xs text-slate-500 mt-1">Resposta</p>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Requisições/min</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">1.2k</p>
            <p className="text-xs text-slate-500 mt-1">Taxa atual</p>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Erros</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">0.1%</p>
            <p className="text-xs text-slate-500 mt-1">Taxa de erro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
