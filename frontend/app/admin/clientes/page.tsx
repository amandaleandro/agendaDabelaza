"use client";

import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Loader2, Edit, Trash2, Ban, CheckCircle, Shield } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Client } from '@/types';

const api = new ApiClient();

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listClients();
        setClients(data);
        setError('');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term),
    );
  }, [clients, query]);

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({ name: client.name, email: client.email, phone: client.phone });
    setError('');
    setSuccess('');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const updated = await api.updateClient(editing.id, form);
      setClients((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...updated } : c)));
      setSuccess('Cliente atualizado com sucesso.');
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erro ao atualizar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este cliente?')) return;
    setWorkingId(id);
    setError('');
    setSuccess('');
    try {
      await api.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setSuccess('Cliente removido.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erro ao remover cliente');
    } finally {
      setWorkingId(null);
    }
  };

  const toggleBlock = async (client: Client) => {
    setWorkingId(client.id);
    setError('');
    setSuccess('');
    try {
      const updated = await api.setClientBlocked(client.id, !client.blocked);
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, ...updated } : c)));
      setSuccess(updated.blocked ? 'Cliente bloqueado.' : 'Cliente desbloqueado.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erro ao atualizar bloqueio');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="mt-1 text-sm text-slate-400">Gerencie perfis, histórico e engajamento dos clientes.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Buscar por nome ou email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-3">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total de clientes</p>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando clientes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <div className="rounded-full bg-slate-800/50 p-4">
            <Users className="h-10 w-10 text-slate-500" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Nenhum cliente encontrado</p>
            <p className="mt-1 text-sm text-slate-400">
              {query ? 'Tente ajustar os termos da busca.' : 'Aguarde novos cadastros de clientes.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <div key={client.id} className="group rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 transition-all hover:border-slate-700 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-500/20">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{client.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-400 truncate">{client.email}</p>
                  <p className="mt-1 text-sm text-slate-500">{client.phone}</p>
                </div>
              </div>
              
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-xs text-slate-500">ID: {client.id.slice(0, 8)}</span>
                <div className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${client.blocked ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                  {client.blocked ? 'Bloqueado' : 'Ativo'}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(client)}
                  className="flex-1 rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/80 transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={() => toggleBlock(client)}
                  disabled={workingId === client.id}
                  className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {client.blocked ? <Shield className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {client.blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  disabled={workingId === client.id}
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-100 px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 px-4 py-3">
          {success}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Editar cliente</h3>
                <p className="text-xs text-slate-400">{editing.email}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Nome</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Email</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Telefone</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
