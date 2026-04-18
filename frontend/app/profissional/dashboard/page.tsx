'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, DollarSign, Scissors, Users } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Appointment } from '@/types';
import { useAuth } from '@/store/auth';

const api = new ApiClient();

export default function ProfissionalDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const data = await api.listAppointmentsByProfessional(user.id);
        setAppointments(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const todayKey = new Date().toDateString();

  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(
      (appointment) => new Date(appointment.scheduledAt).toDateString() === todayKey,
    );
    const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED');
    const revenue = completed.reduce(
      (sum, appointment) => sum + (appointment.totals?.total ?? appointment.price),
      0,
    );
    const clients = new Set(appointments.map((appointment) => appointment.userId)).size;

    return {
      today: todayAppointments.length,
      completed: completed.length,
      revenue,
      clients,
      nextAppointments: todayAppointments.slice(0, 5),
    };
  }, [appointments, todayKey]);

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Resumo do dia</p>
        <h1 className="mt-2 text-3xl font-black">Olá, {user?.name?.split(' ')[0] || 'profissional'}</h1>
        <p className="mt-2 text-slate-400">Acompanhe seus atendimentos, ganhos e o que ainda falta fechar hoje.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Atendimentos hoje', value: stats.today, icon: CalendarClock },
          { label: 'Serviços concluídos', value: stats.completed, icon: CheckCircle2 },
          { label: 'Receita concluída', value: `R$ ${stats.revenue.toFixed(2)}`, icon: DollarSign },
          { label: 'Clientes atendidos', value: stats.clients, icon: Users },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Próximos atendimentos de hoje</h2>
            <p className="text-sm text-slate-400">Use a aba de atendimentos para adicionar extras e finalizar cobranças.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {stats.nextAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-slate-400">
              Nenhum atendimento marcado para hoje.
            </div>
          ) : (
            stats.nextAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{appointment.user?.name || 'Cliente'}</p>
                  <p className="text-sm text-slate-400">{appointment.service?.name || 'Serviço'}</p>
                </div>
                <div className="text-sm text-slate-300">
                  {new Date(appointment.scheduledAt).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </div>
                <div className="text-sm font-semibold text-cyan-300">
                  Saldo: R$ {(appointment.totals?.remaining ?? 0).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
