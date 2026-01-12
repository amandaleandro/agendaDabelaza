'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const api = new ApiClient();

export default function ClienteAgendamentosPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    const loadAppointments = async () => {
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
    loadAppointments();
  }, [user?.id]);

  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.service?.name?.toLowerCase().includes(term) ||
          apt.professional?.name?.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.scheduledAt || 0).getTime() - new Date(a.scheduledAt || 0).getTime());

    return filtered;
  }, [appointments, statusFilter, searchTerm]);

  const statusConfig = {
    SCHEDULED: { label: 'Agendado', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30' },
    COMPLETED: { label: 'Concluído', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
    CANCELLED: { label: 'Cancelado', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/30' },
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await api.cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: 'CANCELLED' } : apt))
      );
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      alert('Erro ao cancelar agendamento. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calendar className="h-8 w-8 text-indigo-400" />
          Meus Agendamentos
        </h1>
        <p className="text-slate-400 mt-2">Visualize e gerencie todos os seus agendamentos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por serviço ou profissional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {status === 'ALL' ? 'Todos' : statusConfig[status as keyof typeof statusConfig].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = appointments.filter((apt) => apt.status === key).length;
          return (
            <div key={key} className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <config.icon className={`h-5 w-5 ${config.color}`} />
                <p className="text-sm text-slate-400">{config.label}</p>
              </div>
              <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
            </div>
          );
        })}
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-slate-400">Total</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">{appointments.length}</p>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum agendamento encontrado</h3>
          <p className="text-slate-400">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Tente ajustar os filtros de busca'
              : 'Você ainda não tem agendamentos'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const config = statusConfig[appointment.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const appointmentDate = new Date(appointment.scheduledAt);
            const isPast = appointmentDate < new Date();
            const canCancel = appointment.status === 'SCHEDULED' && !isPast;

            return (
              <div
                key={appointment.id}
                className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left side - Info */}
                  <div className="flex-1 space-y-3">
                    {/* Service name */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {appointment.service?.name || 'Serviço'}
                      </h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                        <StatusIcon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">Profissional:</span>
                        <span className="font-semibold">{appointment.professional?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">Data:</span>
                        <span className="font-semibold">
                          {appointmentDate.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">Horário:</span>
                        <span className="font-semibold">
                          {appointmentDate.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-slate-400">Valor:</span>
                        <span className="font-semibold text-emerald-400">
                          R$ {appointment.price?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
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
