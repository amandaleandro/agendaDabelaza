'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Search, 
  MoreVertical, 
  Eye,
  Ban,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

interface Establishment {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  primaryColor?: string;
  secondaryColor?: string;
  bio?: string;
  createdAt: string;
}

export default function EstablishmentsPage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      const data = await api.listEstablishments();
      setEstablishments(data);
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (establishment: Establishment) => {
    router.push(`/${establishment.slug}`);
  };

  const handleMoreOptions = (establishment: Establishment) => {
    // Abrir menu ou redirecionar para edição
    router.push(`/admin/configuracoes?establishment=${establishment.id}`);
  };

  const filteredEstablishments = establishments.filter(est =>
    est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: establishments.length,
    active: establishments.length,
    inactive: 0,
    growth: 12.5
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Building2 className="h-8 w-8 text-blue-400" />
          </div>
          Estabelecimentos
        </h1>
        <p className="text-slate-400 mt-2">Gerencie todos os estabelecimentos da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Ativos</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Inativos</p>
              <p className="text-3xl font-bold text-slate-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-500/10">
              <Clock className="h-6 w-6 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Crescimento</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">+{stats.growth}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Nome</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Slug</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Criado em</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredEstablishments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum estabelecimento encontrado
                  </td>
                </tr>
              ) : (
                filteredEstablishments.map((establishment) => (
                  <tr
                    key={establishment.id}
                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{
                            background: establishment.primaryColor || '#3B82F6'
                          }}
                        >
                          {establishment.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{establishment.name}</p>
                          {establishment.bio && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">
                              {establishment.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        /{establishment.slug}
                      </code>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Ativo
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(establishment.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(establishment)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-blue-400"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoreOptions(establishment)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                          title="Mais opções"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
