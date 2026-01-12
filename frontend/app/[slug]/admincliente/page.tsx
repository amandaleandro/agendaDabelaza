"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

export default function ClientLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [establishmentName, setEstablishmentName] = useState<string>('');

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    // Buscar nome do estabelecimento
    const fetchEstablishment = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/public/establishments/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setEstablishmentName(data.name || slug.replace(/-/g, ' '));
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimento:', error);
      }
    };
    fetchEstablishment();
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
      const res = await fetch('http://localhost:3001/api/public/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, establishmentSlug: slug })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }
      login(data.token, { id: data.user.id, email: data.user.email });
      router.push(`/${slug}/admincliente/agendamentos`);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header com cores do estabelecimento */}
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
          <h1 className="text-white text-3xl font-bold mb-2">Área do Cliente</h1>
          <p className="text-slate-400">
            {establishmentName || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </div>

        <form 
          onSubmit={onSubmit} 
          className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6 shadow-2xl"
        >
          <div className="text-center mb-6">
            <p className="text-slate-300 text-sm">Faça login para acessar seus agendamentos</p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              value={form.email} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              onFocus={(e) => e.target.style.borderColor = primary}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block">Senha</label>
            <input 
              name="password" 
              type="password" 
              required 
              value={form.password} 
              onChange={onChange} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 transition-all"
              onFocus={(e) => e.target.style.borderColor = primary}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110 shadow-lg"
            style={{ 
              backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})`,
              boxShadow: `0 4px 15px ${hexToRgba(primary, 0.3)}`
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-400 text-sm">
              Não tem conta? Faça um agendamento para criar seu acesso.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
