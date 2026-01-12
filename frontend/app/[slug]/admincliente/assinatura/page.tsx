"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Calendar, Check, X, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

interface ClientSubscription {
  id: string;
  planName: string;
  totalCredits: number;
  usedCredits: number;
  creditsRemaining: number;
  status: string;
  price: number;
  startedAt: string;
  expiresAt: string;
  servicePlanId?: string;
}

export default function AssinaturaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(`http://localhost:3001/api/client-subscriptions/establishment/${params.slug}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Erro ao carregar assinaturas:', error);
        setError('Erro ao carregar suas assinaturas');
      } finally {
        setLoading(false);
      }
    };
    loadSubscriptions();
  }, [user?.email, params.slug]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    setProcessingCancel(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:3001/api/client-subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (res.ok) {
        setSuccess('Assinatura cancelada com sucesso!');
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === subscriptionId 
              ? { ...sub, status: 'CANCELLED' } 
              : sub
          )
        );
        setConfirmCancel(null);
      } else {
        setError('Erro ao cancelar assinatura');
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao cancelar assinatura');
    } finally {
      setProcessingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-3xl font-bold">Minhas Assinaturas</h1>
          <p className="text-slate-400 mt-1">Gerenciar seus planos e créditos</p>
        </div>
        <button
          onClick={() => router.push(`/${slug}/planos`)}
          className="px-4 py-2 rounded-lg text-white font-semibold transition-all hover:brightness-110"
          style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
        >
          Novo Plano
        </button>
      </div>

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

      {subscriptions.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: hexToRgba(primary, 0.1) }}
          >
            <X className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-white text-2xl font-semibold mb-3">Nenhuma Assinatura Ativa</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Você ainda não possui assinaturas. Escolha um plano e comece a aproveitar os benefícios!
          </p>
          <button
            onClick={() => router.push(`/${slug}/planos`)}
            className="px-8 py-4 rounded-xl text-white font-semibold transition-all hover:brightness-110"
            style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
          >
            Ver Planos Disponíveis
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {subscriptions
            .filter(sub => sub.status === 'ACTIVE')
            .map((subscription) => (
              <div
                key={subscription.id}
                className="rounded-xl p-6 border"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${hexToRgba(primary, 0.12)}, ${hexToRgba(secondary, 0.12)})`,
                  borderColor: hexToRgba(primary, 0.3),
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-white text-2xl font-bold mb-2">{subscription.planName}</h2>
                    <p className="text-slate-300">R$ {subscription.price.toFixed(2)}</p>
                  </div>
                  <div
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: hexToRgba(primary, 0.2), color: primary }}
                  >
                    ATIVO
                  </div>
                </div>

                {/* Créditos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: hexToRgba(primary, 0.2) }}
                      >
                        <CreditCard className="w-6 h-6" style={{ color: primary }} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Créditos Disponíveis</p>
                        <p className="text-white text-3xl font-bold">{subscription.creditsRemaining}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(subscription.creditsRemaining / subscription.totalCredits) * 100}%`,
                          backgroundColor: primary,
                        }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      {subscription.creditsRemaining} de {subscription.totalCredits} créditos
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: hexToRgba(secondary, 0.2) }}
                      >
                        <Calendar className="w-6 h-6" style={{ color: secondary }} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Vence em</p>
                        <p className="text-white text-lg font-semibold">
                          {new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Renova automaticamente
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/${slug}/planos`)}
                    className="flex-1 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Alterar Plano
                  </button>
                  {confirmCancel === subscription.id ? (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => handleCancelSubscription(subscription.id)}
                        disabled={processingCancel}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingCancel ? 'Cancelando...' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(null)}
                        disabled={processingCancel}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Voltar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(subscription.id)}
                      className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
