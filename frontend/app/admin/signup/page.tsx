'use client';

import { API_BASE_URL } from '@/config/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/store/auth';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function AdminSignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    establishmentName: '',
    establishmentSlug: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!form.name || !form.email || !form.password || !form.passwordConfirm || !form.establishmentName || !form.establishmentSlug) {
        setError('Preencha todos os campos');
        return;
      }

      if (form.password !== form.passwordConfirm) {
        setError('As senhas não coincidem');
        return;
      }

      if (form.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Chamar API real de signup
      const response = await fetch('${API_BASE_URL}/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          establishmentName: form.establishmentName,
          establishmentSlug: form.establishmentSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar conta');
      }

      const data = await response.json();
      
      // Fazer login automaticamente após signup
      const loginResponse = await fetch('${API_BASE_URL}/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error('Conta criada, mas erro ao fazer login');
      }

      const loginData = await loginResponse.json();
      
      login(loginData.token, {
        id: loginData.owner.id,
        name: loginData.owner.name,
        email: loginData.owner.email,
      });
      
      // Salvar dados do estabelecimento no localStorage
      if (loginData.establishment) {
        localStorage.setItem('establishmentId', loginData.establishment.id);
        localStorage.setItem('establishmentName', loginData.establishment.name);
        localStorage.setItem('establishmentSlug', loginData.establishment.slug);
      }
      
      // Salvar ownerId para facilitar chamadas de API
      localStorage.setItem('ownerId', loginData.owner.id);
      
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 mb-2">
            AppointPro Beauty
          </h1>
          <p className="text-gray-600 text-lg">Crie sua conta de prestador</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nome Completo"
              type="text"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <Input
              label="Nome do Estabelecimento"
              type="text"
              placeholder="Ex: Salão da Maria"
              value={form.establishmentName}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  establishmentName: name,
                  establishmentSlug: prev.establishmentSlug || slugify(name),
                }));
              }}
              required
            />

            <div>
              <Input
                label="Slug do Estabelecimento"
                type="text"
                placeholder="ex: salao-da-maria"
                value={form.establishmentSlug}
                onChange={(e) => setForm({ ...form, establishmentSlug: slugify(e.target.value) })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use apenas letras, números e hífens</p>
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="Repita sua senha"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required
            />

            <Button
              variant="primary"
              className="w-full"
              type="submit"
              isLoading={loading}
              disabled={loading}
            >
              Criar Conta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Já tem conta?{' '}
            <Link href="/admin/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
