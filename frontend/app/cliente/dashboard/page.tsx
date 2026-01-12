'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  TrendingUp,
  CalendarCheck,
  CalendarX,
  DollarSign,
  Sparkles
} from 'lucide-react';

const api = new ApiClient();

export default function ClienteDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const data = await api.listAppointmentsByClient(user.id);
        setAppointments(data);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => apt.scheduledAt && new Date(apt.scheduledAt) > now && apt.status === 'SCHEDULED'
  );
  const completedAppointments = appointments.filter((apt) => apt.status === 'COMPLETED');
  const cancelledAppointments = appointments.filter((apt) => apt.status === 'CANCELLED');
  const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);

  const stats = [
    {
      label: 'Próximos Agendamentos',
      value: upcomingAppointments.length,
      icon: CalendarCheck,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Agendamentos Concluídos',
      value: completedAppointments.length,
      icon: Calendar,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Total Gasto',
      value: `R$ ${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Cancelados',
      value: cancelledAppointments.length,
      icon: CalendarX,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-500/20',
    },
  ];

  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-indigo-400" />
          Olá, {user?.name?.split(' ')[0] || 'Cliente'}!
        </h1>
        <p className="text-slate-400 mt-2">Bem-vindo(a) ao seu painel. Aqui você gerencia seus agendamentos e perfil.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border ${stat.border} ${stat.bg} p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Next Appointment Card */}
      {nextAppointment && (
        <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Próximo Agendamento</h3>
              </div>
              <div className="space-y-2 text-slate-300">
                <p>
                  <span className="text-slate-400">Serviço:</span>{' '}
                  <span className="font-semibold">{nextAppointment.service?.name || 'Serviço'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Profissional:</span>{' '}
                  <span className="font-semibold">{nextAppointment.professional?.name || 'N/A'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Data:</span>{' '}
                  <span className="font-semibold">
                    {new Date(nextAppointment.scheduledAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Valor:</span>{' '}
                  <span className="font-semibold text-emerald-400">R$ {nextAppointment.price?.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/cliente/agendamentos')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/cliente/agendamentos')}
          className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 text-left hover:border-slate-700 transition-colors group"
        >
          <Calendar className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold text-white mb-1">Meus Agendamentos</h3>
          <p className="text-sm text-slate-400">Ver todos os agendamentos passados e futuros</p>
        </button>

        <button
          onClick={() => router.push('/cliente/perfil')}
          className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 text-left hover:border-slate-700 transition-colors group"
        >
          <TrendingUp className="h-8 w-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold text-white mb-1">Meu Perfil</h3>
          <p className="text-sm text-slate-400">Editar informações pessoais</p>
        </button>

        <button
          onClick={() => router.push('/cliente/assinaturas')}
          className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 text-left hover:border-slate-700 transition-colors group"
        >
          <CreditCard className="h-8 w-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold text-white mb-1">Minhas Assinaturas</h3>
          <p className="text-sm text-slate-400">Gerenciar planos e assinaturas</p>
        </button>
      </div>

      {/* Recent Activity */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Carregando atividades...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum agendamento ainda</h3>
          <p className="text-slate-400 mb-4">Faça seu primeiro agendamento para começar!</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
          >
            Agendar Agora
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {appointments.slice(0, 5).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    apt.status === 'SCHEDULED' ? 'bg-blue-400' :
                    apt.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{apt.service?.name || 'Serviço'}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(apt.scheduledAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  apt.status === 'SCHEDULED' ? 'text-blue-400' :
                  apt.status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {apt.status === 'SCHEDULED' ? 'Agendado' :
                   apt.status === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
