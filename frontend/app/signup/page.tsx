'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { Mail, Lock, User, Building2, ArrowRight, Loader2, CheckCircle2, Zap, Crown, Rocket, Star } from 'lucide-react';

const apiClient = new ApiClient();

const PLANS = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 0,
    icon: Zap,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    description: 'Ideal para começar',
    features: ['Até 30 agendamentos/mês', 'Taxa de 10% por agendamento'],
  },
  {
    id: 'BASIC',
    name: 'Básico',
    price: 49.90,
    icon: CheckCircle2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Para pequenos negócios',
    features: ['Agendamentos ilimitados', 'Taxa de 5% por agendamento'],
  },
  {
    id: 'PRO',
    name: 'Profissional',
    price: 99.90,
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    popular: true,
    description: 'Mais vendido',
    features: ['Sem taxas', 'Recursos avançados', 'Suporte prioritário'],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 199.90,
    icon: Rocket,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Para empresas',
    features: ['Tudo do Pro', 'Sem limitações', 'Suporte dedicado'],
  },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    companyName: '',
    cnpj: '',
  });
  const [hasCnpj, setHasCnpj] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('FREE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleSignup = () => {
    console.log('Signup com Google');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Se tem CNPJ, usa o nome da empresa. Se não, usa o nome do dono como nome do estabelecimento.
      const finalCompanyName = hasCnpj ? formData.companyName : formData.ownerName;
      const slug = generateSlug(finalCompanyName);
      
      const response = await apiClient.signup({
        ownerName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        companyName: finalCompanyName,
        slug: slug,
        cnpj: hasCnpj ? formData.cnpj : undefined,
        planType: selectedPlan,
        // Campos opcionais
        phone: '',
        bio: '',
        primaryColor: '#4f46e5',
      });
      
      login(response.token, response.owner, response.establishment);
      
      // Se escolheu plano pago, redireciona para pagamento
      if (selectedPlan !== 'FREE') {
        router.push('/admin/assinatura');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            A
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">AppointPro Beauty</span>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Crie sua conta grátis
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Comece a gerenciar seu negócio em minutos.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[500px]">
        <div className="bg-[#1e293b] py-8 px-4 shadow-2xl border border-slate-800/60 sm:rounded-2xl sm:px-10 relative overflow-hidden">
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <span className="font-bold">Erro:</span> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-700 rounded-lg text-slate-300 bg-slate-900/50 hover:bg-slate-800 hover:text-white transition-all font-medium text-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Cadastrar com Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1e293b] text-slate-500">ou continue com email</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Seu Nome</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  name="ownerName"
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                  placeholder="João Silva"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                  placeholder="joao@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Toggle CNPJ */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">Possui empresa aberta (CNPJ)?</span>
                <span className="text-xs text-slate-500">Habilita cadastro completo da empresa</span>
              </div>
              <button
                type="button"
                onClick={() => setHasCnpj(!hasCnpj)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasCnpj ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hasCnpj ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Campos de Empresa (Condicional) */}
            {hasCnpj && (
              <div className="space-y-5 pt-2 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da Empresa</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <input
                      name="companyName"
                      type="text"
                      required={hasCnpj}
                      value={formData.companyName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                      placeholder="Salão da Maria Ltda"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CNPJ</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <input
                      name="cnpj"
                      type="text"
                      required={hasCnpj}
                      value={formData.cnpj}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Plan Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300 mb-3">Escolha seu plano</label>
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        selectedPlan === plan.id
                          ? `${plan.borderColor} ${plan.bgColor} scale-[1.02]`
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Popular
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                          <Icon className={`w-5 h-5 ${plan.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200 text-sm">{plan.name}</div>
                          <div className="text-xs text-slate-500 mb-1">{plan.description}</div>
                          <div className="font-bold text-white">
                            {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}/mês`}
                          </div>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-400" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              {selectedPlan !== 'FREE' && (
                <p className="text-xs text-slate-500 text-center">
                  * Você pode começar com 14 dias grátis e cancelar quando quiser
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg shadow-indigo-600/20 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e293b] focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Criando conta...
                </>
              ) : (
                <>
                  Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Ao se cadastrar, você concorda com nossos <a href="#" className="text-indigo-400 hover:underline">Termos de Uso</a> e <a href="#" className="text-indigo-400 hover:underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}
