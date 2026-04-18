'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, Scissors } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { useAuth } from '@/store/auth';

const api = new ApiClient();

export default function ProfissionalLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.loginProfessional({ email, password });
      login(
        response.token,
        { ...response.professional, role: 'professional' },
        response.establishment,
      );
      router.push('/profissional/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Não foi possível entrar com estas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#164e63_0%,_#020617_70%)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center">
        <div className="grid w-full gap-8 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex flex-col justify-between rounded-[28px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent p-6">
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                <Scissors className="h-4 w-4" />
                Área exclusiva do profissional
              </div>
              <h1 className="max-w-md text-4xl font-black leading-tight">
                Sua agenda, seus atendimentos e o fechamento do serviço em um só lugar.
              </h1>
              <p className="mt-4 max-w-lg text-slate-300">
                Entre com o email e a senha cadastrados pelo estabelecimento para acompanhar sua rotina de atendimento.
              </p>
            </div>

            <div className="mt-8 text-sm text-slate-400">
              Se ainda não recebeu acesso, peça ao administrador do estabelecimento para cadastrar sua senha no painel.
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-bold">Entrar no portal</h2>
            <p className="mt-2 text-sm text-slate-400">Use seu email profissional e sua senha.</p>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-11 py-3 text-white outline-none transition focus:border-cyan-400/50"
                    placeholder="voce@exemplo.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Senha</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-11 py-3 text-white outline-none transition focus:border-cyan-400/50"
                    placeholder="Sua senha"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? 'Entrando...' : 'Acessar portal'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Voltar para o <Link href="/login" className="text-cyan-300 hover:text-cyan-200">login administrativo</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
