"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Calendar, Clock, DollarSign, User, X, AlertCircle } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

interface AppointmentItem {
  id: string;
  scheduledAt: string;
  status: string;
  price: number;
  serviceId: string;
  professionalId: string;
  service?: { name: string; durationMinutes: number };
  professional?: { name: string };
}

export default function ClientAppointmentsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  const loadAppointments = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/appointments/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        // Buscar detalhes de cada agendamento
        const detailed = await Promise.all(
          data.map(async (apt: AppointmentItem) => {
            try {
              const detailRes = await fetch(`http://localhost:3001/api/appointments/${apt.id}`);
              if (detailRes.ok) {
                return await detailRes.json();
              }
              return apt;
            } catch {
              return apt;
            }
          })
        );
        setAppointments(detailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    setCancelingId(appointmentId);
    try {
      const res = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
      });
      
      if (res.ok) {
        alert('Agendamento cancelado com sucesso!');
        loadAppointments(); // Recarregar lista
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao cancelar agendamento');
      }
    } catch (error) {
      alert('Erro ao cancelar agendamento');
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' };
      case 'SCHEDULED':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' };
      case 'CANCELLED':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
      case 'COMPLETED':
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendado',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
      COMPLETED: 'Concluído',
      NO_SHOW: 'Não Compareceu',
    };
    return labels[status] || status;
  };

  const canCancel = (scheduledAt: string, status: string) => {
    if (status === 'CANCELLED' || status === 'COMPLETED') return false;
    const appointmentDate = new Date(scheduledAt);
    const now = new Date();
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 24; // Permitir cancelamento com 24h de antecedência
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
      <h1 className="text-white text-3xl font-bold mb-6">Meus Agendamentos</h1>

      {appointments.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Nenhum agendamento encontrado</h2>
          <p className="text-slate-400 mb-6">Você ainda não realizou nenhum agendamento.</p>
          <a
            href={`/${slug}/agendar`}
            className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-all hover:brightness-110"
            style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
          >
            Fazer Agendamento
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const statusColor = getStatusColor(apt.status);
            const isPast = new Date(apt.scheduledAt) < new Date();
            const canCancelThis = canCancel(apt.scheduledAt, apt.status);

            return (
              <div
                key={apt.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Data e Hora */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: hexToRgba(primary, 0.2) }}
                      >
                        <Calendar className="w-5 h-5" style={{ color: primary }} />
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {(() => {
                            if (!apt.scheduledAt) return 'Data indisponível';
                            try {
                              // Parsear como data local do Brasil (ISO string é interpretada como UTC, mas o banco armazena em local)
                              const dateStr = apt.scheduledAt;
                              const date = new Date(dateStr);
                              
                              return date.toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              });
                            } catch (e) {
                              return 'Data inválida';
                            }
                          })()}
                        </p>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {(() => {
                            if (!apt.scheduledAt) return 'Horário indisponível';
                            try {
                              const dateStr = apt.scheduledAt;
                              const date = new Date(dateStr);
                              return date.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              });
                            } catch (e) {
                              return 'Horário inválido';
                            }
                          })()}
                          {apt.service && ` • ${apt.service.durationMinutes}min`}
                        </p>
                      </div>
                    </div>

                    {/* Serviço e Profissional */}
                    <div className="flex items-center gap-3 pl-13">
                      <div>
                        {apt.service && (
                          <p className="text-white font-medium">{apt.service.name}</p>
                        )}
                        {apt.professional && (
                          <p className="text-slate-400 text-sm flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {apt.professional.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="flex items-center gap-2 pl-13">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <span className="text-white font-semibold">R$ {apt.price?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Status e Ações */}
                  <div className="flex flex-col gap-3 items-end">
                    <div className={`px-4 py-2 rounded-lg border ${statusColor.bg} ${statusColor.border}`}>
                      <span className={`text-sm font-semibold ${statusColor.text}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>

                    {canCancelThis ? (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        disabled={cancelingId === apt.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        {cancelingId === apt.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    ) : !canCancelThis && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <AlertCircle className="w-4 h-4" />
                        Não é possível cancelar
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
