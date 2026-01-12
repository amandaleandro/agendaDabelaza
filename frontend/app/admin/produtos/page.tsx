"use client";

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Package, Loader2 } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Product, Professional } from '@/types';

const api = new ApiClient();

export default function ProdutosPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === selectedProfessionalId),
    [professionals, selectedProfessionalId],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [proList, productList] = await Promise.all([
          api.listProfessionals(),
          api.listProducts(),
        ]);
        setProfessionals(proList);
        setProducts(productList);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, []);

  const fetchProducts = async (professionalId?: string) => {
    setLoading(true);
    try {
      const data = await api.listProducts(professionalId || undefined);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessionalId) return;

    setSaving(true);
    try {
      const establishmentId = selectedProfessional?.establishmentId;
      await api.createProduct({
        establishmentId,
        professionalId: selectedProfessionalId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
      });

      await fetchProducts(selectedProfessionalId || undefined);
      setModalOpen(false);
      setForm({ name: '', description: '', price: '', stock: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = async (value: string) => {
    setSelectedProfessionalId(value);
    await fetchProducts(value || undefined);
  };

  const productCount = products.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Produtos</h1>
          <p className="mt-1 text-sm text-slate-400">Gerencie itens, preços e estoque por profissional.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedProfessionalId}
            onChange={(e) => void handleFilterChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos os profissionais</option>
            {professionals.map((pro) => (
              <option key={pro.id} value={pro.id}>
                {pro.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!professionals.length}
          >
            <PlusCircle className="h-4 w-4" />
            Novo produto
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-3">
              <Package className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total de produtos</p>
              <p className="text-2xl font-bold text-white">{productCount}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando produtos...
        </div>
      ) : productCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <div className="rounded-full bg-slate-800/50 p-4">
            <Package className="h-10 w-10 text-slate-500" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Nenhum produto cadastrado</p>
            <p className="mt-1 text-sm text-slate-400">Comece criando seu primeiro produto.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
            disabled={!professionals.length}
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar primeiro produto
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="group rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 transition-all hover:border-slate-700 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{product.description}</p>
                </div>
                <div className="flex-shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
                  R$ {product.price.toFixed(2)}
                </div>
              </div>
              
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="rounded bg-slate-800 px-2.5 py-1">
                    <span className="text-slate-400">Estoque: </span>
                    <span className="font-semibold text-white">{product.stock}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">ID: {product.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Novo produto</h2>
                <p className="mt-1 text-sm text-slate-400">Preencha os dados para cadastrar o item.</p>
              </div>
              <button 
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white" 
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="block text-sm font-medium text-slate-300">Profissional</label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione um profissional
                  </option>
                  {professionals.map((pro) => (
                    <option key={pro.id} value={pro.id}>
                      {pro.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Nome do produto</label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ex: Shampoo Premium"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300">Descrição</label>
                <textarea
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Descreva o produto..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Preço (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Estoque</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving || !selectedProfessionalId}
                >
                  {saving ? 'Salvando...' : 'Criar produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
