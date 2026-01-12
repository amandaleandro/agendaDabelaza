'use client';

import { useState, useEffect } from 'react';
import { Crown, Sparkles, ArrowUpRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionWidgetProps {
  establishmentId: string;
}

export default function SubscriptionWidget({ establishmentId }: SubscriptionWidgetProps) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, [establishmentId]);

  const loadPlan = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/subscriptions/establishment/${establishmentId}`
      );
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'FREE': return 'text-slate-600 dark:text-slate-400';
      case 'BASIC': return 'text-blue-600 dark:text-blue-400';
      case 'PRO': return 'text-purple-600 dark:text-purple-400';
      case 'PREMIUM': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'FREE': return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
      case 'BASIC': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'PRO': return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      case 'PREMIUM': return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const showUpgradeAlert = plan.planType === 'FREE' || plan.planType === 'BASIC';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Seu Plano
          </h3>
          <div className="flex items-center gap-2">
            {plan.planType === 'PRO' || plan.planType === 'PREMIUM' ? (
              <Crown className={`w-5 h-5 ${getPlanColor(plan.planType)}`} />
            ) : (
              <Sparkles className={`w-5 h-5 ${getPlanColor(plan.planType)}`} />
            )}
            <span className={`text-xl font-bold ${getPlanColor(plan.planType)}`}>
              {plan.planType}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadge(plan.planType)}`}>
          Ativo
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Valor mensal:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            R$ {plan.monthlyPrice.toFixed(2)}
          </span>
        </div>

        {plan.hasCommission && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Comissão por transação
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {plan.platformFeePercent}% do valor de cada agendamento
              </p>
            </div>
          </div>
        )}

        {!plan.hasCommission && plan.planType !== 'FREE' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-xs font-medium text-green-800 dark:text-green-300">
              🎉 Sem comissão! 100% do valor é seu.
            </p>
          </div>
        )}
      </div>

      {showUpgradeAlert && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-1">
            {plan.planType === 'FREE' 
              ? '💡 Upgrade e elimine as comissões!' 
              : '💡 Upgrade para PRO e pague 0% de comissão!'}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-400">
            {plan.planType === 'FREE'
              ? 'No plano PRO você não paga comissão por transação.'
              : 'Economize até R$ 50 por mês com o plano PRO.'}
          </p>
        </div>
      )}

      <Link
        href="/admin/assinatura"
        className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
      >
        {showUpgradeAlert ? 'Fazer Upgrade' : 'Gerenciar Assinatura'}
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
