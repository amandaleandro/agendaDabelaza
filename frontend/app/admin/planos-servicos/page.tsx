'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, AlertCircle, Check } from 'lucide-react';

interface ServiceOption {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: number;
}

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  services: ServiceOption[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface FormData {
  name: string;
  description: string;
  totalPrice: number;
  services: ServiceOption[];
}

export default function PlanosServicosPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    totalPrice: 0,
    services: [],
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
      // Buscar serviços disponíveis
      const servicesResponse = await fetch('http://localhost:3001/api/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(Array.isArray(servicesData) ? servicesData : []);
      }

      // Buscar planos de serviços
      const plansResponse = await fetch(
        `http://localhost:3001/api/service-plans/establishment/${establishmentId}`
      );
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(Array.isArray(plansData) ? plansData : []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        { serviceId: '', serviceName: '', quantity: 1, price: 0 },
      ],
    });
  };

  const updateService = (
    index: number,
    field: keyof ServiceOption,
    value: any
  ) => {
    const updated = [...formData.services];
    
    if (field === 'serviceId') {
      const service = services.find(s => s.id === value);
      updated[index] = {
        ...updated[index],
        serviceId: value,
        serviceName: service?.name || '',
        price: service?.price || 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    // Recalcular preço total
    const totalPrice = updated.reduce((acc, s) => acc + (s.price * s.quantity), 0);

    setFormData({
      ...formData,
      services: updated,
      totalPrice,
    });
  };

  const removeService = (index: number) => {
    const updated = formData.services.filter((_, i) => i !== index);
    
    // Recalcular preço total
    const totalPrice = updated.reduce((acc, s) => acc + (s.price * s.quantity), 0);

    setFormData({
      ...formData,
      services: updated,
      totalPrice,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.services.length === 0) {
      setError('Preencha o nome do plano e adicione pelo menos um serviço');
      return;
    }

    if (formData.services.some(s => !s.serviceId)) {
      setError('Todos os serviços devem ser selecionados');
      return;
    }

    try {
      const url = editingId
        ? `http://localhost:3001/api/service-plans/${editingId}`
        : `http://localhost:3001/api/service-plans/establishment/${establishmentId}`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          editingId
            ? 'Plano atualizado com sucesso!'
            : 'Plano criado com sucesso!'
        );
        setFormData({ name: '', description: '', totalPrice: 0, services: [] });
        setEditingId(null);
        setShowForm(false);
        loadData();
      } else {
        setError(data.message || 'Erro ao salvar plano');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao processar plano');
    }
  };

  const handleEdit = (plan: ServicePlan) => {
    setFormData({
      name: plan.name,
      description: plan.description,
      totalPrice: plan.totalPrice,
      services: plan.services,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Tem certeza que deseja remover este plano?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/service-plans/${planId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSuccess('Plano removido com sucesso!');
        loadData();
      } else {
        setError('Erro ao remover plano');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao remover plano');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', totalPrice: 0, services: [] });
    setError('');
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
            <h1 className="text-3xl font-bold text-white mb-2">Planos de Serviços</h1>
            <p className="text-slate-400">
              Crie pacotes de serviços para seus clientes comprarem
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Plano
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
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Editar Plano' : 'Criar Novo Plano'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome e Descrição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="ex: Plano Manicure 4x"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Preço Total (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-bold"
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Edite o valor conforme desejar</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ex: 4 sessões de manicure com esmalte..."
                  rows={3}
                />
              </div>

              {/* Serviços */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Serviços do Plano *
                  </h3>
                  {formData.services.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const total = formData.services.reduce((acc, s) => acc + (s.price * s.quantity), 0);
                        setFormData({ ...formData, totalPrice: total });
                      }}
                      className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded transition-colors"
                    >
                      Recalcular Preço
                    </button>
                  )}
                </div>

                {formData.services.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Valor dos serviços:</p>
                        <p className="font-semibold text-white">
                          R$ {formData.services.reduce((acc, s) => acc + (s.price * s.quantity), 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Preço final do plano:</p>
                        <p className="font-semibold text-purple-400">
                          R$ {formData.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {formData.totalPrice !== formData.services.reduce((acc, s) => acc + (s.price * s.quantity), 0) && (
                      <p className="text-xs text-blue-400 mt-2">
                        {formData.totalPrice > formData.services.reduce((acc, s) => acc + (s.price * s.quantity), 0) 
                          ? `✓ Você está aplicando um markup de R$ ${(formData.totalPrice - formData.services.reduce((acc, s) => acc + (s.price * s.quantity), 0)).toFixed(2)}`
                          : `✓ Você está aplicando um desconto de R$ ${(formData.services.reduce((acc, s) => acc + (s.price * s.quantity), 0) - formData.totalPrice).toFixed(2)}`
                        }
                      </p>
                    )}
                  </div>
                )}

                {formData.services.length === 0 ? (
                  <p className="text-slate-400 text-sm mb-4">
                    Nenhum serviço adicionado. Clique em "Adicionar Serviço" para começar.
                  </p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {formData.services.map((service, index) => (
                      <div
                        key={index}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 flex items-end gap-3"
                      >
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Serviço
                          </label>
                          <select
                            value={service.serviceId}
                            onChange={(e) => updateService(index, 'serviceId', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          >
                            <option value="">Selecione...</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (R$ {s.price?.toFixed(2) || '0.00'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Qtd
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) =>
                              updateService(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="w-24">
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Subtotal
                          </label>
                          <div className="text-white font-semibold text-sm">
                            R$ {(service.price * service.quantity).toFixed(2)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addService}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Serviço
                </button>
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {editingId ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Planos */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Seus Planos ({plans.length})
          </h2>

          {plans.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Nenhum plano criado ainda</p>
              <p className="text-slate-500 text-sm mt-1">
                Clique em "Novo Plano" para começar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        plan.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {plan.status === 'ACTIVE' ? '✅ Ativo' : '⏸️ Inativo'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.services.map((service, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-300">
                          {service.quantity}x {service.serviceName}
                        </span>
                        <span className="text-white">
                          R$ {(service.price * service.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-600 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Preço total:</span>
                      <span className="text-2xl font-bold text-purple-400">
                        R$ {plan.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
