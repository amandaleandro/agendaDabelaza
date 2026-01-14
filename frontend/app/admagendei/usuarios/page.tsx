'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  MoreVertical, 
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Eye,
  Ban,
  CheckCircle,
  Crown,
  Building2,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  role?: 'admin' | 'owner' | 'professional' | 'client';
  status?: 'active' | 'inactive' | 'suspended';
  blocked?: boolean;
  establishments?: any[];
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Buscar clientes com estabelecimentos
      const clients = await api.listClients();
      const professionals = await api.listProfessionals();
      
      const allUsers: User[] = [
        ...clients.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          createdAt: c.createdAt,
          role: 'client' as const,
          status: c.blocked ? 'suspended' : 'active',
          blocked: c.blocked || false,
          establishments: []
        })),
        ...professionals.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          createdAt: p.createdAt,
          role: 'professional' as const,
          status: 'active' as const,
          blocked: false,
          establishments: []
        }))
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    setShowMenu(null);
  };

  const handleBlockUser = async (userId: string, shouldBlock: boolean) => {
    setBlocking(userId);
    try {
      // Chamar API para bloquear/desbloquear
      if (selectedUser?.role === 'client') {
        await api.setClientBlocked(userId, shouldBlock);
      }
      
      // Atualizar lista
      await loadUsers();
      
      if (selectedUser?.id === userId) {
        setSelectedUser({
          ...selectedUser,
          blocked: shouldBlock,
          status: shouldBlock ? 'suspended' : 'active'
        });
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      alert('Erro ao bloquear usuário');
    } finally {
      setBlocking(null);
      setShowMenu(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    owners: users.filter(u => u.role === 'owner').length,
    professionals: users.filter(u => u.role === 'professional').length,
    clients: users.filter(u => u.role === 'client').length
  };

  const roleConfig = {
    admin: { icon: Shield, color: 'red', label: 'Admin' },
    owner: { icon: Crown, color: 'purple', label: 'Proprietário' },
    professional: { icon: UserCheck, color: 'blue', label: 'Profissional' },
    client: { icon: Users, color: 'emerald', label: 'Cliente' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Users className="h-8 w-8 text-amber-400" />
          </div>
          Usuários
        </h1>
        <p className="text-slate-400 mt-2">Gerencie todos os usuários da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Ativos</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Admins</p>
              <p className="text-2xl font-bold text-red-400">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Owners</p>
              <p className="text-2xl font-bold text-purple-400">{stats.owners}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <UserCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Profissionais</p>
              <p className="text-2xl font-bold text-blue-400">{stats.professionals}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Clientes</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.clients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="all">Todos os perfis</option>
          <option value="admin">Admins</option>
          <option value="owner">Proprietários</option>
          <option value="professional">Profissionais</option>
          <option value="client">Clientes</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Usuário</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Perfil</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Contato</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Cadastro</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = roleConfig[user.role || 'client'].icon;
                  const roleColor = roleConfig[user.role || 'client'].color;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${roleColor}-500/10 text-${roleColor}-400 border border-${roleColor}-500/20`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig[user.role || 'client'].label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Phone className="w-3 h-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          user.status === 'suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {user.status === 'active' ? <CheckCircle className="w-3 h-3" /> :
                           user.status === 'suspended' ? <Ban className="w-3 h-3" /> :
                           <UserX className="w-3 h-3" />}
                          {user.status === 'active' ? 'Ativo' :
                           user.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 relative">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-blue-400"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setShowMenu(showMenu === user.id ? null : user.id)}
                              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                              title="Mais opções"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {showMenu === user.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                                {user.role === 'client' && (
                                  <button
                                    onClick={() => handleBlockUser(user.id, !user.blocked)}
                                    disabled={blocking === user.id}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm first:rounded-t-lg"
                                  >
                                    {user.blocked ? (
                                      <>
                                        <Unlock className="w-4 h-4 text-emerald-400" />
                                        <span>Desbloquear Usuário</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-4 h-4 text-red-400" />
                                        <span>Bloquear Usuário</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Modal de Detalhes */}
    {showModal && selectedUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Detalhes do Usuário</h2>
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedUser(null);
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                <p className="text-slate-400">{selectedUser.email}</p>
                {selectedUser.phone && <p className="text-slate-400">{selectedUser.phone}</p>}
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Perfil</p>
                <p className="text-lg font-bold text-white">{roleConfig[selectedUser.role || 'client'].label}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <p className={`text-lg font-bold ${selectedUser.blocked ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedUser.blocked ? 'Bloqueado' : 'Ativo'}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Informações de Contato</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">
                    Cadastro: {new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Establishments */}
            {selectedUser.role === 'client' && selectedUser.establishments && selectedUser.establishments.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Estabelecimentos
                </h4>
                <div className="space-y-2">
                  {selectedUser.establishments.map((est: any) => (
                    <div key={est.id} className="p-3 rounded bg-slate-800/50 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{est.name}</p>
                        <p className="text-xs text-slate-400">{est.slug}</p>
                      </div>
                      {est.blocked && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              {selectedUser.role === 'client' && (
                <button
                  onClick={() => handleBlockUser(selectedUser.id, !selectedUser.blocked)}
                  disabled={blocking === selectedUser.id}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    selectedUser.blocked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {blocking === selectedUser.id ? (
                    <>Processando...</>
                  ) : selectedUser.blocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Desbloquear Usuário
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Bloquear Usuário
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
};
