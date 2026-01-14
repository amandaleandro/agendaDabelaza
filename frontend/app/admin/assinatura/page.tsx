'use client';

import { API_BASE_URL } from '@/config/api';
import { useState, useEffect } from 'react';
import { Check, X, Sparkles, Zap, Crown, Building2, ChevronRight, AlertCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  platformFeePercent: number;
  features: string[];
  popular?: boolean;
}

interface CurrentSubscription {
  planType: string;
  platformFeePercent: number;
  monthlyPrice: number;
  hasCommission: boolean;
  features: string[];
}

export default function AssinaturaPage() {
  const [currentPlan, setCurrentPlan] = useState<CurrentSubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [processingChange, setProcessingChange] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [establishmentId, setEstablishmentId] = useState('');
  const [ownerId, setOwnerId] = useState('');

  useEffect(() => {
    const estId = localStorage.getItem('establishmentId') || '';
    const owId = localStorage.getItem('ownerId') || '';
    setEstablishmentId(estId);
    setOwnerId(owId);
  }, []);

  useEffect(() => {
    if (establishmentId) {
      loadData();
    }
  }, [establishmentId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Buscar plano atual
      const currentResponse = await fetch(
        `${API_BASE_URL}/subscriptions/establishment/${establishmentId}`
      );
      if (currentResponse.ok) {
        const current = await currentResponse.json();
        setCurrentPlan(current);
      }

      // Buscar planos disponíveis
      const plansResponse = await fetch('${API_BASE_URL}/subscriptions/plans');
      if (plansResponse.ok) {
        const data = await plansResponse.json();
        setPlans(data.plans || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar informações da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (currentPlan?.planType === plan.id) {
      setError('Este já é seu plano atual');
      return;
    }
    setSelectedPlan(plan);
    setShowModal(true);
    setError('');
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;

    setProcessingChange(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/subscriptions/establishment/${establishmentId}/plan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planType: selectedPlan.id,
            ownerId: ownerId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Plano alterado para ${selectedPlan.name} com sucesso!`);
        setShowModal(false);
        setTimeout(() => {
          loadData();
        }, 1500);
      } else {
        setError(data.message || 'Erro ao alterar plano');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao processar alteração de plano');
    } finally {
      setProcessingChange(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você voltará para o plano FREE.')) {
      return;
    }

    setProcessingChange(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/subscriptions/establishment/${establishmentId}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: ownerId }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Assinatura cancelada. Você voltou para o plano FREE.');
        setTimeout(() => {
          loadData();
        }, 1500);
      } else {
        setError(data.message || 'Erro ao cancelar assinatura');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao cancelar assinatura');
    } finally {
      setProcessingChange(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'FREE': return <Zap className="w-8 h-8 text-slate-400" />;
      case 'BASIC': return <Sparkles className="w-8 h-8 text-blue-500" />;
      case 'PRO': return <Crown className="w-8 h-8 text-purple-500" />;
      case 'PREMIUM': return <Building2 className="w-8 h-8 text-amber-500" />;
      default: return <Sparkles className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'FREE': return 'from-slate-600 to-slate-700';
      case 'BASIC': return 'from-blue-600 to-blue-700';
      case 'PRO': return 'from-purple-600 to-purple-700';
      case 'PREMIUM': return 'from-amber-600 to-amber-700';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Assinatura</h1>
          <p className="text-slate-400">
            Altere seu plano ou cancele sua assinatura a qualquer momento
          </p>
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
        {currentPlan && (
          <div className={`mb-8 rounded-xl bg-gradient-to-br ${getPlanColor(currentPlan.planType)} p-1`}>
            <div className="bg-slate-900 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {getPlanIcon(currentPlan.planType)}
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Plano {currentPlan.planType}
                      </h2>
                      <p className="text-slate-400">Seu plano atual</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    R$ {currentPlan.monthlyPrice.toFixed(2)}
                  </div>
                  <p className="text-slate-400 text-sm">/mês</p>
                </div>
              </div>

              {currentPlan.hasCommission && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                  <p className="text-amber-400 text-sm">
                    ⚠️ Comissão de {currentPlan.platformFeePercent}% por transação
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {currentPlan.planType !== 'FREE' && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={processingChange}
                  className="mt-6 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {processingChange ? 'Processando...' : 'Cancelar Assinatura'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Outros Planos */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Outros Planos Disponíveis</h2>
          <p className="text-slate-400 mb-6">
            Altere seu plano a qualquer momento. A mudança é imediata!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans
            .filter((plan) => plan.id !== currentPlan?.planType)
            .map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl bg-slate-800/50 border ${
                  plan.popular ? 'border-purple-500' : 'border-slate-700'
                } overflow-hidden transition-all hover:scale-105`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getPlanIcon(plan.id)}
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="text-3xl font-bold text-white">
                      R$ {plan.price.toFixed(2)}
                    </div>
                    <p className="text-slate-400 text-sm">/mês</p>
                  </div>

                  {plan.platformFeePercent > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-4">
                      <p className="text-amber-400 text-xs">
                        + {plan.platformFeePercent}% por transação
                      </p>
                    </div>
                  )}

                  {plan.platformFeePercent === 0 && plan.id !== 'FREE' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-4">
                      <p className="text-green-400 text-xs font-semibold">
                        🎉 Sem comissão!
                      </p>
                    </div>
                  )}

                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    Mudar para {plan.name}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Modal de Confirmação */}
        {showModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                Confirmar Mudança de Plano
              </h3>

              <div className="bg-slate-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400">Plano Atual:</span>
                  <span className="text-white font-semibold">{currentPlan?.planType}</span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <ChevronRight className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-slate-400">Novo Plano:</span>
                  <span className="text-white font-semibold">{selectedPlan.name}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-slate-300">Mudança imediata - começa a valer agora</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-slate-300">
                    Cobrança proporcional: R$ {selectedPlan.price.toFixed(2)}/mês
                  </p>
                </div>
                {selectedPlan.platformFeePercent === 0 ? (
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-green-400 font-semibold">Sem comissão por transação! 🎉</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-amber-400">
                      Comissão de {selectedPlan.platformFeePercent}% por transação
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={processingChange}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmChange}
                  disabled={processingChange}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {processingChange ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

