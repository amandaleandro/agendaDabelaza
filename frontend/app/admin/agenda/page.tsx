'use client';

import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  X,
  Loader2,
  Grid3x3,
  LayoutGrid,
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Appointment, Professional, Client, Service } from '@/types';

const api = new ApiClient();

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filterProfessional, setFilterProfessional] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    professionalId: '',
    serviceId: '',
    scheduledAt: '',
    notes: '',
  });

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsData, professionalsData, clientsData, servicesData] = await Promise.all([
        api.listAppointments(),
        api.listProfessionals(),
        api.listClients(),
        api.listServices(),
      ]);

      setAppointments(appointmentsData);
      setProfessionals(professionalsData);
      setClients(clientsData);
      setServices(servicesData);

      if (professionalsData.length > 0) {
        setFormData((prev) => ({ ...prev, professionalId: professionalsData[0].id }));
      }
      if (servicesData.length > 0) {
        setFormData((prev) => ({ ...prev, serviceId: servicesData[0].id }));
      }
      if (clientsData.length > 0) {
        setFormData((prev) => ({ ...prev, clientId: clientsData[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await api.createAppointment({
        userId: formData.clientId,
        establishmentId: '',
        professionalId: formData.professionalId,
        serviceId: formData.serviceId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });

      await loadData();
      setShowModal(false);
      setFormData({
        clientId: clients[0]?.id || '',
        professionalId: professionals[0]?.id || '',
        serviceId: services[0]?.id || '',
        scheduledAt: '',
        notes: '',
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<Date | null> = [];

    for (let i = 0; i < startingDayOfWeek; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter((appointment) => {
      const appointmentDate = appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().split('T')[0] : null;
      const matchesDate = appointmentDate === dateStr;
      const matchesProfessional = !filterProfessional || appointment.professionalId === filterProfessional;
      return matchesDate && matchesProfessional;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const openCreateModal = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const dateTimeStr = `${date.toISOString().split('T')[0]}T09:00`;
      setFormData((prev) => ({ ...prev, scheduledAt: dateTimeStr }));
    }
    setShowModal(true);
  };

  const statusColors = {
    SCHEDULED: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    COMPLETED: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    CANCELLED: 'border-red-500/20 bg-red-500/10 text-red-400',
  } as const;

  const days = getDaysInMonth(currentDate);

  const stats = {
    today: appointments.filter((appointment) => {
      const appointmentDate = appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().split('T')[0] : null;
      const today = new Date().toISOString().split('T')[0];
      return appointmentDate === today;
    }).length,
    thisWeek: appointments.filter((appointment) => {
      const appointmentDateStr = appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().split('T')[0] : null;
      if (!appointmentDateStr) return false;
      const appointmentDate = new Date(appointmentDateStr);
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return appointmentDate >= weekStart && appointmentDate <= weekEnd;
    }).length,
    thisMonth: appointments.filter((appointment) => {
      const appointmentDateStr = appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().split('T')[0] : null;
      if (!appointmentDateStr) return false;
      const appointmentDate = new Date(appointmentDateStr);
      return appointmentDate.getMonth() === currentDate.getMonth() && appointmentDate.getFullYear() === currentDate.getFullYear();
    }).length,
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
          <div className="rounded-xl bg-indigo-500/10 p-2">
            <CalendarIcon className="h-7 w-7 text-indigo-400 sm:h-8 sm:w-8" />
          </div>
          Agenda
        </h1>
        <p className="mt-2 text-slate-400">Visualize e gerencie todos os agendamentos</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Hoje</p>
              <p className="mt-1 text-3xl font-bold text-white">{stats.today}</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3">
              <CalendarIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Esta Semana</p>
              <p className="mt-1 text-3xl font-bold text-white">{stats.thisWeek}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <LayoutGrid className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Este MÃªs</p>
              <p className="mt-1 text-3xl font-bold text-white">{stats.thisMonth}</p>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Grid3x3 className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-4 lg:w-auto">
          <button
            onClick={() => navigateMonth('prev')}
            className="rounded-lg bg-slate-800 p-2 text-white transition-colors hover:bg-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center sm:min-w-[200px] sm:flex-none">
            <h2 className="text-lg font-bold text-white sm:text-2xl">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className="rounded-lg bg-slate-800 p-2 text-white transition-colors hover:bg-slate-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Hoje
          </button>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <select
              value={filterProfessional}
              onChange={(event) => setFilterProfessional(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 py-3 pr-4 pl-10 text-white transition-colors focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos profissionais</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-indigo-600 sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            Novo Agendamento
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-3 sm:p-6">
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAY_NAMES.map((day) => (
            <div key={day} className="py-2 text-center text-[10px] font-semibold text-slate-400 sm:text-sm">
              <span className="sm:hidden">{day.slice(0, 1)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayAppointments = getAppointmentsForDate(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={date.toISOString()}
                onClick={() => openCreateModal(date)}
                className={`group min-h-[4.75rem] cursor-pointer rounded-lg border p-1.5 transition-all sm:aspect-square sm:min-h-[7rem] sm:rounded-xl sm:p-2 ${
                  isTodayDate ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="flex h-full flex-col">
                  <div className={`mb-1 text-sm font-semibold ${isTodayDate ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {date.getDate()}
                  </div>

                  <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
                    {dayAppointments.slice(0, 2).map((appointment) => {
                      const clientName = appointment.user?.name || 'Cliente';
                      const time = appointment.scheduledAt
                        ? new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div
                          key={appointment.id}
                          className={`truncate rounded border px-1.5 py-1 text-[9px] sm:px-2 sm:text-[10px] ${statusColors[appointment.status as keyof typeof statusColors]}`}
                          title={`${clientName} - ${time}`}
                        >
                          {time} - {clientName}
                        </div>
                      );
                    })}

                    {dayAppointments.length > 2 && (
                      <div className="text-center text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                        +{dayAppointments.length - 2}
                      </div>
                    )}
                  </div>

                  {dayAppointments.length === 0 && (
                    <div className="flex flex-1 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <Plus className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 p-5 sm:p-6">
              <h3 className="text-xl font-bold text-white">Novo Agendamento</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 transition-colors hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Cliente *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(event) => setFormData({ ...formData, clientId: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Profissional *</label>
                <select
                  required
                  value={formData.professionalId}
                  onChange={(event) => setFormData({ ...formData, professionalId: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">ServiÃ§o *</label>
                <select
                  required
                  value={formData.serviceId}
                  onChange={(event) => setFormData({ ...formData, serviceId: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Data e Hora *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(event) => setFormData({ ...formData, scheduledAt: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">ObservaÃ§Ãµes</label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="ObservaÃ§Ãµes adicionais..."
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-indigo-600"
                >
                  Criar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
