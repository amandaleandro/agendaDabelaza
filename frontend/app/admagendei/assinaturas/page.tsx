'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Trash2
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Subscription, SubscriptionStatus, PlanType } from '@/types';

const api = new ApiClient();

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SubscriptionStatus>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await api.listSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await api.cancelSubscription(subscriptionId);
      setSubscriptions(prev => 
        prev.map(sub => sub.id === subscriptionId ? { ...sub, status: 'CANCELLED' as SubscriptionStatus } : sub)
      );
      setConfirmDelete(null);
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('Erro ao cancelar assinatura');
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.ownerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    cancelled: subscriptions.filter(s => s.status === 'CANCELLED').length,
    expired: subscriptions.filter(s => s.status === 'EXPIRED').length,
    revenue: subscriptions.filter(s => s.status === 'ACTIVE').length * 99.90
  };

  const planColors = {
    FREE: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
    PRO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    ENTERPRISE: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' }
  };

  const statusConfig = {
    ACTIVE: { icon: CheckCircle, color: 'emerald', label: 'Ativo' },
    CANCELLED: { icon: XCircle, color: 'red', label: 'Cancelado' },
    EXPIRED: { icon: Clock, color: 'amber', label: 'Expirado' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <CreditCard className="h-8 w-8 text-purple-400" />
          </div>
          Assinaturas
        </h1>
        <p className="text-slate-400 mt-2">Gerencie todas as assinaturas da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Ativas</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Canceladas</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.cancelled}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Expiradas</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{stats.expired}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">MRR</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <DollarSign className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por ID do proprietário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="all">Todos os status</option>
          <option value="ACTIVE">Ativas</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="EXPIRED">Expiradas</option>
        </select>

        <button className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <Download className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-sm font-semibold text-slate-400">ID</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Plano</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Início</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Expira em</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Valor</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => {
                  const StatusIcon = statusConfig[subscription.status]?.icon || Clock;
                  const statusColor = statusConfig[subscription.status]?.color || 'slate';
                  const planColor = planColors[subscription.planType];

                  return (
                    <tr
                      key={subscription.id}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <code className="text-sm text-slate-400">{subscription.id.slice(0, 8)}...</code>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${planColor.bg} ${planColor.text} border ${planColor.border}`}>
                          {subscription.planType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[subscription.status]?.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(subscription.startedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {subscription.expiresAt
                          ? new Date(subscription.expiresAt).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="p-4 text-sm font-semibold text-emerald-400">
                        {subscription.planType === 'FREE' ? 'Grátis' :
                         subscription.planType === 'PRO' ? 'R$ 99,90' :
                         'R$ 299,90'}
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          {subscription.status === 'ACTIVE' && (
                            <button
                              onClick={() => setConfirmDelete(subscription.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                              title="Cancelar assinatura"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          {confirmDelete === subscription.id && (
                            <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-3 z-50 min-w-max shadow-xl">
                              <p className="text-xs text-slate-300 mb-2 font-semibold">Cancelar assinatura?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCancelSubscription(subscription.id)}
                                  className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
