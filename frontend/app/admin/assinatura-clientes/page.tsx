'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Gift, DollarSign, User, Clock, Check, AlertCircle } from 'lucide-react';

interface ClientSubscription {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  creditsRemaining: number;
  totalCredits: number;
  createdAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
}

interface CreateSubscriptionForm {
  clientId: string;
  creditAmount: number;
  expirationDays: number;
}

export default function AssinaturasClientesPage() {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processingCreate, setProcessingCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<CreateSubscriptionForm>({
    clientId: '',
    creditAmount: 0,
    expirationDays: 30,
  });
  const [establishmentId, setEstablishmentId] = useState('');

  useEffect(() => {
    const estId = localStorage.getItem('establishmentId') || '';
    setEstablishmentId(estId);
  }, []);

  useEffect(() => {
    if (establishmentId) {
      loadData();
    }
  }, [establishmentId]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Buscar clientes
      const clientsResponse = await fetch('http://localhost:3001/api/clients');
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(Array.isArray(clientsData) ? clientsData : []);
      }

      // Buscar assinaturas de clientes
      const subsResponse = await fetch(
        `http://localhost:3001/api/client-subscriptions/establishment/${establishmentId}`
      );
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || formData.creditAmount <= 0) {
      setError('Selecione um cliente e informe créditos válidos');
      return;
    }

    setProcessingCreate(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `http://localhost:3001/api/client-subscriptions/establishment/${establishmentId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: formData.clientId,
            creditAmount: formData.creditAmount,
            expirationDays: formData.expirationDays,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Assinatura criada com sucesso para ${clients.find(c => c.id === formData.clientId)?.name}!`);
        setFormData({ clientId: '', creditAmount: 0, expirationDays: 30 });
        setShowForm(false);
        loadData();
      } else {
        setError(data.message || 'Erro ao criar assinatura');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao processar criação de assinatura');
    } finally {
      setProcessingCreate(false);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja remover essa assinatura?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/client-subscriptions/${subscriptionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSuccess('Assinatura removida com sucesso!');
        loadData();
      } else {
        setError('Erro ao remover assinatura');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao remover assinatura');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'USED': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EXPIRED': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '✅ Ativo';
      case 'USED': return '✔️ Utilizado';
      case 'EXPIRED': return '⏱️ Expirado';
      default: return status;
    }
  };

  const getAvailableClients = () => {
    const withoutSubs = clients.filter(
      client => !subscriptions.some(sub => sub.clientId === client.id && sub.status === 'ACTIVE')
    );
    return withoutSubs;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Assinaturas de Clientes</h1>
            <p className="text-slate-400">
              Crie planos de créditos/assinatura para seus clientes
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Assinatura
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Criar Nova Assinatura</h2>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    {getAvailableClients().map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Créditos (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, creditAmount: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="100.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Validade (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.expirationDays}
                    onChange={(e) =>
                      setFormData({ ...formData, expirationDays: parseInt(e.target.value) })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-400 text-sm">
                  💡 Dica: Crie planos de assinatura com créditos para incentivar clientes a agendar serviços.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingCreate}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {processingCreate ? 'Criando...' : 'Criar Assinatura'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Assinaturas */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Assinaturas Ativas ({subscriptions.filter(s => s.status === 'ACTIVE').length})
          </h2>

          {subscriptions.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Nenhuma assinatura de cliente criada ainda</p>
              <p className="text-slate-500 text-sm mt-1">Clique em "Nova Assinatura" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`bg-slate-800/50 border rounded-lg p-6 transition-all hover:shadow-lg ${
                    sub.status === 'ACTIVE'
                      ? 'border-purple-500/30'
                      : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" />
                        {sub.clientName}
                      </h3>
                      <p className="text-slate-400 text-sm">{sub.clientEmail}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-slate-400">Créditos Restantes:</span>
                      </div>
                      <span className="text-xl font-bold text-green-400">
                        R$ {sub.creditsRemaining.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total de Créditos:</span>
                      <span className="text-white font-semibold">R$ {sub.totalCredits.toFixed(2)}</span>
                    </div>

                    {sub.expiresAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Expira em:
                        </span>
                        <span className={sub.status === 'EXPIRED' ? 'text-red-400' : 'text-white'}>
                          {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Criado em:</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {sub.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDeleteSubscription(sub.id)}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover Assinatura
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm font-medium">Assinaturas Ativas</p>
            <p className="text-3xl font-bold text-white mt-1">
              {subscriptions.filter(s => s.status === 'ACTIVE').length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm font-medium">Créditos em Circulação</p>
            <p className="text-3xl font-bold text-white mt-1">
              R$ {subscriptions
                .filter(s => s.status === 'ACTIVE')
                .reduce((acc, s) => acc + s.creditsRemaining, 0)
                .toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-lg p-4">
            <p className="text-purple-400 text-sm font-medium">Total de Clientes</p>
            <p className="text-3xl font-bold text-white mt-1">{clients.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
