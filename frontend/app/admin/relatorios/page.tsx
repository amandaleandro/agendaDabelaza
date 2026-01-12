'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Scissors,
  Download,
  Filter,
  Clock,
  Award,
  Activity,
  Percent,
  Loader2,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Payment, Appointment, Service, Professional } from '@/types';

const api = new ApiClient();

type Period = 'week' | 'month' | 'quarter' | 'year';

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, appointmentsData, servicesData, professionalsData] = await Promise.all([
        api.listPayments(),
        api.listAppointments(),
        api.listServices(),
        api.listProfessionals()
      ]);
      setPayments(paymentsData);
      setAppointments(appointmentsData);
      setServices(servicesData);
      setProfessionals(professionalsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = () => {
    const now = new Date();
    let start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const filterByPeriod = (date: string) => {
    const { start, end } = getPeriodDates();
    const d = new Date(date);
    return d >= start && d <= end;
  };

  const getPreviousPeriod = () => {
    const now = new Date();
    const { start: currentStart } = getPeriodDates();
    const duration = now.getTime() - currentStart.getTime();
    
    const prevEnd = new Date(currentStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return { start: prevStart, end: prevEnd };
  };

  // Current period calculations
  const paidPayments = payments.filter(p => p.status === 'PAID' && filterByPeriod(p.createdAt));
  const currentRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentAppointments = appointments.filter(apt => filterByPeriod(apt.createdAt));
  const completedAppointments = currentAppointments.filter(apt => apt.status === 'COMPLETED');

  // Previous period calculations
  const prevPeriod = getPreviousPeriod();
  const prevPayments = payments.filter(p => {
    const d = new Date(p.createdAt);
    return p.status === 'PAID' && d >= prevPeriod.start && d <= prevPeriod.end;
  });
  const prevRevenue = prevPayments.reduce((sum, p) => sum + p.amount, 0);
  const prevAppointments = appointments.filter(apt => {
    const d = new Date(apt.createdAt);
    return d >= prevPeriod.start && d <= prevPeriod.end;
  });

  // Calculate growth
  const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const appointmentsGrowth = prevAppointments.length > 0 
    ? ((currentAppointments.length - prevAppointments.length) / prevAppointments.length) * 100 
    : 0;

  // Service analytics
  const serviceRevenue = services.map(service => {
    const serviceAppointments = completedAppointments.filter(apt => apt.serviceId === service.id);
    const revenue = serviceAppointments.length * service.price;
    return { service, count: serviceAppointments.length, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  // Professional analytics
  const professionalStats = professionals.map(prof => {
    const profAppointments = completedAppointments.filter(apt => apt.professionalId === prof.id);
    const profPayments = paidPayments.filter(p => {
      const apt = currentAppointments.find(a => a.id === p.appointmentId);
      return apt?.professionalId === prof.id;
    });
    const revenue = profPayments.reduce((sum, p) => sum + p.amount, 0);
    return { professional: prof, appointments: profAppointments.length, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  // Occupancy rate
  const totalSlots = professionals.length * 40 * (period === 'week' ? 5 : period === 'month' ? 20 : period === 'quarter' ? 60 : 240);
  const occupancyRate = totalSlots > 0 ? (completedAppointments.length / totalSlots) * 100 : 0;

  // Average ticket
  const avgTicket = paidPayments.length > 0 ? currentRevenue / paidPayments.length : 0;

  const handleExportPDF = () => {
    alert('Funcionalidade de exportação PDF será implementada em breve!');
  };

  const periodLabels: Record<Period, string> = {
    week: 'Última Semana',
    month: 'Último Mês',
    quarter: 'Último Trimestre',
    year: 'Último Ano'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
            Relatórios & Analytics
          </h1>
          <p className="text-slate-400 mt-2">Análises detalhadas do seu negócio</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {revenueGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(revenueGrowth).toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-slate-400">Receita Total</p>
          <p className="text-3xl font-bold text-white mt-1">R$ {currentRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2">vs. período anterior</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              appointmentsGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {appointmentsGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(appointmentsGrowth).toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-slate-400">Agendamentos</p>
          <p className="text-3xl font-bold text-white mt-1">{currentAppointments.length}</p>
          <p className="text-xs text-slate-500 mt-2">{completedAppointments.length} completados</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <DollarSign className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-slate-400">Ticket Médio</p>
          <p className="text-3xl font-bold text-white mt-1">R$ {avgTicket.toFixed(0)}</p>
          <p className="text-xs text-slate-500 mt-2">{paidPayments.length} transações</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Percent className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-slate-400">Taxa de Ocupação</p>
          <p className="text-3xl font-bold text-white mt-1">{occupancyRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-2">capacidade utilizada</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Services */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scissors className="h-5 w-5 text-orange-400" />
              Serviços Mais Lucrativos
            </h3>
          </div>
          
          <div className="space-y-4">
            {serviceRevenue.slice(0, 5).map((item, i) => {
              const percentage = currentRevenue > 0 ? (item.revenue / currentRevenue) * 100 : 0;
              return (
                <div key={item.service.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-slate-500/20 text-slate-400' :
                        i === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-700/20 text-slate-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.service.name}</p>
                        <p className="text-xs text-slate-500">{item.count} atendimentos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">R$ {item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Professionals */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-400" />
              Profissionais Destaque
            </h3>
          </div>
          
          <div className="space-y-4">
            {professionalStats.slice(0, 5).map((item, i) => {
              const percentage = currentRevenue > 0 ? (item.revenue / currentRevenue) * 100 : 0;
              return (
                <div key={item.professional.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                        i === 0 ? 'from-yellow-500 to-yellow-600' :
                        i === 1 ? 'from-slate-500 to-slate-600' :
                        'from-indigo-500 to-indigo-600'
                      } flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {item.professional.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.professional.name}</p>
                        <p className="text-xs text-slate-500">{item.appointments} atendimentos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">R$ {item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <h4 className="font-semibold text-white">Taxa de Conclusão</h4>
          </div>
          <p className="text-3xl font-bold text-white">
            {currentAppointments.length > 0 
              ? ((completedAppointments.length / currentAppointments.length) * 100).toFixed(1) 
              : 0}%
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {completedAppointments.length} de {currentAppointments.length} agendamentos
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <h4 className="font-semibold text-white">Clientes Únicos</h4>
          </div>
          <p className="text-3xl font-bold text-white">
            {new Set(currentAppointments.map(apt => apt.clientId)).size}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            no período selecionado
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Clock className="h-5 w-5 text-rose-400" />
            </div>
            <h4 className="font-semibold text-white">Tempo Médio</h4>
          </div>
          <p className="text-3xl font-bold text-white">
            {services.length > 0 
              ? Math.round(services.reduce((sum, s) => sum + s.durationMinutes, 0) / services.length)
              : 0} min
          </p>
          <p className="text-sm text-slate-400 mt-2">
            duração por atendimento
          </p>
        </div>
      </div>
    </div>
  );
}
