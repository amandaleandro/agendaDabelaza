'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scissors,
  Plus,
  Search,
  Clock,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit,
  Filter,
  Star,
  TrendingUp,
  Sparkles,
  Loader2,
  BarChart3,
  X,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { Service, Professional, CreateServiceRequest } from '@/types';

const api = new ApiClient();

export default function ServicesPage() {
  const router = useRouter();
  const { establishment } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfessional, setFilterProfessional] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateServiceRequest>({
    establishmentId: '',
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    professionalId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (establishment) {
      setFormData((prev) => ({ ...prev, establishmentId: establishment.id }));
    }
  }, [establishment]);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesData, professionalsData] = await Promise.all([
        api.listServices(),
        api.listProfessionals(),
      ]);

      setServices(servicesData);
      setProfessionals(professionalsData);

      if (professionalsData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          professionalId: professionalsData[0].id,
          establishmentId: establishment?.id || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.createService(formData);
      await fetchData();
      setIsModalOpen(false);
      setFormData({
        establishmentId: establishment?.id || '',
        name: '',
        description: '',
        price: 0,
        durationMinutes: 30,
        professionalId: professionals.length > 0 ? professionals[0].id : '',
      });
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      alert('Erro ao criar serviço. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProfessionalName = (id: string) =>
    professionals.find((professional) => professional.id === id)?.name || 'Desconhecido';

  const filteredAndSortedServices = services
    .filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!filterProfessional || service.professionalId === filterProfessional),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'duration':
          return b.durationMinutes - a.durationMinutes;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const stats = {
    total: services.length,
    avgPrice: services.length > 0 ? services.reduce((sum, service) => sum + service.price, 0) / services.length : 0,
    totalRevenue: services.reduce((sum, service) => sum + service.price * Math.floor(Math.random() * 10), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
          <div className="rounded-xl bg-orange-500/10 p-2">
            <Scissors className="h-8 w-8 text-orange-400" />
          </div>
          Serviços
        </h1>
        <p className="mt-2 text-slate-400">Gerencie os serviços oferecidos no seu estabelecimento</p>
      </div>

      {!establishment && (
        <div className="rounded-xl border border-red-800 bg-red-500/10 p-4">
          <p className="font-semibold text-red-400">Erro de Autenticação</p>
          <p className="mt-2 text-sm text-red-300">
            Nenhum estabelecimento foi associado à sua conta. Por favor, faça login novamente.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Ir para Login
          </button>
        </div>
      )}

      {establishment && professionals.length === 0 && (
        <div className="rounded-xl border border-amber-800 bg-amber-500/10 p-4">
          <p className="font-semibold text-amber-400">Nenhum Profissional Cadastrado</p>
          <p className="mt-2 text-sm text-amber-300">
            Você precisa criar ao menos um profissional antes de adicionar serviços.
          </p>
          <button
            onClick={() => router.push('/admin/profissionais')}
            className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Ir para Profissionais
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Serviços</p>
              <p className="mt-1 text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-orange-500/10 p-3">
              <Scissors className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Preço Médio</p>
              <p className="mt-1 text-3xl font-bold text-white">R$ {stats.avgPrice.toFixed(0)}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Receita Estimada</p>
              <p className="mt-1 text-3xl font-bold text-white">R$ {stats.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="rounded-lg bg-indigo-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar serviço por nome..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white transition-colors focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <select
            value={filterProfessional}
            onChange={(event) => setFilterProfessional(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white transition-colors focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos profissionais</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[160px]">
          <BarChart3 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'name' | 'price' | 'duration')}
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white transition-colors focus:border-indigo-500 focus:outline-none"
          >
            <option value="name">Nome A-Z</option>
            <option value="price">Maior preço</option>
            <option value="duration">Maior duração</option>
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-indigo-500/30"
        >
          <Plus className="h-5 w-5" />
          Novo Serviço
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-500" />
            <p className="text-slate-400">Carregando serviços...</p>
          </div>
        </div>
      ) : filteredAndSortedServices.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 py-20 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10">
            <Scissors className="h-10 w-10 text-orange-400" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-white">Nenhum serviço encontrado</h3>
          <p className="mx-auto mb-6 max-w-md text-slate-400">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Cadastre os serviços que você oferece para começar a receber agendamentos.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Adicionar primeiro serviço -&gt;
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedServices.map((service, index) => (
            <div
              key={service.id}
              className="group rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
                    <Scissors className="h-6 w-6 text-white" />
                  </div>
                  {index < 3 && (
                    <div className="flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-yellow-400">Top {index + 1}</span>
                    </div>
                  )}
                </div>
                <button className="rounded-lg p-2 text-slate-500 opacity-0 transition-colors group-hover:opacity-100 hover:bg-slate-800/50 hover:text-white">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <h3 className="mb-2 text-xl font-bold text-white">{service.name}</h3>
              <p className="mb-4 min-h-[40px] line-clamp-2 text-sm text-slate-400">{service.description}</p>

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Duração</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{service.durationMinutes} min</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-semibold">Preço</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-bold text-white">
                  {getProfessionalName(service.professionalId).slice(0, 1)}
                </div>
                <span className="text-sm text-slate-400">{getProfessionalName(service.professionalId)}</span>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg p-2 text-indigo-400 transition-colors hover:bg-indigo-400/10 hover:text-indigo-300"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Editar</span>
                </button>
                <button
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm duration-200">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Sparkles className="h-6 w-6 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Novo Serviço</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {(!establishment || professionals.length === 0) && (
                <div className="rounded-xl border border-amber-800 bg-amber-500/10 p-4">
                  {!establishment && (
                    <p className="text-sm text-amber-300">
                      Você não está associado a um estabelecimento. Faça login novamente para continuar.
                    </p>
                  )}
                  {establishment && professionals.length === 0 && (
                    <p className="text-sm text-amber-300">
                      Nenhum profissional cadastrado. Crie um profissional antes de adicionar serviços.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Ex: Corte de Cabelo Masculino"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Descreva o serviço oferecido..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Preço (R$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(event) => setFormData({ ...formData, price: parseFloat(event.target.value) })}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Duração (min) *</label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={(event) => setFormData({ ...formData, durationMinutes: parseInt(event.target.value, 10) })}
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Profissional *</label>
                <select
                  required
                  value={formData.professionalId}
                  onChange={(event) => setFormData({ ...formData, professionalId: event.target.value })}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:outline-none"
                >
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !establishment || professionals.length === 0}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:from-indigo-500 hover:to-indigo-600"
                >
                  {submitting ? 'Criando...' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
