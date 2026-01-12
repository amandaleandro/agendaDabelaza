"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { DollarSign, RefreshCw, CheckCircle2, Clock, AlertCircle, TrendingDown } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

interface Refund {
  id: string;
  appointmentId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  appointment?: {
    scheduledAt: string;
    service?: {
      name: string;
    };
    professional?: {
      name: string;
    };
  };
}

export default function RefundsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    loadRefunds();
  }, [user?.id]);

  const loadRefunds = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/refunds/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRefunds(data);
        
        // Calcular totais
        const completed = data
          .filter((r: Refund) => r.status === 'COMPLETED')
          .reduce((sum: number, r: Refund) => sum + r.amount, 0);
        
        const pending = data
          .filter((r: Refund) => r.status === 'PENDING' || r.status === 'APPROVED')
          .reduce((sum: number, r: Refund) => sum + r.amount, 0);
        
        setTotalRefunded(completed);
        setTotalPending(pending);
      }
    } catch (error) {
      console.error('Erro ao carregar reembolsos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle2 };
      case 'PENDING':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: Clock };
      case 'APPROVED':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: RefreshCw };
      case 'REJECTED':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertCircle };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: AlertCircle };
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovado',
      COMPLETED: 'Concluído',
      REJECTED: 'Rejeitado',
    };
    return labels[status] || status;
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
      <h1 className="text-white text-3xl font-bold mb-6">Reembolsos</h1>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Reembolsado</p>
              <p className="text-white text-3xl font-bold">R$ {totalRefunded.toFixed(2)}</p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: hexToRgba(primary, 0.2) }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: primary }} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Pendente</p>
              <p className="text-white text-3xl font-bold">R$ {totalPending.toFixed(2)}</p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: hexToRgba(primary, 0.2) }}
            >
              <Clock className="w-6 h-6" style={{ color: primary }} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Reembolsos */}
      {refunds.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <TrendingDown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Nenhum reembolso encontrado</h2>
          <p className="text-slate-400">
            Você ainda não realizou nenhum pedido de reembolso. <br />
            Quando cancelar um agendamento, poderá solicitar o reembolso aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => {
            const statusColor = getStatusColor(refund.status);
            const IconComponent = statusColor.icon;

            return (
              <div
                key={refund.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Serviço */}
                    {refund.appointment?.service && (
                      <div>
                        <p className="text-white font-semibold">{refund.appointment.service.name}</p>
                        {refund.appointment?.professional && (
                          <p className="text-slate-400 text-sm">
                            com {refund.appointment.professional.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Motivo */}
                    <div>
                      <p className="text-slate-400 text-sm">Motivo: <span className="text-white">{refund.reason}</span></p>
                    </div>

                    {/* Data */}
                    {refund.appointment?.scheduledAt && (
                      <p className="text-slate-400 text-sm">
                        Data: {new Date(refund.appointment.scheduledAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {/* Valor */}
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Valor do Reembolso</p>
                      <p className="text-white text-2xl font-bold" style={{ color: primary }}>
                        R$ {refund.amount.toFixed(2)}
                      </p>
                    </div>

                    {/* Status */}
                    <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${statusColor.bg} ${statusColor.border}`}>
                      <IconComponent className="w-4 h-4" />
                      <span className={`text-sm font-semibold ${statusColor.text}`}>
                        {getStatusLabel(refund.status)}
                      </span>
                    </div>

                    {/* Data de Criação */}
                    <p className="text-slate-500 text-xs">
                      Solicitado em {new Date(refund.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-200 font-medium mb-1">Como funciona os reembolsos?</p>
            <ul className="text-blue-200/80 text-sm space-y-1 list-disc list-inside">
              <li>Cancelamentos com 24h+ de antecedência: reembolso total</li>
              <li>Cancelamentos com menos de 24h: reembolso parcial (70%)</li>
              <li>Reembolsos em assinatura serão creditados em créditos</li>
              <li>Reembolsos diretos serão processados em até 5 dias úteis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
