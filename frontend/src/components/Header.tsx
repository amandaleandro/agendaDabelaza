'use client';

import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { useRouter } from 'next/navigation';

export const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          AppointPro Beauty
        </Link>

        <div className="flex gap-6">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/professionals" className="text-gray-700 hover:text-blue-600">
                Profissionais
              </Link>
              <Link href="/appointments" className="text-gray-700 hover:text-blue-600">
                Agendamentos
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/professionals" className="text-gray-700 hover:text-blue-600">
                Profissionais
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Cadastro
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
