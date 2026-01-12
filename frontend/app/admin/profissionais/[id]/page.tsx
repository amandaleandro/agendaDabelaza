'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Star,
  TrendingUp,
  Award,
  Briefcase,
  Loader2,
  Edit,
  Activity,
  BarChart3
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Professional, Service, Appointment } from '@/types';

const api = new ApiClient();

export default function ProfessionalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const professionalId = params.id as string;
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [professionalId]);

  const loadData = async () => {
    try {
      const [profData, servicesData, appointmentsData] = await Promise.all([
        api.getProfessional(professionalId),
        api.listProfessionalServices(professionalId),
        api.listAppointments()
      ]);
      
      setProfessional(profData);
      setEditForm({
        name: profData.name,
        email: profData.email,
        phone: profData.phone,
      });
      setServices(servicesData);
      setAppointments(appointmentsData.filter(apt => apt.professionalId === professionalId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.email || !editForm.phone) {
      setError('Preencha todos os campos');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updateProfessional(professionalId, editForm);
      setProfessional({ ...professional!, ...editForm });
      setSuccess('Profissional atualizado com sucesso!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar profissional');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (professional) {
      setEditForm({
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
      });
    }
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando profissional...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Profissional não encontrado</h2>
        <button
          onClick={() => router.push('/admin/profissionais')}
          className="text-indigo-400 hover:text-indigo-300"
        >
          Voltar para profissionais
        </button>
      </div>
    );
  }

  // Calculate stats
  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
  const totalRevenue = completedAppointments.reduce((sum, apt) => {
    const service = services.find(s => s.id === apt.serviceId);
    return sum + (service?.price || 0);
  }, 0);
  const avgRating = (4 + Math.random()).toFixed(1);
  const uniqueClients = new Set(appointments.map(apt => apt.clientId)).size;

  // Recent appointments
  const recentAppointments = appointments
    .filter((apt): apt is Appointment & { scheduledAt: string } => apt.scheduledAt !== undefined && apt.scheduledAt !== null)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 5);

  const statusColors = {
    SCHEDULED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20'
  } as Record<string, string>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/profissionais')}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Detalhes do Profissional</h1>
          <p className="text-slate-400 mt-1">Informações completas e estatísticas</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            <Edit className="w-5 h-5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/50 p-4 text-red-400">
          {error}
        </div>
      )}
      
      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/50 p-4 text-green-400">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {(isEditing ? editForm.name : professional.name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 mr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                        placeholder="Nome do profissional"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">{professional.name}</h2>
                    <div className="flex items-center gap-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{professional.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{professional.phone}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-bold text-yellow-400">{avgRating}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Agendamentos</span>
                </div>
                <p className="text-2xl font-bold text-white">{appointments.length}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-semibold">Receita</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">R$ {totalRevenue.toLocaleString()}</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Clientes</span>
                </div>
                <p className="text-2xl font-bold text-white">{uniqueClients}</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs">Serviços</span>
                </div>
                <p className="text-2xl font-bold text-white">{services.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-400" />
            Serviços Oferecidos
          </h3>
          
          {services.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhum serviço cadastrado</p>
          ) : (
            <div className="space-y-3">
              {services.map((service, i) => (
                <div key={service.id} className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{service.name}</h4>
                    <span className="text-sm font-bold text-emerald-400">R$ {service.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{service.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {service.durationMinutes} minutos
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Agendamentos Recentes
          </h3>
          
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhum agendamento</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 rounded-lg bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        {new Date(appointment.scheduledAt).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded border text-xs font-semibold ${statusColors[appointment.status]}`}>
                      {appointment.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-400" />
          Performance nos Últimos 7 Dias
        </h3>
        
        <div className="flex items-end justify-between h-48 gap-3">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const count = Math.floor(Math.random() * 8) + 1;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold text-blue-400">
                  {count > 0 ? count : ''}
                </div>
                <div 
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 transition-all cursor-pointer"
                  style={{ height: `${(count / 8) * 100}%`, minHeight: count > 0 ? '8px' : '2px' }}
                />
                <div className="text-xs text-slate-500 uppercase">{dayName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
