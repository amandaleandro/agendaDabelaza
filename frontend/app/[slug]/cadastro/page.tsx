"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';
import { useAuth } from '@/store/auth';
import { API_BASE_URL } from '@/config/api';

export default function ClientSignupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [establishmentName, setEstablishmentName] = useState<string>('');

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  // Carregar nome do estabelecimento
  useEffect(() => {
    const loadEstablishment = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/establishments/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setEstablishmentName(data.name || slug.replace(/-/g, ' '));
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimento:', error);
      }
    };
    loadEstablishment();
  }, [slug]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validações
      if (!form.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!form.email.trim()) {
        throw new Error('Email é obrigatório');
      }
      if (!form.phone.trim()) {
        throw new Error('Telefone é obrigatório');
      }
      if (form.password !== form.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }
      if (form.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Criar usuário diretamente via API
      const res = await fetch(`${API_BASE_URL}/public/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          establishmentSlug: slug,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar conta');
      }

      const data = await res.json();
      setSuccess(true);

      // Fazer login automaticamente
      if (data.token) {
        login(data.token, { id: data.user.id, email: data.user.email });
        
        // Redirecionar para área do cliente após 2 segundos
        setTimeout(() => {
          router.push(`/${slug}/admincliente/agendamentos`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div 
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
              boxShadow: `0 10px 40px ${hexToRgba(primary, 0.4)}`
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-3xl font-bold mb-3">Conta Criada!</h1>
          <p className="text-slate-400 mb-6">Seu cadastro foi realizado com sucesso. Você será redirecionado em breve...</p>
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-xl"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
              boxShadow: `0 10px 40px ${hexToRgba(primary, 0.4)}`
            }}
          >
            {establishmentName ? establishmentName.charAt(0).toUpperCase() : slug.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">Criar Conta</h1>
          <p className="text-slate-400">
            {establishmentName || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </div>

        <form 
          onSubmit={onSubmit} 
          className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6 shadow-2xl"
        >
          <p className="text-slate-300 text-sm text-center mb-6">
            Crie sua conta para acessar a área do cliente
          </p>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome Completo
            </label>
            <input 
              name="name" 
              type="text" 
              required 
              value={form.name} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': primary } as any}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input 
              name="email" 
              type="email" 
              required 
              value={form.email} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': primary } as any}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </label>
            <input 
              name="phone" 
              type="tel" 
              required 
              value={form.phone} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': primary } as any}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha
            </label>
            <input 
              name="password" 
              type="password" 
              required 
              value={form.password} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': primary } as any}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block">Confirmar Senha</label>
            <input 
              name="confirmPassword" 
              type="password" 
              required 
              value={form.confirmPassword} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': primary } as any}
              placeholder="Digite a senha novamente"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
            style={{ 
              backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})`,
              boxShadow: `0 4px 15px ${hexToRgba(primary, 0.3)}`
            }}
          >
            {loading ? 'Criando conta...' : (
              <>
                Criar Conta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Já tem conta?{' '}
              <a 
                href={`/${slug}/admincliente`} 
                className="font-semibold transition-colors"
                style={{ color: primary }}
              >
                Faça login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
