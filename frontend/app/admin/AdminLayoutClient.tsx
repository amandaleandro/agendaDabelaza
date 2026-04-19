'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth';
import {
  LogOut,
  Menu,
  LayoutDashboard,
  Globe,
  Scissors,
  Calendar,
  User,
  Package,
  Briefcase,
  CreditCard,
  MessageCircle,
  BarChart3,
  Crown,
  Settings,
  Gift,
} from 'lucide-react';

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loadFromStorage } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/landing', label: 'Landing Page', icon: Globe },
    { href: '/admin/servicos', label: 'Serviços', icon: Scissors },
    { href: '/admin/planos-servicos', label: 'Planos', icon: Package },
    { href: '/admin/produtos', label: 'Produtos', icon: Package },
    { href: '/admin/profissionais', label: 'Profissionais', icon: Briefcase },
    { href: '/admin/clientes', label: 'Clientes', icon: User },
    { href: '/admin/assinatura', label: 'Meu Plano', icon: Crown },
    { href: '/admin/assinatura-clientes', label: 'Créditos Clientes', icon: Gift },
    { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
    { href: '/admin/agenda', label: 'Agenda', icon: Calendar },
    { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
    { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0f172a] font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-[#0b1224] px-4 py-6 transition-transform duration-300 md:static md:z-auto md:w-64 md:max-w-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Link href="/admin/dashboard" className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20">
              A
            </div>
            <span className="text-lg font-semibold text-white">
              AppointPro<span className="text-indigo-400">Beauty</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-1 text-sm font-medium text-slate-300">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                    isActive ? 'bg-indigo-500/10 text-indigo-300' : 'hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="mt-6 border-t border-slate-800 pt-4 md:hidden">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2 md:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20">
                    A
                  </div>
                  <span className="truncate text-base font-semibold text-white">
                    AppointPro<span className="text-indigo-400">Beauty</span>
                  </span>
                </Link>
              </div>

              {user && (
                <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="hidden min-w-0 text-right sm:block">
                    <p className="truncate text-sm font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
