'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Calendar, Shield, Zap, Menu, X, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const closeMenu = () => setIsMenuOpen(false);
  const navigateTo = (target: string, source: string) => {
    console.log(`[home-cta] ${source} -> ${target}`);
    router.push(target);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0f172a] text-white font-sans selection:bg-indigo-500 selection:text-white">
      <div className="pointer-events-none fixed top-0 left-0 -z-10 h-64 w-64 rounded-full bg-indigo-600/20 blur-[80px] md:left-1/4 md:h-96 md:w-96 md:blur-[128px]" />
      <div className="pointer-events-none fixed right-0 bottom-0 -z-10 h-64 w-64 rounded-full bg-purple-600/10 blur-[80px] md:right-1/4 md:h-96 md:w-96 md:blur-[128px]" />

      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" onClick={closeMenu}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/30">
              A
            </div>
            <span className="text-lg font-bold tracking-tight md:text-xl">AppointPro Beauty</span>
          </Link>

          <div className="hidden gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#funcionalidades" className="transition-colors hover:text-white">Funcionalidades</a>
            <a href="#precos" className="transition-colors hover:text-white">Precos</a>
            <a href="#sobre" className="transition-colors hover:text-white">Sobre</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <button
              type="button"
              onClick={() => navigateTo('/login', 'navbar-login')}
              className="cursor-pointer text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/signup', 'navbar-signup')}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] shadow-[0_0_15px_rgba(79,70,229,0.4)]"
            >
              Comecar Gratis
            </button>
          </div>

          <button
            className="p-2 text-slate-300 transition-colors hover:text-white md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-16 left-0 w-full animate-in slide-in-from-top-5 border-b border-white/10 bg-[#0f172a] shadow-2xl duration-200 md:hidden">
            <div className="flex flex-col gap-2 p-4">
              <a href="#funcionalidades" onClick={closeMenu} className="rounded-lg p-3 font-medium text-slate-300 hover:bg-white/5 hover:text-white">Funcionalidades</a>
              <a href="#precos" onClick={closeMenu} className="rounded-lg p-3 font-medium text-slate-300 hover:bg-white/5 hover:text-white">Precos</a>
              <a href="#sobre" onClick={closeMenu} className="rounded-lg p-3 font-medium text-slate-300 hover:bg-white/5 hover:text-white">Sobre</a>
              <div className="mx-3 my-2 h-px bg-white/10" />
              <Link href="/login" onClick={closeMenu} className="rounded-lg p-3 font-medium text-slate-300 hover:bg-white/5 hover:text-white">
                Fazer Login
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigateTo('/signup', 'mobile-signup');
                }}
                className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-900/50 active:bg-indigo-700"
              >
                Comecar Gratis
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative z-10 px-4 pt-32 pb-16 text-center md:px-6 md:pt-48 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 inline-flex cursor-default items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-indigo-500/20 md:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            <span className="font-medium">O sistema favorito dos profissionais</span>
          </div>

          <h1 className="mb-8 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl md:text-7xl">
            Gerencie seu negocio <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              sem perder tempo.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl px-4 text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
            Agendamentos, pagamentos e gestao de clientes em um so lugar.
            A plataforma completa para levar sua produtividade ao proximo nivel.
          </p>

          <div className="mb-20 flex flex-col justify-center gap-4 px-4 sm:flex-row sm:px-0">
            <button
              type="button"
              onClick={() => navigateTo('/signup', 'hero-signup')}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-900 transition-all hover:-translate-y-1 hover:bg-slate-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] shadow-[0_0_20px_rgba(255,255,255,0.3)] sm:w-auto"
            >
              Criar Conta Gratis <ArrowRight size={18} />
            </button>
            <a
              href="#funcionalidades"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-white/5 sm:w-auto"
            >
              Ver Demonstracao
            </a>
          </div>

          <div className="relative mx-auto max-w-5xl px-2 sm:px-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur md:opacity-30" />
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl">
              <div className="flex h-8 items-center gap-2 border-b border-white/5 bg-slate-900 px-4">
                <div className="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20" />
                <div className="h-3 w-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
                <div className="h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20" />
              </div>

              <div className="flex aspect-[16/9] bg-slate-900/50">
                <div className="hidden w-16 flex-col gap-4 border-r border-white/5 p-4 md:flex md:w-64">
                  <div className="mb-4 h-8 w-32 rounded bg-white/5" />
                  <div className="h-4 w-full rounded bg-white/5" />
                  <div className="h-4 w-3/4 rounded bg-white/5" />
                  <div className="h-4 w-5/6 rounded bg-white/5" />
                  <div className="mt-auto h-12 w-full rounded border border-indigo-500/20 bg-indigo-500/10" />
                </div>

                <div className="flex-1 p-4 md:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="h-8 w-48 rounded bg-white/5" />
                    <div className="h-8 w-8 rounded-full bg-white/5" />
                  </div>

                  <div className="mb-8 grid grid-cols-3 gap-4">
                    <div className="h-24 rounded-lg border border-white/5 bg-white/5" />
                    <div className="h-24 rounded-lg border border-white/5 bg-white/5" />
                    <div className="h-24 rounded-lg border border-white/5 bg-white/5" />
                  </div>

                  <div className="group relative flex h-64 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-white/5">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="text-center">
                      <Calendar className="mx-auto mb-4 h-12 w-12 text-indigo-500 opacity-50 md:h-16 md:w-16" />
                      <p className="font-mono text-xs text-slate-500 md:text-sm">Painel Administrativo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/50 px-4 py-16 md:px-6 md:py-24" id="funcionalidades">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">Recursos Poderosos</h2>
            <p className="text-sm text-slate-400 md:text-base">Tudo que voce precisa para escalar sua operacao.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {[
              { icon: <Zap className="text-yellow-400" size={28} />, title: 'Rapido e Facil', desc: 'Configure sua agenda e comece a receber reservas em menos de 2 minutos.' },
              { icon: <Shield className="text-green-400" size={28} />, title: 'Dados Seguros', desc: 'Criptografia de ponta a ponta e backups diarios automaticos.' },
              { icon: <Calendar className="text-indigo-400" size={28} />, title: 'Agenda Inteligente', desc: 'Lembretes automaticos via WhatsApp e email reduzem faltas em 30%.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/5 bg-white/5 p-6 transition-colors hover:border-white/10 hover:bg-white/[0.07] md:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 md:mb-6">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold md:mb-3">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400 md:text-base">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 md:py-32" id="precos">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">Planos que crescem com voce</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
              Escolha o plano ideal para o tamanho do seu negocio. Sem contratos de fidelidade, cancele quando quiser.
            </p>

            <div className="mb-12 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Mensal</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative h-8 w-14 rounded-full bg-slate-800 p-1 transition-colors hover:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <div className={`h-6 w-6 transform rounded-full bg-indigo-500 shadow-md transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                Anual <span className="ml-1 text-xs font-bold text-indigo-400">-20%</span>
              </span>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-slate-700">
              <div className="mb-8">
                <h3 className="mb-2 text-lg font-medium text-slate-300">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">R$ 0</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">Para quem esta comecando agora.</p>
              </div>
              <ul className="mb-8 flex-1 space-y-4">
                {['1 Profissional', 'Agenda Basica', 'Link Personalizado', 'Lembretes por Email'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="h-5 w-5 shrink-0 text-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigateTo('/signup', 'starter-signup')}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-700 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-800"
              >
                Comecar Gratis
              </button>
            </div>

            <div className="relative flex flex-col rounded-3xl border border-indigo-500/50 bg-[#1e1b4b]/40 p-8 shadow-2xl shadow-indigo-900/20 md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                MAIS POPULAR
              </div>
              <div className="mb-8">
                <h3 className="mb-2 text-lg font-medium text-indigo-300">Professional</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{billingCycle === 'monthly' ? 'R$ 49' : 'R$ 39'}</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">Para saloes em crescimento.</p>
              </div>
              <ul className="mb-8 flex-1 space-y-4">
                {['Ate 5 Profissionais', 'Lembretes WhatsApp', 'Relatorios Financeiros', 'Controle de Estoque', 'Suporte Prioritario'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <div className="rounded-full bg-indigo-500/20 p-0.5">
                      <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigateTo('/signup', 'professional-signup')}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition-all hover:bg-indigo-500 shadow-lg shadow-indigo-600/25"
              >
                Testar 7 dias gratis
              </button>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-slate-700">
              <div className="mb-8">
                <h3 className="mb-2 text-lg font-medium text-slate-300">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{billingCycle === 'monthly' ? 'R$ 199' : 'R$ 159'}</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">Para grandes redes e franquias.</p>
              </div>
              <ul className="mb-8 flex-1 space-y-4">
                {['Profissionais Ilimitados', 'API de Integracao', 'Gerente de Conta', 'Whitelabel', 'Multiplas Unidades'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="h-5 w-5 shrink-0 text-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigateTo('/signup', 'enterprise-sales')}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-700 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-800"
              >
                Falar com Vendas
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6 md:py-24" id="sobre">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-6 text-2xl font-bold md:text-5xl">Focado em resultados</h2>
          <p className="mb-12 text-lg leading-relaxed text-slate-400 md:text-xl">Criado para simplificar sua vida.</p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4 md:gap-8">
            <div className="rounded-2xl bg-white/5 p-4 sm:bg-transparent">
              <div className="mb-2 text-3xl font-bold text-indigo-400 md:text-4xl">+10k</div>
              <div className="text-sm text-slate-400 md:text-base">Usuarios ativos</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 sm:bg-transparent">
              <div className="mb-2 text-3xl font-bold text-indigo-400 md:text-4xl">98%</div>
              <div className="text-sm text-slate-400 md:text-base">Satisfacao</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 sm:bg-transparent">
              <div className="mb-2 text-3xl font-bold text-indigo-400 md:text-4xl">24/7</div>
              <div className="text-sm text-slate-400 md:text-base">Suporte</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500 md:py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-4 flex items-center justify-center gap-2 opacity-50 transition-opacity hover:opacity-100">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-[10px] font-bold text-white">A</div>
            <span className="font-bold text-white">AppointPro Beauty</span>
          </div>
          <p className="text-xs md:text-sm">© 2026 AppointPro Beauty. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
