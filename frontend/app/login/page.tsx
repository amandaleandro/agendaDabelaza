'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { GoogleIdentityButton } from '@/components/auth/GoogleIdentityButton';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const apiClient = new ApiClient();

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const completeAuth = (response: any) => {
    login(response.token, response.owner, response.establishment);

    if (response.establishment) {
      localStorage.setItem('establishmentId', response.establishment.id);
      localStorage.setItem('establishmentName', response.establishment.name);
      localStorage.setItem('establishmentSlug', response.establishment.slug);
    }

    if (response.owner?.id) {
      localStorage.setItem('ownerId', response.owner.id);
    }

    router.push('/admin/dashboard');
  };

  const handleGoogleLogin = async (googleToken: string) => {
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.loginAdmin({ googleToken });
      completeAuth(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {

      const response = await apiClient.loginAdmin({
        email: formData.email,
        password: formData.password,
      });
      completeAuth(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
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
          Bem-vindo de volta
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Acesse sua conta para gerenciar seu negócio.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-125">
        <div className="bg-[#1e293b] py-8 px-4 shadow-2xl border border-slate-800/60 sm:rounded-2xl sm:px-10 relative overflow-hidden">
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <span className="font-bold">Erro:</span> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Google Button */}
            <GoogleIdentityButton
              text="signin_with"
              onCredential={handleGoogleLogin}
              onError={setError}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1e293b] text-slate-500">ou continue com email</span>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Senha</label>
                <a href="#" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg shadow-indigo-600/20 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e293b] focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Não tem uma conta? <Link href="/signup" className="text-indigo-400 hover:underline">Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
