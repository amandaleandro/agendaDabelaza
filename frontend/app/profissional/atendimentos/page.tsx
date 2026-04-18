'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, PackagePlus, PlusCircle, RefreshCw, Scissors, X } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Appointment, Product, Service } from '@/types';
import { useAuth } from '@/store/auth';

const api = new ApiClient();

type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD';

export default function ProfissionalAtendimentosPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [productId, setProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [serviceId, setServiceId] = useState('');
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshData = async (appointmentId?: string) => {
    if (!user?.id) return;

    const [appointmentsData, productsData, servicesData] = await Promise.all([
      api.listAppointmentsByProfessional(user.id),
      api.listProfessionalProducts(user.id),
      api.listProfessionalServices(user.id),
    ]);

    setAppointments(appointmentsData);
    setProducts(productsData);
    setServices(servicesData);

    if (appointmentId) {
      const updated = appointmentsData.find((appointment) => appointment.id === appointmentId) || null;
      setSelectedAppointment(updated);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        await refreshData();
      } catch {
        setMessage({ type: 'error', text: 'Não foi possível carregar seus atendimentos.' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const filteredAppointments = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    if (statusFilter === 'ALL') return sorted;
    return sorted.filter((appointment) => appointment.status === statusFilter);
  }, [appointments, statusFilter]);

  const resetQuickForms = () => {
    setProductId('');
    setProductQuantity(1);
    setServiceId('');
    setServiceQuantity(1);
    setPaymentMethod('PIX');
  };

  const openAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    resetQuickForms();
    setMessage(null);
  };

  const handleAddProduct = async () => {
    if (!selectedAppointment || !productId) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.addProductToAppointment(selectedAppointment.id, {
        productId,
        quantity: productQuantity,
      });
      await refreshData(selectedAppointment.id);
      setProductId('');
      setProductQuantity(1);
      setMessage({ type: 'success', text: 'Produto adicionado ao atendimento.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Não foi possível adicionar o produto.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedAppointment || !serviceId) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.addServiceItemToAppointment(selectedAppointment.id, {
        serviceId,
        quantity: serviceQuantity,
      });
      await refreshData(selectedAppointment.id);
      setServiceId('');
      setServiceQuantity(1);
      setMessage({ type: 'success', text: 'Serviço extra adicionado ao atendimento.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Não foi possível adicionar o serviço.' });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedAppointment) return;
    setSaving(true);
    setMessage(null);

    try {
      const remaining = selectedAppointment.totals?.remaining ?? 0;
      await api.completeAppointment(selectedAppointment.id, {
        paymentMethod: remaining > 0 ? paymentMethod : undefined,
      });
      await refreshData(selectedAppointment.id);
      setMessage({
        type: 'success',
        text: remaining > 0
          ? 'Atendimento finalizado e saldo baixado com sucesso.'
          : 'Atendimento finalizado com sucesso.',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Não foi possível finalizar o atendimento.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">Carregando atendimentos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Atendimentos</h1>
          <p className="mt-2 text-slate-400">Acompanhe sua agenda, lance extras ao vivo e feche o atendimento com o saldo correto.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                statusFilter === status
                  ? 'bg-cyan-500 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl border px-4 py-3 ${
          message.type === 'success'
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            : 'border-red-400/20 bg-red-500/10 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-slate-400">
            Nenhum atendimento encontrado neste filtro.
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <button
              key={appointment.id}
              onClick={() => openAppointment(appointment)}
              className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-left transition hover:border-cyan-400/30 hover:bg-white/5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold">{appointment.user?.name || 'Cliente'}</p>
                  <p className="text-sm text-slate-400">{appointment.service?.name || 'Serviço principal'}</p>
                </div>
                <div className="text-sm text-slate-300">
                  {new Date(appointment.scheduledAt).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </div>
                <div className="rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-cyan-300">
                  Total R$ {(appointment.totals?.total ?? appointment.price).toFixed(2)}
                </div>
                <div className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
                  Restante R$ {(appointment.totals?.remaining ?? 0).toFixed(2)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/10 bg-slate-950 p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{selectedAppointment.user?.name || 'Cliente'}</h2>
                <p className="mt-1 text-slate-400">{selectedAppointment.service?.name || 'Serviço principal'}</p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Serviço principal', value: selectedAppointment.totals?.basePrice ?? selectedAppointment.price },
                { label: 'Extras em produtos', value: selectedAppointment.totals?.productsTotal ?? 0 },
                { label: 'Extras em serviços', value: selectedAppointment.totals?.servicesTotal ?? 0 },
                { label: 'Total do atendimento', value: selectedAppointment.totals?.total ?? selectedAppointment.price },
                { label: 'Já pago', value: selectedAppointment.totals?.amountPaid ?? 0 },
                { label: 'Saldo restante', value: selectedAppointment.totals?.remaining ?? 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-xl font-bold">R$ {item.value.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <PackagePlus className="h-5 w-5 text-cyan-300" />
                  <h3 className="text-lg font-bold">Adicionar produto ao vivo</h3>
                </div>
                <div className="space-y-3">
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  />
                  <button
                    onClick={handleAddProduct}
                    disabled={saving || !productId}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
                  >
                    <PackagePlus className="h-5 w-5" />
                    Adicionar produto
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-blue-300" />
                  <h3 className="text-lg font-bold">Adicionar serviço extra</h3>
                </div>
                <div className="space-y-3">
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={serviceQuantity}
                    onChange={(e) => setServiceQuantity(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  />
                  <button
                    onClick={handleAddService}
                    disabled={saving || !serviceId}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Adicionar serviço
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Itens lançados</h3>
                  <button
                    onClick={() => refreshData(selectedAppointment.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-semibold">{selectedAppointment.service?.name || 'Serviço principal'}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      R$ {(selectedAppointment.totals?.basePrice ?? selectedAppointment.price).toFixed(2)}
                    </p>
                  </div>

                  {(selectedAppointment.items || []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <p className="font-semibold">{item.product?.name || 'Produto'}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.quantity}x de R$ {item.price.toFixed(2)} = R$ {(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  {(selectedAppointment.serviceItems || []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <p className="font-semibold">{item.service?.name || 'Serviço extra'}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.quantity}x de R$ {item.price.toFixed(2)} = R$ {(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-300" />
                  <h3 className="text-lg font-bold">Finalizar atendimento</h3>
                </div>

                <p className="text-sm text-slate-400">
                  Se ainda houver saldo em aberto, escolha a forma de pagamento e finalize o serviço.
                </p>

                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-100">
                  Saldo atual: <strong>R$ {(selectedAppointment.totals?.remaining ?? 0).toFixed(2)}</strong>
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm text-slate-300">Forma de pagamento do restante</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="CREDIT_CARD">Cartão</option>
                  </select>
                </label>

                <button
                  onClick={handleComplete}
                  disabled={saving || selectedAppointment.status === 'COMPLETED'}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {selectedAppointment.status === 'COMPLETED' ? 'Atendimento já concluído' : 'Finalizar atendimento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
