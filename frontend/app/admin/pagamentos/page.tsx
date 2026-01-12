"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Wallet, CheckCircle2, Loader2, DollarSign, AlertCircle, ShoppingBag, Scissors, TrendingUp } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Payment, PaymentStatus, PaymentType, Subscription, SubscriptionStatus } from '@/types';

const api = new ApiClient();

export default function PagamentosPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [paymentsData, subscriptionsData] = await Promise.all([
        api.listPayments(),
        api.listSubscriptions(),
      ]);
      setPayments(paymentsData);
      setSubscriptions(subscriptionsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payment = await api.createPayment({
        appointmentId,
        amount: Number(amount),
      });
      setLastPaymentId(payment.id);
      setAppointmentId('');
      setAmount('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeLabel = (type: PaymentType) => {
    const labels = {
      [PaymentType.FULL]: 'Pagamento completo',
      [PaymentType.DEPOSIT]: 'Sinal/Depósito',
      [PaymentType.CANCELLATION_FEE]: 'Taxa de cancelamento',
    };
    return labels[type] || type;
  };

  const getPaymentTypeBadge = (type: PaymentType) => {
    const styles = {
      [PaymentType.FULL]: 'bg-emerald-500/10 text-emerald-400',
      [PaymentType.DEPOSIT]: 'bg-amber-500/10 text-amber-400',
      [PaymentType.CANCELLATION_FEE]: 'bg-red-500/10 text-red-400',
    };
    return styles[type] || 'bg-slate-500/10 text-slate-400';
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const styles = {
      [PaymentStatus.PAID]: 'bg-emerald-500/10 text-emerald-400',
      [PaymentStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
      [PaymentStatus.FAILED]: 'bg-red-500/10 text-red-400',
      [PaymentStatus.REFUNDED]: 'bg-slate-500/10 text-slate-400',
    };
    const labels = {
      [PaymentStatus.PAID]: 'Pago',
      [PaymentStatus.PENDING]: 'Pendente',
      [PaymentStatus.FAILED]: 'Falhou',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
    };
    return { style: styles[status] || styles[PaymentStatus.PENDING], label: labels[status] || status };
  };

  const getSubscriptionStatusBadge = (status: SubscriptionStatus) => {
    const styles = {
      [SubscriptionStatus.ACTIVE]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      [SubscriptionStatus.CANCELLED]: 'bg-red-500/10 text-red-400 border-red-500/20',
      [SubscriptionStatus.EXPIRED]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    const labels = {
      [SubscriptionStatus.ACTIVE]: 'Ativa',
      [SubscriptionStatus.CANCELLED]: 'Cancelada',
      [SubscriptionStatus.EXPIRED]: 'Expirada',
    };
    return { style: styles[status] || styles[SubscriptionStatus.ACTIVE], label: labels[status] || status };
  };

  const totalPaid = payments.filter(p => p.status === PaymentStatus.PAID).reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === PaymentStatus.PENDING).reduce((sum, p) => sum + p.amount, 0);
  const activeSubscriptions = subscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Pagamentos</h1>
        <p className="mt-1 text-sm text-slate-400">Gerencie pagamentos, assinaturas e transações do sistema.</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total recebido</p>
              <p className="text-2xl font-bold text-white">R$ {totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pendente</p>
              <p className="text-2xl font-bold text-white">R$ {totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-3">
              <CreditCard className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total de pagamentos</p>
              <p className="text-2xl font-bold text-white">{payments.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Wallet className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Assinaturas ativas</p>
              <p className="text-2xl font-bold text-white">{activeSubscriptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de criação */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-lg bg-indigo-500/10 p-2.5">
            <CreditCard className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Registrar novo pagamento</h2>
            <p className="text-sm text-slate-400">Crie um pagamento à vista vinculado a um agendamento.</p>
          </div>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreatePayment}>
          <div>
            <label className="block text-sm font-medium text-slate-300">ID do agendamento</label>
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Ex: abc123..."
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Valor (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {lastPaymentId && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Pagamento criado: {lastPaymentId}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                </span>
              ) : (
                'Criar pagamento'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Status das assinaturas */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Status das Assinaturas</h2>
        {loadingData ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
            Nenhuma assinatura encontrada
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((sub) => {
              const statusBadge = getSubscriptionStatusBadge(sub.status);
              return (
                <div key={sub.id} className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{sub.planType}</h3>
                      <p className="text-sm text-slate-400">Owner: {sub.ownerId.slice(0, 8)}...</p>
                    </div>
                    <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${statusBadge.style}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Início:</span>
                      <span className="text-slate-300">{new Date(sub.startedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {sub.expiresAt && (
                      <div className="flex justify-between text-slate-400">
                        <span>Expira em:</span>
                        <span className="text-slate-300">{new Date(sub.expiresAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de pagamentos */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Histórico de Pagamentos</h2>
        {loadingData ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando pagamentos...
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="rounded-full bg-slate-800/50 p-4 inline-block mb-4">
              <CreditCard className="h-10 w-10 text-slate-500" />
            </div>
            <p className="text-lg font-semibold text-white">Nenhum pagamento registrado</p>
            <p className="mt-1 text-sm text-slate-400">Os pagamentos aparecerão aqui quando forem criados.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => {
              const statusBadge = getStatusBadge(payment.status);
              const typeBadge = getPaymentTypeBadge(payment.type);
              
              return (
                <div key={payment.id} className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 transition-all hover:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`rounded-lg px-3 py-1 text-xs font-semibold ${typeBadge}`}>
                          {getPaymentTypeLabel(payment.type)}
                        </div>
                        <div className={`rounded-lg px-3 py-1 text-xs font-semibold ${statusBadge.style}`}>
                          {statusBadge.label}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Agendamento:</span>
                          <span className="text-slate-300 font-mono">{payment.appointmentId.slice(0, 12)}...</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>ID:</span>
                          <span className="text-slate-300 font-mono text-xs">{payment.id.slice(0, 16)}...</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Data:</span>
                          <span className="text-slate-300">{new Date(payment.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-400">R$ {payment.amount.toFixed(2)}</div>
                      <div className="mt-2 space-y-1 text-xs text-slate-400">
                        <div>Taxa plataforma: R$ {payment.platformFee.toFixed(2)}</div>
                        <div>Profissional: R$ {payment.professionalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
