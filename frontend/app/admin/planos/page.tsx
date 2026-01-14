'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { getAppUrl } from '@/config/api';
import { 
  Crown, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  Gift
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  active: boolean;
  discount?: number;
  maxServices?: number;
  createdAt: string;
}

export default function PlanosPage() {
  const { establishment, loadFromStorage } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationDays: '30',
    discount: '',
    maxServices: '',
    benefits: [''],
    active: true,
  });

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (establishment?.id) {
      loadPlans();
    }
  }, [establishment?.id]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const apiUrl = getAppUrl();
      const response = await fetch(`${apiUrl}/establishments/${establishment?.id}/plans`);
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        console.error('Erro ao carregar planos');
        setPlans([]);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ''],
    });
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({
      ...formData,
      benefits: newBenefits,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!establishment?.id) {
      alert('Erro: Estabelecimento não identificado');
      return;
    }
    
    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays),
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        maxServices: formData.maxServices ? parseInt(formData.maxServices) : undefined,
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        active: formData.active,
      };

      const apiUrl = getAppUrl();
      const url = editingPlan
        ? `${apiUrl}/establishments/${establishment.id}/plans/${editingPlan.id}`
        : `${apiUrl}/establishments/${establishment.id}/plans`;

      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar plano');
      }

      setShowModal(false);
      resetForm();
      await loadPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano. Tente novamente.');
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      discount: plan.discount?.toString() || '',
      maxServices: plan.maxServices?.toString() || '',
      benefits: plan.benefits,
      active: plan.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    if (!establishment?.id) return;
    
    try {
      const apiUrl = getAppUrl();
      const response = await fetch(
        `${apiUrl}/establishments/${establishment.id}/plans/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir plano');
      }

      await loadPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      alert('Erro ao excluir plano. Tente novamente.');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (!establishment?.id) return;

    try {
      const apiUrl = getAppUrl();
      const response = await fetch(
        `${apiUrl}/establishments/${establishment.id}/plans/${id}/toggle`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await loadPlans();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar plano. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      durationDays: '30',
      discount: '',
      maxServices: '',
      benefits: [''],
      active: true,
    });
    setEditingPlan(null);
  };

  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.active).length,
    totalSubscribers: 0, // TODO: Implementar contagem real do backend
    monthlyRevenue: plans.reduce((sum, p) => sum + p.price, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Planos de Assinatura</h1>
          <p className="text-slate-600 mt-1">Gerencie os planos de fidelidade oferecidos aos seus clientes</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Crown className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.totalPlans}</span>
          </div>
          <p className="text-blue-100 font-medium">Total de Planos</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.activePlans}</span>
          </div>
          <p className="text-green-100 font-medium">Planos Ativos</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.totalSubscribers}</span>
          </div>
          <p className="text-purple-100 font-medium">Assinantes</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">R$ {stats.monthlyRevenue.toFixed(0)}</span>
          </div>
          <p className="text-orange-100 font-medium">Receita Mensal</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
              plan.active ? 'border-indigo-200' : 'border-slate-200 opacity-60'
            }`}
          >
            {/* Plan Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-t-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <Crown className="w-10 h-10" />
                  <button
                    onClick={() => toggleActive(plan.id, plan.active)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.active
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {plan.active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className="text-blue-100 text-sm">{plan.description}</p>
              </div>
            </div>

            {/* Plan Body */}
            <div className="p-6 space-y-4">
              {/* Price */}
              <div className="text-center py-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-slate-600">R$</span>
                  <span className="text-5xl font-black text-indigo-600">{plan.price.toFixed(2).split('.')[0]}</span>
                  <span className="text-2xl font-bold text-slate-600">,{plan.price.toFixed(2).split('.')[1]}</span>
                </div>
                <p className="text-slate-500 text-sm mt-2">por {plan.durationDays} dias</p>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                {plan.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                {plan.discount && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{plan.discount}%</p>
                    <p className="text-xs text-slate-500">Desconto</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {plan.maxServices || '∞'}
                  </p>
                  <p className="text-xs text-slate-500">Serviços/mês</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: Plano Bronze"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descreva o plano..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="99.90"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Duração (dias) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Máx. Serviços/Mês
                    </label>
                    <input
                      type="number"
                      value={formData.maxServices}
                      onChange={(e) => setFormData({ ...formData, maxServices: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Deixe vazio para ilimitado"
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Benefícios *
                </label>
                <div className="space-y-3">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleBenefitChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ex: 10% de desconto em todos os serviços"
                      />
                      {formData.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Benefício
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <label htmlFor="active" className="text-sm font-semibold text-slate-700">
                  Plano ativo (visível para os clientes)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
