'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { CreditCard, Crown, Calendar, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const api = new ApiClient();

export default function ClienteAssinaturasPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.id) return;
      try {
        const data = await api.listSubscriptions();
        // Filter subscriptions for this user
        const userSubs = data.filter((sub: any) => sub.userId === user.id);
        setSubscriptions(userSubs);
      } catch (error) {
        console.error('Erro ao carregar assinaturas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSubscriptions();
  }, [user?.id]);

  const activeSubs = subscriptions.filter((sub) => sub.status === 'ACTIVE');
  const totalValue = activeSubs.reduce((sum, sub) => sum + (sub.price || 0), 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-400">Carregando assinaturas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-indigo-400" />
          Minhas Assinaturas
        </h1>
        <p className="text-slate-400 mt-2">Gerencie seus planos e assinaturas ativas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-indigo-400" />
            <p className="text-sm text-slate-400">Assinaturas Ativas</p>
          </div>
          <p className="text-3xl font-bold text-indigo-400">{activeSubs.length}</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-slate-400">Valor Mensal</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">R$ {totalValue.toFixed(2)}</p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-slate-400">Total de Planos</p>
          </div>
          <p className="text-3xl font-bold text-purple-400">{subscriptions.length}</p>
        </div>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma assinatura encontrada</h3>
          <p className="text-slate-400 mb-6">Você ainda não possui assinaturas ou planos ativos</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
          >
            Explorar Planos
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const isActive = subscription.status === 'ACTIVE';
            const isCancelled = subscription.status === 'CANCELLED';

            return (
              <div
                key={subscription.id}
                className={`rounded-xl border ${
                  isActive ? 'border-emerald-500/30 bg-emerald-500/5' :
                  isCancelled ? 'border-red-500/30 bg-red-500/5' :
                  'border-slate-800 bg-slate-900/40'
                } p-6`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Crown className={`h-6 w-6 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <h3 className="text-xl font-bold text-white">Plano {subscription.planType || 'Padrão'}</h3>
                        <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {isActive && <CheckCircle className="h-3 w-3" />}
                          {isActive ? 'Ativo' : isCancelled ? 'Cancelado' : 'Inativo'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="text-slate-300">
                        <span className="text-slate-400">Valor:</span>{' '}
                        <span className="font-semibold text-emerald-400">
                          R$ {subscription.price?.toFixed(2) || '0.00'}/mês
                        </span>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-400">Início:</span>{' '}
                        <span className="font-semibold">
                          {new Date(subscription.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {subscription.endDate && (
                        <div className="text-slate-300">
                          <span className="text-slate-400">Término:</span>{' '}
                          <span className="font-semibold">
                            {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert('Função de cancelamento será implementada')}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors"
                      >
                        Cancelar Plano
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <AlertCircle className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Informações sobre assinaturas</h3>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• As assinaturas são renovadas automaticamente a cada mês</li>
              <li>• Você pode cancelar a qualquer momento sem multa</li>
              <li>• Após o cancelamento, você continua com acesso até o fim do período pago</li>
              <li>• Para dúvidas, entre em contato com o estabelecimento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
