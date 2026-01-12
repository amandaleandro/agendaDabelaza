'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

interface ServiceInPlan {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: number;
}

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  services: ServiceInPlan[];
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function ComprarPlanosPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [slug]);

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    initialPrimary: establishment?.primaryColor,
    initialSecondary: establishment?.secondaryColor,
    persistSlug: true,
    fetchIfMissing: !establishment?.primaryColor || !establishment?.secondaryColor,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Buscar estabelecimento
      const estabResponse = await fetch(
        `http://localhost:3001/api/public/establishments/${slug}`
      );
      if (estabResponse.ok) {
        const estabData = await estabResponse.json();
        setEstablishment(estabData);
      }

      // Buscar planos de serviços
      const plansResponse = await fetch(
        `http://localhost:3001/api/service-plans/public/${slug}`
      );
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(Array.isArray(plansData) ? plansData : []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan || !establishment) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Obter email do usuário (do localStorage ou modal)
      let userEmail = localStorage.getItem('email');
      
      if (!userEmail) {
        userEmail = prompt('Informe seu email para comprar este plano:') || null;
      }
      
      if (!userEmail || !userEmail.includes('@')) {
        setError('Email inválido');
        setProcessing(false);
        return;
      }

      // Chamar API pública para comprar plano
      const response = await fetch(
        `http://localhost:3001/api/public/client-subscriptions/purchase/${selectedPlan}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            establishmentId: establishment.id,
            userEmail: userEmail,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Plano "${data.subscription.planName}" adquirido com sucesso! Você tem ${data.subscription.totalCredits} créditos.`);
        setShowModal(false);
        setSelectedPlan(null);
        
        // Salvar email para próximas compras
        localStorage.setItem('email', userEmail);
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          window.location.href = `/${establishment.slug}/admincliente/assinatura`;
        }, 2000);
      } else {
        setError(data.message || 'Erro ao processar compra');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao processar compra');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Carregando planos...</div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Estabelecimento não encontrado</h1>
          <p className="text-slate-400">Verifique a URL e tente novamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{establishment.name}</h1>
          <p className="text-slate-400 text-lg">Escolha seu plano de serviços</p>
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

        {/* Planos */}
        {plans.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Nenhum plano disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-slate-800/50 border rounded-lg overflow-hidden transition-all hover:shadow-lg"
                style={{
                  borderColor: hexToRgba(primary, 0.3),
                  boxShadow: `0 10px 25px ${hexToRgba(primary, 0.08)}`,
                }}
              >
                <div
                  className="p-4"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})`,
                  }}
                >
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-white/80 text-sm mt-1">{plan.description}</p>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {/* Serviços */}
                  <div className="space-y-2">
                    {plan.services.map((service, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>{service.quantity}x</strong> {service.serviceName}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Preço */}
                  <div className="border-t border-slate-600 pt-4">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-slate-400">Valor total:</span>
                      <div className="text-right">
                        <div className="text-3xl font-bold" style={{ color: primary }}>
                          R$ {plan.totalPrice.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {plan.services.reduce((acc, s) => acc + s.quantity, 0)} atendimentos
                        </p>
                      </div>
                    </div>

                    {/* Detalhamento */}
                    <div className="bg-slate-900/50 rounded p-3 mb-4">
                      {plan.services.map((service, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-400 py-1">
                          <span>{service.quantity}x {service.serviceName}</span>
                          <span>R$ {(service.price * service.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botão */}
                  <button
                    onClick={() => handleBuyPlan(plan.id)}
                    className="w-full text-white px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 hover:brightness-110"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})`,
                    }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Comprar Plano
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmação */}
        {showModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">Confirmar Compra</h3>

              {plans.find(p => p.id === selectedPlan) && (
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Plano:</p>
                    <p className="text-white font-semibold text-lg">
                      {plans.find(p => p.id === selectedPlan)?.name}
                    </p>
                  </div>

                  <div
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor: hexToRgba(primary, 0.08),
                      border: `1px solid ${hexToRgba(primary, 0.3)}`,
                    }}
                  >
                    <p className="text-slate-300 text-sm mb-2">Valor a pagar:</p>
                    <p className="text-3xl font-bold" style={{ color: primary }}>
                      R$ {plans.find(p => p.id === selectedPlan)?.totalPrice.toFixed(2)}
                    </p>
                  </div>

                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: hexToRgba(secondary, 0.08),
                      border: `1px solid ${hexToRgba(secondary, 0.3)}`,
                      color: secondary,
                    }}
                  >
                    <p className="text-sm">
                      ✓ Você terá acesso imediato aos agendamentos
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={processing}
                  className="flex-1 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110"
                  style={{ backgroundColor: primary }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {processing ? 'Processando...' : 'Comprar Agora'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
