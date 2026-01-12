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
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simular carregamento de métricas
      await new Promise(resolve => setTimeout(resolve, 1000));
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
          onChange={(e) => setPeriod(e.target.value as any)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="1y">Último ano</option>
        </select>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {growthMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6"
          >
            <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metric.prefix}{metric.value}{metric.suffix}
            </p>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              metric.change > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {metric.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(metric.change)}%
              <span className="text-xs text-slate-500 ml-1">{metric.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LineChart className="w-5 h-5 text-emerald-400" />
              Evolução da Receita (MRR)
            </h3>
            <p className="text-sm text-slate-400 mt-1">Receita recorrente mensal</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">R$ 9.800</p>
            <p className="text-xs text-slate-400">+18% vs. mês anterior</p>
          </div>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-64">
          {revenueData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative group">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-300 hover:from-emerald-400 hover:to-emerald-300"
                  style={{ height: `${(data.value / maxRevenue) * 100}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  R$ {data.value.toLocaleString('pt-BR')}
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Establishments */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Top 5 Estabelecimentos
          </h3>
          
          <div className="space-y-4">
            {topEstablishments.map((est, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-white truncate">{est.name}</p>
                    <span className="text-emerald-400 font-bold text-sm ml-2">
                      R$ {est.revenue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{est.appointments} agendamentos</span>
                    <span className="text-emerald-400 font-semibold">+{est.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Analysis */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-red-400" />
              Análise de Churn
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-400">{churnMetrics.rate}%</p>
              <p className="text-xs text-slate-400">Taxa de cancelamento</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Assinaturas canceladas</span>
              <span className="text-white font-semibold">{churnMetrics.cancelled} de {churnMetrics.total}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-300 mb-3">Motivos de cancelamento:</p>
            {churnMetrics.reasons.map((reason, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-slate-400">{reason.reason}</span>
                  <span className="text-white font-semibold">{reason.percentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${reason.percentage}%` }}
                  />
                </div>
              </div>
            ))}
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
              <p className="text-sm text-slate-400">Agendamentos</p>
              <p className="text-2xl font-bold text-white">1.234</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400 font-semibold">
            <ArrowUp className="w-4 h-4" />
            18.2% vs. período anterior
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Novos Usuários</p>
              <p className="text-2xl font-bold text-white">456</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400 font-semibold">
            <ArrowUp className="w-4 h-4" />
            24.5% vs. período anterior
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Valor Transacionado</p>
              <p className="text-2xl font-bold text-white">R$ 45.6k</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400 font-semibold">
            <ArrowUp className="w-4 h-4" />
            32.1% vs. período anterior
          </div>
        </div>
      </div>
    </div>
  );
}
