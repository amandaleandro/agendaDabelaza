"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { useParams } from 'next/navigation';
import { Save, User, Mail, Phone, Lock } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

export default function PerfilPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:3001/api/public/users/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setForm(prev => ({
            ...prev,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user?.id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      // Validar senhas se estiver tentando alterar
      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (form.newPassword.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }
        if (!form.currentPassword) {
          throw new Error('Informe sua senha atual para alterá-la');
        }
      }

      const updateData: any = {
        name: form.name,
        phone: form.phone,
      };

      if (form.newPassword && form.currentPassword) {
        updateData.currentPassword = form.currentPassword;
        updateData.newPassword = form.newPassword;
      }

      const res = await fetch(`http://localhost:3001/api/public/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao atualizar perfil');
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      // Limpar campos de senha
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary }} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6">Meu Perfil</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white text-xl font-semibold mb-4">Dados Pessoais</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome Completo
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2"
                style={{ borderColor: primary }}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                disabled
                className="w-full px-4 py-3 bg-slate-900/30 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <p className="text-slate-400 text-xs mt-1">O email não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={onChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2"
                style={{ borderColor: primary }}
              />
            </div>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white text-xl font-semibold mb-4">Alterar Senha</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Senha Atual
              </label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={onChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2"
                style={{ borderColor: primary }}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Nova Senha
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={onChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2"
                style={{ borderColor: primary }}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2"
                style={{ borderColor: primary }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
          style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}
