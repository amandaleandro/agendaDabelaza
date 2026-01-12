'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { Appointment, Professional, Service, Schedule } from '@/types';
import { apiClient } from '@/services/api';

export default function AppointmentsPage() {
  const router = useRouter();
  const { isAuthenticated, loadFromStorage, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalMap, setProfessionalMap] = useState<Record<string, Professional>>({});
  const [serviceMap, setServiceMap] = useState<Record<string, Service>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({
    professionalId: '',
    serviceId: '',
    date: '',
    slot: '',
    depositPercent: '',
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [professionalAppointments, setProfessionalAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'PAST' | 'CANCELLED'>('ALL');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
    const loadData = async () => {
      try {
        setLoading(true);
        const [apps, fetchedProfessionals] = await Promise.all([
          user?.id ? apiClient.listAppointmentsByClient(user.id) : apiClient.listAppointments(),
          apiClient.listProfessionals(),
        ]);

        const proMap = fetchedProfessionals.reduce<Record<string, Professional>>((acc, pro) => {
          acc[pro.id] = pro;
          return acc;
        }, {});

        setAppointments(apps);
        setProfessionals(fetchedProfessionals);
        setProfessionalMap(proMap);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, router, user?.id]);

  useEffect(() => {
    const loadServicesAndSchedules = async () => {
      if (!form.professionalId) {
        setServices([]);
        setSchedules([]);
        setProfessionalAppointments([]);
        return;
      }
      try {
        setLoading(true);
        const [fetched, proSchedules, allAppointments] = await Promise.all([
          apiClient.listProfessionalServices(form.professionalId),
          apiClient.getProfessionalSchedules(form.professionalId),
          apiClient.listAppointments(),
        ]);
        setServices(fetched);
        setSchedules(proSchedules);
        setProfessionalAppointments(allAppointments.filter((a) => a.professionalId === form.professionalId));
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadServicesAndSchedules();
  }, [form.professionalId]);

  useEffect(() => {
    const fetchMissingServices = async () => {
      const missingIds = Array.from(
        new Set(
          appointments
            .map((a) => a.serviceId)
            .filter((id): id is string => id !== undefined && !serviceMap[id]),
        ),
      );

      if (missingIds.length === 0) return;

      try {
        const fetched = await Promise.all(missingIds.map((id) => apiClient.getService(id)));
        setServiceMap((prev) => {
          const next = { ...prev } as Record<string, Service>;
          fetched.forEach((service) => {
            next[service.id] = service;
          });
          return next;
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Falha ao carregar serviços');
      }
    };

    if (appointments.length > 0) {
      fetchMissingServices();
    }
  }, [appointments, serviceMap]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user?.id) {
      setError('Você precisa estar autenticado como cliente para agendar.');
      return;
    }

    if (!form.professionalId || !form.serviceId || !form.date || !form.slot) {
      setError('Preencha todos os campos');
      return;
    }

    const scheduledAtIso = new Date(`${form.date}T${form.slot}:00`).toISOString();

    try {
      setSubmitting(true);
      const depositPercent = form.depositPercent ? Number(form.depositPercent) : undefined;
      const created = await apiClient.createAppointment({
        clientId: user.id,
        professionalId: form.professionalId,
        serviceId: form.serviceId,
        scheduledAt: scheduledAtIso,
        depositPercent,
      });

      setAppointments((prev) => [created, ...prev]);
      setProfessionalAppointments((prev) => [created, ...prev]);
      setShowForm(false);
      setSuccessMessage('Agendamento criado com sucesso!');
      setForm({ professionalId: '', serviceId: '', date: '', slot: '', depositPercent: '' });
      setAvailableSlots([]);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    setError('');
    setSuccessMessage('');
    try {
      await apiClient.cancelAppointment(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? ({ ...a, status: 'CANCELLED' } as Appointment) : a)),
      );
      setSuccessMessage('Agendamento cancelado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erro ao cancelar agendamento');
    }
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();

    const classify = (appt: Appointment) => {
      if (appt.status === 'CANCELLED') return 'CANCELLED';
      if (!appt.scheduledAt) return 'PAST';
      const isFuture = new Date(appt.scheduledAt).getTime() >= now.getTime();
      return isFuture ? 'UPCOMING' : 'PAST';
    };

    const sorted = [...appointments].sort(
      (a, b) => new Date(b.scheduledAt || 0).getTime() - new Date(a.scheduledAt || 0).getTime(),
    );

    if (statusFilter === 'ALL') return sorted;
    return sorted.filter((appt) => classify(appt) === statusFilter);
  }, [appointments, statusFilter]);

  const selectedService = useMemo(() => services.find((s) => s.id === form.serviceId), [form.serviceId, services]);

  const buildSlots = useMemo(() => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const toTimeString = (minutes: number) => {
      const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const m = (minutes % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    return (
      dateStr: string,
      service: Service | undefined,
      agenda: Schedule[],
      existing: Appointment[],
    ) => {
      if (!dateStr || !service) return [];

      const date = new Date(`${dateStr}T00:00:00`);
      const now = new Date();
      const dayOfWeekIndex = date.getDay();
      const dayKey = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dayOfWeekIndex];
      const schedule = agenda.find((s) => s.dayOfWeek === dayKey && s.isAvailable);
      if (!schedule) return [];

      const startMin = toMinutes(schedule.startTime);
      const endMin = toMinutes(schedule.endTime);
      const duration = service.durationMinutes;

      const sameDayAppointments = existing.filter((apt) => {
        if (!apt.scheduledAt) return false;
        const d = new Date(apt.scheduledAt);
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate() &&
          apt.status === 'SCHEDULED'
        );
      });

      const slots: string[] = [];
      for (let start = startMin; start + duration <= endMin; start += duration) {
        const startTime = toTimeString(start);
        const slotStart = new Date(`${dateStr}T${startTime}:00`);
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        if (slotEnd.getTime() <= now.getTime()) continue;

        const overlaps = sameDayAppointments.some((apt) => {
          if (!apt.scheduledAt) return false;
          const aptStart = new Date(apt.scheduledAt);
          const aptEnd = new Date(aptStart.getTime() + (apt.durationMinutes || duration) * 60 * 1000);
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        if (!overlaps) {
          slots.push(startTime);
        }
      }

      return slots;
    };
  }, []);

  useEffect(() => {
    const slots = buildSlots(form.date, selectedService, schedules, professionalAppointments);
    setAvailableSlots(slots);
    if (slots.length === 0) {
      setForm((prev) => ({ ...prev, slot: '' }));
    }
  }, [form.date, selectedService, schedules, professionalAppointments, buildSlots]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Novo Agendamento
        </Button>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </Card>
      )}

      {successMessage && (
        <Card className="border border-green-200 bg-green-50 text-green-700 p-3">
          {successMessage}
        </Card>
      )}

      {loading && (
        <Card className="p-4 text-gray-600">Carregando...</Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-700">Filtro:</span>
        {[
          { key: 'ALL', label: 'Todos' },
          { key: 'UPCOMING', label: 'Próximos' },
          { key: 'PAST', label: 'Passados' },
          { key: 'CANCELLED', label: 'Cancelados' },
        ].map((f) => (
          <Button
            key={f.key}
            variant={statusFilter === f.key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(f.key as typeof statusFilter)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum agendamento encontrado</p>
            <p className="text-sm">Crie seu primeiro agendamento para começar</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {appointment.serviceId && serviceMap[appointment.serviceId]
                      ? serviceMap[appointment.serviceId].name
                      : 'Serviço'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Profissional:{' '}
                    {appointment.professionalId && professionalMap[appointment.professionalId]
                      ? professionalMap[appointment.professionalId].name
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {appointment.scheduledAt ? new Date(appointment.scheduledAt).toLocaleString('pt-BR') : 'Data não definida'}
                  </p>
                  <p className="text-sm text-gray-600">Valor: R$ {appointment.price?.toFixed(2)}</p>
                  {appointment.depositPayment && (
                    <p className="text-xs text-gray-500">
                      Sinal: R$ {appointment.depositPayment.amount.toFixed(2)} ({appointment.depositPayment.status})
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {appointment.status}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/professionals/${appointment.professionalId}`)}
                  >
                    Ver profissional
                  </Button>
                  {appointment.status === 'SCHEDULED' && (
                    <Button variant="secondary" size="sm" onClick={() => handleCancel(appointment.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Novo Agendamento"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Cliente</p>
            <p className="text-sm text-gray-800 bg-gray-50 border rounded-lg px-3 py-2">
              {user?.email || 'Não autenticado'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Profissional</label>
            <select
              value={form.professionalId}
              onChange={(e) => handleChange('professionalId', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um profissional</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Serviço</label>
            <select
              value={form.serviceId}
              onChange={(e) => handleChange('serviceId', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!form.professionalId || services.length === 0}
            >
              <option value="">Selecione um serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - R$ {s.price?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Data"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Horário</label>
            <select
              value={form.slot}
              onChange={(e) => setForm((prev) => ({ ...prev, slot: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!form.date || availableSlots.length === 0}
            >
              <option value="">Selecione um horário</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {!form.date && (
              <p className="text-xs text-gray-500">Escolha uma data para ver horários disponíveis.</p>
            )}
            {form.date && availableSlots.length === 0 && (
              <p className="text-xs text-red-600">Sem horários disponíveis para este dia.</p>
            )}
          </div>

          <Input
            label="Percentual de sinal (opcional)"
            type="number"
            min="1"
            max="100"
            placeholder="Ex: 30"
            value={form.depositPercent}
            onChange={(e) => handleChange('depositPercent', e.target.value)}
          />

          <Button variant="primary" className="w-full" type="submit" isLoading={submitting} disabled={submitting}>
            Agendar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
