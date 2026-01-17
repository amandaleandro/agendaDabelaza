'use client';

import { API_BASE_URL } from '@/config/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/store/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) {
        setError('Email é obrigatório');
        return;
      }
      if (!password.trim()) {
        setError('Senha é obrigatória');
        return;
      }

      // Chama API de login
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer login');
      }

      const data = await response.json();
      
      login(
        data.token,
        {
          id: data.owner.id,
          name: data.owner.name,
          email: data.owner.email,
        },
        data.establishment
      );

      // Salvar dados do estabelecimento no localStorage
      if (data.establishment) {
        localStorage.setItem('establishmentId', data.establishment.id);
        localStorage.setItem('establishmentName', data.establishment.name);
        localStorage.setItem('establishmentSlug', data.establishment.slug);
      }

      // Salvar ownerId para facilitar chamadas de API
      localStorage.setItem('ownerId', data.owner.id);
      
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
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
          <p className="text-gray-600 text-lg">Painel do Prestador</p>
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
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              variant="primary"
              className="w-full"
              type="submit"
              isLoading={loading}
              disabled={loading}
            >
              Acessar Painel
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Não tem conta?{' '}
            <Link href="/admin/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
