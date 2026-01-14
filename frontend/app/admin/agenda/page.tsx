'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  Users,
  Clock,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Grid3x3,
  List,
  LayoutGrid
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Appointment, Professional, Client, Service, CreateAppointmentRequest } from '@/types';

const api = new ApiClient();

type ViewMode = 'month' | 'week' | 'day';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filterProfessional, setFilterProfessional] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    professionalId: '',
    serviceId: '',
    scheduledAt: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsData, professionalsData, clientsData, servicesData] = await Promise.all([
        api.listAppointments(),
        api.listProfessionals(),
        api.listClients(),
        api.listServices()
      ]);
      setAppointments(appointmentsData);
      setProfessionals(professionalsData);
      setClients(clientsData);
      setServices(servicesData);
      
      if (professionalsData.length > 0) {
        setFormData(prev => ({ ...prev, professionalId: professionalsData[0].id }));
      }
      if (servicesData.length > 0) {
        setFormData(prev => ({ ...prev, serviceId: servicesData[0].id }));
      }
      if (clientsData.length > 0) {
        setFormData(prev => ({ ...prev, clientId: clientsData[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAppointment({
        userId: formData.clientId,
        establishmentId: '', // TODO: pegar do contexto
        professionalId: formData.professionalId,
        serviceId: formData.serviceId,
        scheduledAt: new Date(formData.scheduledAt).toISOString()
      });
      await loadData();
      setShowModal(false);
      setFormData({
        clientId: clients[0]?.id || '',
        professionalId: professionals[0]?.id || '',
        serviceId: services[0]?.id || '',
        scheduledAt: '',
        notes: ''
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
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0] : null;
      const matchesDate = aptDate === dateStr;
      const matchesProfessional = !filterProfessional || apt.professionalId === filterProfessional;
      return matchesDate && matchesProfessional;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openCreateModal = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const dateTimeStr = `${date.toISOString().split('T')[0]}T09:00`;
      setFormData(prev => ({ ...prev, scheduledAt: dateTimeStr }));
    }
    setShowModal(true);
  };

  const getProfessionalName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconhecido';
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconhecido';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Desconhecido';

  const statusColors = {
    SCHEDULED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20'
  } as Record<string, string>;

  const days = getDaysInMonth(currentDate);
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const stats = {
    today: appointments.filter(apt => {
      const aptDate = apt.date || (apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0] : null);
      const today = new Date().toISOString().split('T')[0];
      return aptDate === today;
    }).length,
    thisWeek: appointments.filter(apt => {
      const aptDateStr = apt.date || (apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0] : null);
      if (!aptDateStr) return false;
      const aptDate = new Date(aptDateStr);
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return aptDate >= weekStart && aptDate <= weekEnd;
    }).length,
    thisMonth: appointments.filter(apt => {
      const aptDateStr = apt.date || (apt.scheduledAt ? new Date(apt.scheduledAt).toISOString().split('T')[0] : null);
      if (!aptDateStr) return false;
      const aptDate = new Date(aptDateStr);
      return aptDate.getMonth() === currentDate.getMonth() && 
             aptDate.getFullYear() === currentDate.getFullYear();
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10">
            <CalendarIcon className="h-8 w-8 text-indigo-400" />
          </div>
          Agenda
        </h1>
        <p className="text-slate-400 mt-2">Visualize e gerencie todos os agendamentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Hoje</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.today}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CalendarIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Esta Semana</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.thisWeek}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <LayoutGrid className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Este Mês</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.thisMonth}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Grid3x3 className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center min-w-[200px]">
            <h2 className="text-2xl font-bold text-white">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors text-sm font-medium"
          >
            Hoje
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <select
              value={filterProfessional}
              onChange={(e) => setFilterProfessional(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Todos profissionais</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_NAMES.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
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
                className={`aspect-square p-2 rounded-xl border transition-all cursor-pointer group ${
                  isTodayDate 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-semibold mb-1 ${
                    isTodayDate ? 'text-indigo-400' : 'text-slate-300'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                    {dayAppointments.slice(0, 3).map((apt, i) => {
                      const clientName = apt.client?.name || (apt.clientId ? getClientName(apt.clientId) : 'Cliente');
                      const time = apt.slot || (apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
                      
                      return (
                        <div
                          key={apt.id}
                          className={`text-[10px] px-2 py-1 rounded border ${statusColors[apt.status]} truncate`}
                          title={`${clientName} - ${time}`}
                        >
                          {time} - {clientName}
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-[10px] text-center text-slate-500 font-semibold">
                        +{dayAppointments.length - 3}
                      </div>
                    )}
                  </div>

                  {dayAppointments.length === 0 && (
                    <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Novo Agendamento</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Cliente *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Profissional *</label>
                <select
                  required
                  value={formData.professionalId}
                  onChange={(e) => setFormData({...formData, professionalId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Serviço *</label>
                <select
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Data e Hora *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
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
