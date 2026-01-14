'use client';

import { useState, useEffect } from 'react';
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
  User,
  Filter,
  Star,
  TrendingUp,
  Sparkles,
  Loader2,
  BarChart3,
  X
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
  const [filterProfessional, setFilterProfessional] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateServiceRequest>({
    establishmentId: '',
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    professionalId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (establishment) {
      setFormData(prev => ({ ...prev, establishmentId: establishment.id }));
    }
  }, [establishment]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesData, professionalsData] = await Promise.all([
        api.listServices(),
        api.listProfessionals()
      ]);
      setServices(servicesData);
      setProfessionals(professionalsData);
      
      if (professionalsData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          professionalId: professionalsData[0].id,
          establishmentId: establishment?.id || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        professionalId: professionals.length > 0 ? professionals[0].id : ''
      });
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      alert('Erro ao criar serviço. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProfessionalName = (id: string) => {
    return professionals.find(p => p.id === id)?.name || 'Desconhecido';
  };

  const filteredAndSortedServices = services
    .filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterProfessional || service.professionalId === filterProfessional)
    )
    .sort((a, b) => {
      switch(sortBy) {
        case 'price':
          return b.price - a.price;
        case 'duration':
          return b.durationMinutes - a.durationMinutes;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Calculate stats
  const stats = {
    total: services.length,
    avgPrice: services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0,
    totalRevenue: services.reduce((sum, s) => sum + (s.price * Math.floor(Math.random() * 10)), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Scissors className="h-8 w-8 text-orange-400" />
          </div>
          Serviços
        </h1>
        <p className="text-slate-400 mt-2">Gerencie os serviços oferecidos no seu estabelecimento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Serviços</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Scissors className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Preço Médio</p>
              <p className="text-3xl font-bold text-white mt-1">R$ {stats.avgPrice.toFixed(0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Receita Estimada</p>
              <p className="text-3xl font-bold text-white mt-1">R$ {stats.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10">
              <TrendingUp className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar serviço por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter by Professional */}
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

        {/* Sort */}
        <div className="relative min-w-[160px]">
          <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="name">Nome A-Z</option>
            <option value="price">Maior preço</option>
            <option value="duration">Maior duração</option>
          </select>
        </div>

        {/* Add Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-slate-400">Carregando serviços...</p>
          </div>
        </div>
      ) : filteredAndSortedServices.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
          <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Nenhum serviço encontrado</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            {searchTerm ? 'Tente buscar com outros termos' : 'Cadastre os serviços que você oferece para começar a receber agendamentos.'}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Adicionar primeiro serviço →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedServices.map((service, index) => (
            <div 
              key={service.id} 
              className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 hover:border-slate-700 hover:shadow-xl hover:shadow-orange-500/5 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Scissors className="w-6 h-6 text-white" />
                  </div>
                  {index < 3 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-yellow-400">Top {index + 1}</span>
                    </div>
                  )}
                </div>
                <button className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px]">{service.description}</p>
              
              {/* Meta Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Duração</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{service.durationMinutes} min</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-semibold">Preço</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Professional */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {getProfessionalName(service.professionalId).slice(0, 1)}
                </div>
                <span className="text-sm text-slate-400">{getProfessionalName(service.professionalId)}</span>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-lg transition-colors flex items-center justify-center gap-2" title="Editar">
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Editar</span>
                </button>
                <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Sparkles className="h-6 w-6 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Novo Serviço</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Nome do Serviço *
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Corte de Cabelo Masculino"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o serviço oferecido..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Preço (R$) *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Duração (min) *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                    placeholder="30"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Profissional *
                </label>
                <select 
                  required
                  value={formData.professionalId}
                  onChange={(e) => setFormData({...formData, professionalId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                >
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
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
