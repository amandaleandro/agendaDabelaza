'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, Clock, Plus, Save, Trash } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { DayOfWeek, Schedule, ScheduleIntervalInput } from '@/types';
import { useAuth } from '@/store/auth';

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

type Interval = Omit<ScheduleIntervalInput, 'dayOfWeek'>;
type WeeklySchedule = Record<DayOfWeek, Interval[]>;

const DEFAULT_INTERVAL: Interval = {
  startTime: '09:00',
  endTime: '18:00',
  isAvailable: true,
};

function buildWeeklySchedule(data: Schedule[]) {
  const grouped = DAYS.reduce((acc, day) => {
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

  DAYS.forEach((day) => {
    if (grouped[day.value].length === 0) {
      grouped[day.value] = [{ ...DEFAULT_INTERVAL, isAvailable: false }];
    }
  });

  return grouped;
}

export default function ProfissionalAgendaPage() {
  const { user, establishment } = useAuth();
  const [schedules, setSchedules] = useState<WeeklySchedule>({} as WeeklySchedule);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const data = await api.getProfessionalSchedules(user.id);
        setSchedules(buildWeeklySchedule(data));
      } catch {
        setMessage({ type: 'error', text: 'Não foi possível carregar sua agenda.' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleChange = (day: DayOfWeek, index: number, field: keyof Interval, value: string | boolean) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: prev[day].map((interval, currentIndex) =>
        currentIndex === index ? { ...interval, [field]: value } : interval,
      ),
    }));
  };

  const addInterval = (day: DayOfWeek) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { ...DEFAULT_INTERVAL }],
    }));
  };

  const removeInterval = (day: DayOfWeek, index: number) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const validate = () => {
    for (const day of DAYS) {
      const intervals = schedules[day.value] || [];
      const sorted = [...intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (const interval of sorted) {
        if (interval.startTime >= interval.endTime) {
          return `Revise os horários de ${day.label}.`;
        }
      }

      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          return `Existem intervalos sobrepostos em ${day.label}.`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!user?.id || !establishment?.id) return;

    const validationMessage = validate();
    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload = Object.entries(schedules).flatMap(([dayOfWeek, intervals]) =>
        intervals.map((interval) => ({
          dayOfWeek: dayOfWeek as DayOfWeek,
          startTime: interval.startTime,
          endTime: interval.endTime,
          isAvailable: interval.isAvailable,
        })),
      );

      await api.setSchedules({
        establishmentId: establishment.id,
        professionalId: user.id,
        schedules: payload,
      });
      setMessage({ type: 'success', text: 'Sua agenda foi salva com sucesso.' });
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível salvar sua agenda.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">Carregando agenda...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Minha agenda</h1>
          <p className="mt-2 text-slate-400">Defina os horários em que você estará disponível para atendimento.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Salvando...' : 'Salvar agenda'}
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          message.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            : 'border-red-400/20 bg-red-500/10 text-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {DAYS.map((day) => (
          <div key={day.value} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-300" />
                <h2 className="font-semibold">{day.label}</h2>
              </div>
              <button
                type="button"
                onClick={() => addInterval(day.value)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-cyan-300 transition hover:bg-white/5"
              >
                <Plus className="h-4 w-4" />
                Intervalo
              </button>
            </div>

            <div className="space-y-3">
              {(schedules[day.value] || []).map((interval, index) => (
                <div key={`${day.value}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      Intervalo {index + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={interval.isAvailable}
                          onChange={(e) => handleChange(day.value, index, 'isAvailable', e.target.checked)}
                        />
                        Disponível
                      </label>
                      <button
                        type="button"
                        onClick={() => removeInterval(day.value, index)}
                        className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-400">Início</span>
                      <input
                        type="time"
                        value={interval.startTime}
                        disabled={!interval.isAvailable}
                        onChange={(e) => handleChange(day.value, index, 'startTime', e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white disabled:opacity-50"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-400">Fim</span>
                      <input
                        type="time"
                        value={interval.endTime}
                        disabled={!interval.isAvailable}
                        onChange={(e) => handleChange(day.value, index, 'endTime', e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white disabled:opacity-50"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
