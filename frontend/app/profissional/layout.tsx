'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/store/auth';

const navItems = [
  { href: '/profissional/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profissional/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/profissional/atendimentos', label: 'Atendimentos', icon: ClipboardList },
];

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, establishment, isAuthenticated, loadFromStorage, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!pathname?.startsWith('/profissional/login') && (!isAuthenticated || user?.role !== 'professional')) {
      router.replace('/profissional/login');
    }
  }, [isAuthenticated, pathname, router, user]);

  const initials = useMemo(() => {
    if (!user?.name) return 'PR';
    return user.name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  if (pathname === '/profissional/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_65%)] text-white">
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur transition-transform lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Portal</p>
            <h1 className="text-xl font-black">Profissional</h1>
          </div>
          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.name || 'Profissional'}</p>
              <p className="truncate text-sm text-slate-400">{establishment?.name || 'Estabelecimento'}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pb-4">
          <button
            onClick={() => {
              logout();
              router.push('/profissional/login');
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm text-slate-400">Estabelecimento</p>
                <h2 className="text-lg font-semibold">{establishment?.name || 'Portal do profissional'}</h2>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
