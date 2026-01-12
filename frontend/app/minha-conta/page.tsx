 'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';
import { CreditCard, LogOut, Trash2, UploadCloud, AlertCircle, Check, User as UserIcon } from 'lucide-react';

interface ClientSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  expiryDate?: string;
  totalPrice: number;
  remainingValue: number;
}

interface Transaction {
  id: string;
  type: 'SUBSCRIPTION' | 'UPGRADE' | 'REFUND';
  description: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface AvailablePlan {
  id: string;
  name: string;
  price: number;
  description: string;
}

function MinhaContaContent() {
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get('slug');
  const [slug, setSlug] = useState<string | null>(urlSlug);
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assinaturas' | 'pagamentos' | 'trocar'>('assinaturas');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const clientEmail = 'cliente@example.com';

  const { resolvedSlug, primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    fallbackToStoredSlug: true,
    fetchIfMissing: true,
    defaultPrimary: '#7c3aed',
    defaultSecondary: '#2563eb',
  });

  useEffect(() => {
    loadData();
    // TODO: Buscar email do localStorage/contexto de autenticação
  }, []);

  useEffect(() => {
    if (!slug && resolvedSlug) {
      setSlug(resolvedSlug);
    }
  }, [resolvedSlug, slug]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Buscar assinaturas do cliente
      const subsResponse = await fetch(
        `http://localhost:3001/api/client-subscriptions/email/${clientEmail}`
      );
      if (subsResponse.ok) {
        const data = await subsResponse.json();
        setSubscriptions(Array.isArray(data) ? data : []);
      }

      // Buscar transações
      const transResponse = await fetch(
        `http://localhost:3001/api/transactions/email/${clientEmail}`
      );
      if (transResponse.ok) {
        const data = await transResponse.json();
        setTransactions(Array.isArray(data) ? data : []);
      }

      // Buscar planos disponíveis
      const plansResponse = await fetch(
        'http://localhost:3001/api/service-plans/public'
      );
      if (plansResponse.ok) {
        const data = await plansResponse.json();
        setAvailablePlans(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `http://localhost:3001/api/client-subscriptions/upgrade`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail,
            newPlanId: selectedPlan,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (response.ok) {
        setSuccess('Plano atualizado com sucesso!');
        setShowChangeModal(false);
        loadData();
      } else {
        setError(data.message || 'Erro ao atualizar plano');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao processar alteração');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este plano?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/client-subscriptions/${subscriptionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSuccess('Plano cancelado com sucesso');
        loadData();
      } else {
        setError('Erro ao cancelar plano');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao cancelar plano');
    }
  };

  const handleLogout = () => {
    // TODO: Implementar logout real
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Minha Conta</h1>
            <p className="text-slate-400">{clientEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Plano Atual */}
        {activeSubscription && (
          <div
            className="mb-8 rounded-lg p-6"
            style={{
              backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})`,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{activeSubscription.planName}</h2>
                <p className="text-white/90">
                  Válido até {new Date(activeSubscription.expiryDate || '').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  R$ {activeSubscription.remainingValue.toFixed(2)}
                </div>
                <p className="text-purple-100 text-sm">Saldo disponível</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowChangeModal(true)}
                className="bg-white hover:bg-slate-50 px-6 py-2 rounded-lg font-semibold transition-colors"
                style={{ color: primary }}
              >
                Trocar Plano
              </button>
              <button
                onClick={() => handleCancelSubscription(activeSubscription.id)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="mb-8 flex gap-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('assinaturas')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'assinaturas'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📋 Meus Planos
          </button>
          <button
            onClick={() => setActiveTab('pagamentos')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'pagamentos'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            💳 Histórico de Pagamentos
          </button>
          <button
            onClick={() => setActiveTab('trocar')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'trocar'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            ✨ Explorar Planos
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'assinaturas' && (
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <p className="text-slate-400 text-lg">Nenhum plano ativo</p>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`bg-slate-800/50 border rounded-lg p-6 ${
                    sub.status === 'ACTIVE' ? '' : 'border-slate-700'
                  }`}
                  style={{ borderColor: sub.status === 'ACTIVE' ? hexToRgba(primary, 0.3) : undefined }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{sub.planName}</h3>
                      <div className="mt-2 space-y-1 text-slate-400 text-sm">
                        <p>Iniciado: {new Date(sub.startDate).toLocaleDateString('pt-BR')}</p>
                        {sub.expiryDate && (
                          <p>Vence: {new Date(sub.expiryDate).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-400'
                          : sub.status === 'EXPIRED'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {sub.status === 'ACTIVE' ? '✅ Ativo' : sub.status === 'EXPIRED' ? '⏱️ Expirado' : '❌ Cancelado'}
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold text-white">R$ {sub.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pagamentos' && (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Nenhuma transação registrada</p>
              </div>
            ) : (
              transactions.map((trans) => (
                <div
                  key={trans.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      trans.type === 'SUBSCRIPTION'
                        ? 'bg-blue-500/10'
                        : trans.type === 'UPGRADE'
                        ? 'bg-purple-500/10'
                        : 'bg-green-500/10'
                    }`}>
                      <CreditCard className={`w-6 h-6 ${
                        trans.type === 'SUBSCRIPTION'
                          ? 'text-blue-400'
                          : trans.type === 'UPGRADE'
                          ? 'text-purple-400'
                          : 'text-green-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{trans.description}</p>
                      <p className="text-slate-400 text-sm">{new Date(trans.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">R$ {trans.amount.toFixed(2)}</p>
                    <p className={`text-xs font-semibold ${
                      trans.status === 'COMPLETED'
                        ? 'text-green-400'
                        : trans.status === 'PENDING'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {trans.status === 'COMPLETED' ? '✓ Confirmado' : trans.status === 'PENDING' ? '⏳ Pendente' : '✗ Falhou'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'trocar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availablePlans.length === 0 ? (
              <div className="col-span-full bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <p className="text-slate-400 text-lg">Nenhum plano disponível</p>
              </div>
            ) : (
              availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-800/50 border rounded-lg p-6 transition-all"
                  style={{ borderColor: hexToRgba(primary, 0.2) }}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: primary }}>R$ {plan.price.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setShowChangeModal(true);
                    }}
                    className="w-full text-white px-4 py-2 rounded-lg font-semibold transition-colors hover:brightness-110"
                    style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                  >
                    Escolher este Plano
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal de Confirmação */}
        {showChangeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">Confirmar Mudança de Plano</h3>

              {selectedPlan && (
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Novo Plano:</p>
                    <p className="text-white font-semibold text-lg">
                      {availablePlans.find(p => p.id === selectedPlan)?.name}
                    </p>
                  </div>

                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: hexToRgba(primary, 0.08), border: `1px solid ${hexToRgba(primary, 0.3)}` }}
                  >
                    <p className="text-slate-300 text-sm mb-2">Valor:</p>
                    <p className="text-3xl font-bold" style={{ color: primary }}>
                      R$ {availablePlans.find(p => p.id === selectedPlan)?.price.toFixed(2)}
                    </p>
                  </div>

                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: hexToRgba(secondary, 0.08), border: `1px solid ${hexToRgba(secondary, 0.3)}`, color: secondary }}
                  >
                    <p className="text-sm">
                      ✓ Você será redirecionado para confirmar o pagamento
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangeModal(false)}
                  disabled={processing}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpgradePlan}
                  disabled={processing}
                  className="flex-1 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 hover:brightness-110"
                  style={{ backgroundColor: primary }}
                >
                  {processing ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MinhaConta() {
  return (
    <Suspense fallback={<div className="text-center py-12">Carregando...</div>}>
      <MinhaContaContent />
    </Suspense>
  );
}
