'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Save,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash,
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Professional, DayOfWeek, ScheduleIntervalInput } from '@/types';

const api = new ApiClient();

const DAYS = [
  { value: DayOfWeek.MONDAY, label: 'Segunda-feira' },
  { value: DayOfWeek.TUESDAY, label: 'Terça-feira' },
  { value: DayOfWeek.WEDNESDAY, label: 'Quarta-feira' },
  { value: DayOfWeek.THURSDAY, label: 'Quinta-feira' },
  { value: DayOfWeek.FRIDAY, label: 'Sexta-feira' },
  { value: DayOfWeek.SATURDAY, label: 'Sábado' },
  { value: DayOfWeek.SUNDAY, label: 'Domingo' },
];

const DAY_LABEL: Record<DayOfWeek, string> = DAYS.reduce((acc, day) => {
  acc[day.value] = day.label;
  return acc;
}, {} as Record<DayOfWeek, string>);

type Interval = Omit<ScheduleIntervalInput, 'dayOfWeek'>;
type WeeklySchedule = Record<DayOfWeek, Interval[]>;

const DEFAULT_INTERVAL: Interval = {
  startTime: '09:00',
  endTime: '18:00',
  isAvailable: true,
};

export default function AgendaPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [schedules, setSchedules] = useState<WeeklySchedule>({} as WeeklySchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessionalId) {
      fetchSchedules(selectedProfessionalId);
    }
  }, [selectedProfessionalId]);

  const fetchProfessionals = async () => {
    try {
      const data = await api.listProfessionals();
      setProfessionals(data);
      if (data.length > 0) {
        setSelectedProfessionalId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (professionalId: string) => {
    try {
      const data = await api.getProfessionalSchedules(professionalId);

      const grouped: WeeklySchedule = DAYS.reduce((acc, day) => {
        acc[day.value] = [];
        return acc;
      }, {} as WeeklySchedule);

      data.forEach((schedule) => {
        grouped[schedule.dayOfWeek].push({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: schedule.isAvailable,
        });
      });

      // Sort intervals by start time for consistent display
      Object.keys(grouped).forEach((day) => {
        grouped[day as DayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      // Ensure at least one default interval if none exists for the first render convenience
      DAYS.forEach((day) => {
        if (grouped[day.value].length === 0) {
          grouped[day.value] = [
            {
              ...DEFAULT_INTERVAL,
              isAvailable: false,
            },
          ];
        }
      });

      setSchedules(grouped);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    }
  };

  const handleIntervalChange = (day: DayOfWeek, index: number, field: keyof Interval, value: any) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: prev[day].map((interval, i) =>
        i === index
          ? {
              ...interval,
              [field]: value,
            }
          : interval,
      ),
    }));
  };

  const addInterval = (day: DayOfWeek) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { ...DEFAULT_INTERVAL, isAvailable: true }],
    }));
  };

  const removeInterval = (day: DayOfWeek, index: number) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const validateIntervals = () => {
    for (const [dayKey, intervals] of Object.entries(schedules)) {
      const label = DAY_LABEL[dayKey as DayOfWeek] || dayKey;

      for (const interval of intervals) {
        if (interval.startTime >= interval.endTime) {
          return `Horário inválido em ${label}: início deve ser menor que fim.`;
        }
      }

      const sorted = [...intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.startTime < prev.endTime) {
          return `Conflito em ${label}: intervalos se sobrepõem (${prev.startTime}-${prev.endTime} e ${curr.startTime}-${curr.endTime}).`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedProfessionalId) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const professional = professionals.find(p => p.id === selectedProfessionalId);
      if (!professional) return;

      const validationMessage = validateIntervals();
      if (validationMessage) {
        setMessage({ type: 'error', text: validationMessage });
        return;
      }

      const payload = Object.entries(schedules).flatMap(([day, intervals]) =>
        intervals.map((interval) => ({
          dayOfWeek: day as DayOfWeek,
          startTime: interval.startTime,
          endTime: interval.endTime,
          isAvailable: interval.isAvailable,
        })),
      );

      await api.setSchedules({
        establishmentId: professional.establishmentId!,
        professionalId: selectedProfessionalId,
        schedules: payload,
      });
      setMessage({ type: 'success', text: 'Agenda salva com sucesso!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar agenda:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar agenda. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="text-slate-400 mt-4">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuração da Agenda</h1>
          <p className="text-slate-400 mt-1">Defina os horários de atendimento da sua equipe.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving || !selectedProfessionalId}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Professional Selector */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Selecione o Profissional</label>
        <div className="relative max-w-md">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select 
            value={selectedProfessionalId}
            onChange={(e) => setSelectedProfessionalId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
          >
            {professionals.length === 0 ? (
              <option value="" disabled>Nenhum profissional cadastrado</option>
            ) : (
              professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>
        {professionals.length === 0 && (
          <p className="text-yellow-500 text-sm mt-2">
            Você precisa cadastrar profissionais antes de configurar a agenda.
          </p>
        )}
      </div>

      {/* Schedule Grid */}
      {selectedProfessionalId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.map((day) => {
            const intervals = schedules[day.value] || [];

            return (
              <div
                key={day.value}
                className="border rounded-xl p-5 bg-[#1e293b] border-slate-800 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {day.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => addInterval(day.value)}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-200"
                  >
                    <Plus className="w-4 h-4" /> Adicionar intervalo
                  </button>
                </div>

                {intervals.length === 0 && (
                  <p className="text-sm text-slate-500">Nenhum intervalo definido. Adicione um horário.</p>
                )}

                <div className="space-y-3">
                  {intervals.map((interval, index) => (
                    <div
                      key={`${day.value}-${index}`}
                      className={`rounded-lg border p-3 bg-slate-900/60 border-slate-800/70 ${
                        interval.isAvailable ? '' : 'opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-4 h-4" /> Intervalo {index + 1}
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={interval.isAvailable}
                              onChange={(e) => handleIntervalChange(day.value, index, 'isAvailable', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeInterval(day.value, index)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-3 ${!interval.isAvailable && 'opacity-50 pointer-events-none'}`}>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Início</label>
                          <div className="relative">
                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="time"
                              value={interval.startTime}
                              onChange={(e) => handleIntervalChange(day.value, index, 'startTime', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-white pl-8 pr-2 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Fim</label>
                          <div className="relative">
                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="time"
                              value={interval.endTime}
                              onChange={(e) => handleIntervalChange(day.value, index, 'endTime', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-white pl-8 pr-2 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2">
                        Marque como indisponível para bloquear este horário neste dia.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
