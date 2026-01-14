'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  Building2,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

export default function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [metrics, setMetrics] = useState({
    appointmentGrowth: null as any,
    userGrowth: null as any,
    revenueGrowth: null as any,
    activitySummary: null as any,
  });

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const days = parseInt(period, 10);
      const [appointmentData, userData, revenueData, activityData] = await Promise.all([
        api.getAppointmentGrowth(days),
        api.getUserGrowth(days),
        api.getRevenueGrowth(days),
        api.getActivitySummary(),
      ]);

      setMetrics({
        appointmentGrowth: appointmentData,
        userGrowth: userData,
        revenueGrowth: revenueData,
        activitySummary: activityData,
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implementar busca de dados históricos do banco de dados
  // Por enquanto, listas vazias até que backend implemente endpoints de métricas
  const revenueData: Array<{ month: string; value: number }> = [];

  const growthMetrics: Array<{ label: string; value: number; change: number; period: string; suffix?: string; prefix?: string }> = [];

  const topEstablishments: Array<{ name: string; revenue: number; appointments: number; growth: number }> = [];

  // TODO: Implementar busca de dados de churn do banco de dados
  const churnMetrics = {
    rate: 0,
    trend: 'stable' as const,
    cancelled: 0,
    total: 0,
    reasons: [] as Array<{ reason: string; count: number; percentage: number }>
  };

  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.value)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
            Métricas e Analytics
          </h1>
          <p className="text-slate-400 mt-2">Análise detalhada do desempenho da plataforma</p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <p className="text-sm text-slate-400 mb-2">Total Agendamentos</p>
          <p className="text-3xl font-bold text-white mb-2">
            {metrics.appointmentGrowth?.total || 0}
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
            <ArrowUp className="w-4 h-4" />
            {Math.round((metrics.appointmentGrowth?.completed / metrics.appointmentGrowth?.total * 100) || 0)}% concluído
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <p className="text-sm text-slate-400 mb-2">Novos Usuários</p>
          <p className="text-3xl font-bold text-white mb-2">
            {metrics.userGrowth?.newUsers || 0}
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-blue-400">
            <Users className="w-4 h-4" />
            {metrics.userGrowth?.newClients || 0} clientes
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <p className="text-sm text-slate-400 mb-2">Receita Gerada</p>
          <p className="text-3xl font-bold text-white mb-2">
            R$ {(metrics.revenueGrowth?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            Crescimento contínuo
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <p className="text-sm text-slate-400 mb-2">Atividades Hoje</p>
          <p className="text-3xl font-bold text-white mb-2">
            {(metrics.activitySummary?.appointmentsToday || 0) + 
             (metrics.activitySummary?.usersToday || 0) + 
             (metrics.activitySummary?.paymentsToday || 0)}
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-purple-400">
            <Activity className="w-4 h-4" />
            Até agora
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LineChart className="w-5 h-5 text-emerald-400" />
              Evolução da Receita
            </h3>
            <p className="text-sm text-slate-400 mt-1">Crescimento diário</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">
              R$ {(metrics.revenueGrowth?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400">Período: {period} dias</p>
          </div>
        </div>
        
        {metrics.revenueGrowth?.byDay && metrics.revenueGrowth.byDay.length > 0 ? (
          <div className="flex items-end justify-between gap-2 h-64">
            {metrics.revenueGrowth.byDay.map((data: any, index: number) => {
              const maxValue = Math.max(...metrics.revenueGrowth.byDay.map((d: any) => d.revenue || 0));
              const percentage = maxValue > 0 ? (data.revenue || 0) / maxValue * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative group">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-300 hover:from-emerald-400 hover:to-emerald-300"
                      style={{ height: `${percentage}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      R$ {(data.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{new Date(data.date).toLocaleDateString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            Sem dados de receita para este período
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointamento Stats */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Status de Agendamentos
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Completados</span>
                <span className="text-sm font-semibold text-white">{metrics.appointmentGrowth?.completed || 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full" style={{ width: `${metrics.appointmentGrowth?.completed ? Math.round((metrics.appointmentGrowth.completed / metrics.appointmentGrowth.total) * 100) : 0}%` }} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Cancelados</span>
                <span className="text-sm font-semibold text-white">{metrics.appointmentGrowth?.canceled || 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full" style={{ width: `${metrics.appointmentGrowth?.canceled ? Math.round((metrics.appointmentGrowth.canceled / metrics.appointmentGrowth.total) * 100) : 0}%` }} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Total do Período</span>
                <span className="text-sm font-semibold text-white">{metrics.appointmentGrowth?.total || 0}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Activity */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Atividade Hoje
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">Agendamentos</span>
              </div>
              <span className="text-lg font-bold text-white">{metrics.activitySummary?.appointmentsToday || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm text-slate-400">Novos Usuários</span>
              </div>
              <span className="text-lg font-bold text-white">{metrics.activitySummary?.usersToday || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-400">Pagamentos</span>
              </div>
              <span className="text-lg font-bold text-white">{metrics.activitySummary?.paymentsToday || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <CreditCard className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-sm text-slate-400">Assinaturas</span>
              </div>
              <span className="text-lg font-bold text-white">{metrics.activitySummary?.subscriptionsToday || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Agendamentos Completos</p>
              <p className="text-2xl font-bold text-white">{metrics.appointmentGrowth?.completed || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400 font-semibold">
            <ArrowUp className="w-4 h-4" />
            Período: {period} dias
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Novos Usuários</p>
              <p className="text-2xl font-bold text-white">{metrics.userGrowth?.newUsers || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-blue-400 font-semibold">
            <Users className="w-4 h-4" />
            {metrics.userGrowth?.newClients || 0} como clientes
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pagamentos Hoje</p>
              <p className="text-2xl font-bold text-white">{metrics.activitySummary?.paymentsToday || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400 font-semibold">
            <ArrowUp className="w-4 h-4" />
            Atividades: {period} dias
          </div>
        </div>
      </div>
    </div>
  );
}
