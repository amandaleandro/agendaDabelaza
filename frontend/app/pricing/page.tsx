'use client';

import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  platformFeePercent: number;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    // TODO: Implementar redirect para checkout ou ativação
    const establishmentId = localStorage.getItem('establishmentId');
    const ownerId = localStorage.getItem('ownerId');

    if (!establishmentId || !ownerId) {
      alert('Faça login primeiro');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/subscriptions/establishment/${establishmentId}/plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planType: planId,
            ownerId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        window.location.href = '/admin/dashboard';
      } else {
        alert('Erro ao ativar plano');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao ativar plano');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'FREE':
        return <Zap className="w-8 h-8" />;
      case 'BASIC':
        return <Check className="w-8 h-8" />;
      case 'PRO':
        return <Crown className="w-8 h-8" />;
      case 'PREMIUM':
        return <Rocket className="w-8 h-8" />;
      default:
        return <Check className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'FREE':
        return 'from-gray-500 to-gray-600';
      case 'BASIC':
        return 'from-blue-500 to-blue-600';
      case 'PRO':
        return 'from-purple-500 to-purple-600';
      case 'PREMIUM':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-slate-400">
            Comece grátis ou escolha o plano ideal para seu negócio
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              14 dias grátis em planos pagos
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-purple-500 bg-slate-800/80 shadow-2xl shadow-purple-500/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-bold">
                    MAIS POPULAR
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Icon */}
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getPlanColor(
                    plan.id
                  )} text-white mb-4`}
                >
                  {getPlanIcon(plan.id)}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-400">/mês</span>
                    )}
                  </div>
                  {plan.platformFeePercent > 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      + {plan.platformFeePercent}% por transação
                    </p>
                  )}
                  {plan.platformFeePercent === 0 && plan.price > 0 && (
                    <p className="text-sm text-green-400 mt-1 font-medium">
                      Sem comissão! 🎉
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30'
                      : plan.recommended
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  } ${
                    selectedPlan === plan.id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Ativando...
                    </span>
                  ) : plan.price === 0 ? (
                    'Começar Grátis'
                  ) : (
                    'Iniciar Trial 14 dias'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            <details className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Posso mudar de plano depois?
              </summary>
              <p className="mt-3 text-slate-400">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento.
                Sem burocracia, sem multas.
              </p>
            </details>

            <details className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                O que acontece após o trial de 14 dias?
              </summary>
              <p className="mt-3 text-slate-400">
                Após 14 dias, você escolhe: continuar no plano pago ou voltar
                para o plano FREE (com 10% de comissão).
              </p>
            </details>

            <details className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Como funciona a comissão?
              </summary>
              <p className="mt-3 text-slate-400">
                No plano FREE: 10% de cada transação online. No BASIC: 5%. Nos
                planos PRO e PREMIUM: sem comissão!
              </p>
            </details>

            <details className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Qual o melhor custo-benefício?
              </summary>
              <p className="mt-3 text-slate-400">
                Depende do seu faturamento. Até R$ 10.000/mês: FREE ou BASIC.
                Acima de R$ 10.000/mês: PRO (sem comissão economiza muito!).
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
