"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { User, Calendar, CreditCard, LogOut, Menu, X, RotateCcw } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

export default function AdminClienteLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const slug = params.slug as string;
  const { user, isAuthenticated, loadFromStorage, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    loadFromStorage();
    setLoading(false);
  }, [loadFromStorage]);

  useEffect(() => {
    // Proteção: se não estiver autenticado e não for a página de login, redirecionar
    if (!loading && !isAuthenticated && !pathname?.endsWith('/admincliente')) {
      router.push(`/${slug}/admincliente`);
    }
  }, [isAuthenticated, loading, pathname, router, slug]);

  const handleLogout = () => {
    logout();
    router.push(`/${slug}`);
  };

  // Se estiver na página de login, apenas renderizar sem menu
  if (pathname?.endsWith('/admincliente')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const menuItems = [
    { label: 'Agendamentos', icon: Calendar, path: `/${slug}/admincliente/agendamentos` },
    { label: 'Perfil', icon: User, path: `/${slug}/admincliente/perfil` },
    { label: 'Assinatura', icon: CreditCard, path: `/${slug}/admincliente/assinatura` },
    { label: 'Reembolsos', icon: RotateCcw, path: `/${slug}/admincliente/reembolsos` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden text-white p-2 hover:bg-slate-700 rounded-lg"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-white text-xl font-semibold">Área do Cliente</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-slate-800/40 border-r border-slate-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  style={isActive ? { backgroundColor: hexToRgba(primary, 0.15) } : undefined}
                >
                  <Icon className="w-5 h-5" style={isActive ? { color: primary } : undefined} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)}>
            <aside
              className="w-64 bg-slate-800 h-full border-r border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path);
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'text-white font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                      style={isActive ? { backgroundColor: hexToRgba(primary, 0.15) } : undefined}
                    >
                      <Icon className="w-5 h-5" style={isActive ? { color: primary } : undefined} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
