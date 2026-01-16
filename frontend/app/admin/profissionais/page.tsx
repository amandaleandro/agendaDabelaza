'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreVertical, 
  Trash2, 
  Edit,
  Briefcase,
  Star,
  Calendar,
  DollarSign,
  Award,
  TrendingUp,
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  UserCheck,
  Activity,
  User
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { Professional, CreateProfessionalRequest } from '@/types';

const api = new ApiClient();

export default function ProfessionalsPage() {
  const router = useRouter();
  const auth = useAuth();
  const establishment = auth.establishment;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProfessionalRequest>({
    establishmentId: '', // Will be set on modal open
    name: '',
    email: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  const [professionalsStats, setProfessionalsStats] = useState<Record<string, any>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Then load professionals
      await fetchProfessionals();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setErrorMessage('Falha ao carregar profissionais.');
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const data = await api.listProfessionals();
      setProfessionals(data);
      // Carregar stats para cada profissional
      await loadProfessionalsStats(data);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      setErrorMessage('Falha ao carregar profissionais.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionalsStats = async (profs: Professional[]) => {
    const stats: Record<string, any> = {};
    try {
      for (const prof of profs) {
        const response = await fetch(`/api/professionals/${prof.id}/stats`);
        if (response.ok) {
          stats[prof.id] = await response.json();
        } else {
          // Fallback: stats vazios
          stats[prof.id] = { appointments: 0, revenue: 0, rating: 0, clients: 0 };
        }
      }
      setProfessionalsStats(stats);
    } catch (error) {
      console.warn('Erro ao carregar stats dos profissionais:', error);
    }
  };

  const openModal = (professional?: Professional) => {
    if (professional) {
      setEditingId(professional.id);
      setFormData({ 
        establishmentId: establishmentId, 
        name: professional.name, 
        email: professional.email, 
        phone: professional.phone 
      });
    } else {
      setEditingId(null);
      setFormData({ 
        establishmentId: establishmentId, 
        name: '', 
        email: '', 
        phone: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (editingId) {
        // Atualizar profissional existente
        await api.updateProfessional(editingId, formData);
        await fetchProfessionals();
        setSuccessMessage('Profissional atualizado com sucesso!');
      } else {
        // Criar novo profissional
        await api.createProfessional(formData);
        await fetchProfessionals();
        setSuccessMessage('Profissional criado com sucesso!');
      }
      setIsModalOpen(false);
      setFormData({ establishmentId: '', name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      setErrorMessage('Erro ao salvar profissional. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este profissional?')) return;
    setErrorMessage('');
    setSuccessMessage('');
    setDeletingId(id);
    try {
      await api.deleteProfessional(id);
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
      setSuccessMessage('Profissional removido com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir profissional:', error);
      setErrorMessage('Erro ao excluir profissional. Verifique vínculos e tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProfessionals = professionals.filter(professional => 
    professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professional.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Buscar stats real do profissional
  const getProfessionalStats = (id: string) => {
    return professionalsStats[id] || { appointments: 0, revenue: 0, rating: 0, clients: 0 };
  };

  // Encontrar top performers baseado em atendimentos
  const topPerformers = professionals
    .map((p) => ({ ...p, stats: getProfessionalStats(p.id) }))
    .sort((a, b) => b.stats.appointments - a.stats.appointments)
    .slice(0, 2)
    .map((p) => p.id);

  const totalStats = {
    professionals: professionals.length,
    totalRevenue: professionals.reduce((sum, p) => sum + getProfessionalStats(p.id).revenue, 0),
    avgRating: professionals.length > 0 
      ? (professionals.reduce((sum, p) => sum + (getProfessionalStats(p.id).rating || 0), 0) / professionals.length).toFixed(1) 
      : '0.0',
  };

  const gradients = [
    'from-indigo-500 to-indigo-600',
    'from-purple-500 to-purple-600',
    'from-blue-500 to-blue-600',
    'from-cyan-500 to-cyan-600',
    'from-teal-500 to-teal-600',
    'from-emerald-500 to-emerald-600',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Briefcase className="h-8 w-8 text-blue-400" />
          </div>
          Profissionais
        </h1>
        <p className="text-slate-400 mt-2">Gerencie sua equipe e acompanhe o desempenho de cada profissional</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Profissionais</p>
              <p className="text-3xl font-bold text-white mt-1">{totalStats.professionals}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Receita Total</p>
              <p className="text-3xl font-bold text-white mt-1">R$ {totalStats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avaliação Média</p>
              <p className="text-3xl font-bold text-white mt-1">{totalStats.avgRating} <Star className="inline h-6 w-6 text-yellow-400 fill-yellow-400" /></p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Award className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Add Button */}
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          Novo Profissional
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-4 py-3">
          {successMessage}
        </div>
      )}

      {/* Professionals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Carregando profissionais...</p>
          </div>
        </div>
      ) : filteredProfessionals.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Nenhum profissional encontrado</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            {searchTerm ? 'Tente buscar com outros termos' : 'Adicione profissionais à sua equipe para começar.'}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => openModal()}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Adicionar primeiro profissional →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => {
            const stats = getProfessionalStats(professional.id);
            const gradient = gradients[professionals.indexOf(professional) % gradients.length];
            const isTopPerformer = topPerformers.includes(professional.id);
            
            return (
              <div 
                key={professional.id} 
                className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
              >
                {/* Header with Photo */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative group/avatar">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                      {professional.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <button className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                    {isTopPerformer && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{professional.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-yellow-400">{stats.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <UserCheck className="w-4 h-4" />
                        <span className="text-sm font-semibold">{stats.clients} clientes</span>
                      </div>
                    </div>
                    {isTopPerformer && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400">Top Performer</span>
                      </div>
                    )}
                  </div>

                  <button className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{professional.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{professional.phone}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Agendamentos</span>
                    </div>
                    <p className="text-lg font-bold text-white">{stats.appointments}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-semibold">Receita</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-400">R$ {stats.revenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="p-3 rounded-lg bg-slate-800/30 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-slate-400">Performance</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-400">{Math.min(Math.floor((stats.appointments / 50) * 100), 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.appointments / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => router.push(`/admin/profissionais/${professional.id}`)}
                    className="flex-1 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors flex items-center justify-center gap-2" 
                    title="Ver Detalhes"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Detalhes</span>
                  </button>
                  <button 
                    onClick={() => openModal(professional)}
                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-lg transition-colors" 
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(professional.id)}
                    disabled={deletingId === professional.id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Excluir"
                  >
                    {deletingId === professional.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Editar Profissional' : 'Novo Profissional'}
                </h2>
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
              {/* Photo Upload Placeholder */}
              <div className="flex justify-center mb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {formData.name ? formData.name.slice(0, 2).toUpperCase() : <User className="w-12 h-12" />}
                  </div>
                  <button 
                    type="button"
                    className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Upload className="w-6 h-6 text-white mb-1" />
                    <span className="text-xs text-white">Upload</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Nome Completo *
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: João Silva"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email *
                </label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="joao@exemplo.com"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Telefone *
                </label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar Profissional' : 'Criar Profissional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
