'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { ApiClient } from '@/services/api';
import { User, Mail, Phone, Edit, Save, X, Loader2, CheckCircle } from 'lucide-react';

const api = new ApiClient();

export default function ClientePerfilPage() {
  const { user, loadFromStorage } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const data = await api.getClient(user.id);
        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
    setError('');
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.name || !form.email || !form.phone) {
      setError('Preencha todos os campos');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await api.updateClient(user.id, form);
      setProfile(updated);
      setEditing(false);
      setSuccess('Perfil atualizado com sucesso!');
      loadFromStorage(); // Refresh auth state
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-400">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="h-8 w-8 text-indigo-400" />
            Meu Perfil
          </h1>
          <p className="text-slate-400 mt-2">Gerencie suas informações pessoais</p>
        </div>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
          >
            <Edit className="h-5 w-5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              <X className="h-5 w-5" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Salvar
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-100 px-4 py-3 flex items-center gap-2">
          <X className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 px-4 py-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8">
        <div className="flex items-start gap-6 mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {(editing ? form.name : profile?.name || 'CL')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {editing ? form.name : profile?.name || 'Cliente'}
            </h2>
            <p className="text-slate-400">
              Membro desde {new Date(profile?.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            {profile?.blocked && (
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold">
                <X className="h-4 w-4" />
                Conta Bloqueada
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </div>
            </label>
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Seu nome completo"
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 text-white px-4 py-3 rounded-xl">
                {profile?.name || 'Não informado'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </label>
            {editing ? (
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="seu@email.com"
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 text-white px-4 py-3 rounded-xl">
                {profile?.email || 'Não informado'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </div>
            </label>
            {editing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="(00) 00000-0000"
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 text-white px-4 py-3 rounded-xl">
                {profile?.phone || 'Não informado'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
