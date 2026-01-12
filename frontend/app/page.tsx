'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Star, Calendar, Shield, Zap, Menu, X, ArrowRight } from 'lucide-react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Função para fechar o menu ao clicar em um link (UX Mobile)
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* --- EFEITOS DE FUNDO (GLOW OTIMIZADO) --- */}
      {/* Reduzi o tamanho do blur no mobile para performance e visual */}
      <div className="fixed top-0 left-0 md:left-1/4 w-64 md:w-96 h-64 md:h-96 bg-indigo-600/20 rounded-full blur-[80px] md:blur-[128px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-0 md:right-1/4 w-64 md:w-96 h-64 md:h-96 bg-purple-600/10 rounded-full blur-[80px] md:blur-[128px] -z-10 pointer-events-none" />

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={closeMenu}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">A</div>
            <span className="text-lg md:text-xl font-bold tracking-tight">AppointPro Beauty</span>
          </Link>

          {/* Links Desktop */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
          </div>

          {/* Botões Desktop */}
          <div className="hidden md:flex gap-4 items-center">
            <Link href="/login" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">
              Login
            </Link>
            <Link href="/signup">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] hover:-translate-y-0.5">
                Começar Grátis
              </button>
            </Link>
          </div>

          {/* Menu Mobile Button */}
          <button 
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu Mobile Dropdown (Animado e Full Width) */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-[#0f172a] border-b border-white/10 shadow-2xl animate-in slide-in-from-top-5 duration-200">
            <div className="flex flex-col p-4 gap-2">
              <a href="#funcionalidades" onClick={closeMenu} className="p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium">Funcionalidades</a>
              <a href="#precos" onClick={closeMenu} className="p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium">Preços</a>
              <a href="#sobre" onClick={closeMenu} className="p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium">Sobre</a>
              <div className="h-px bg-white/10 my-2 mx-3"></div>
              <Link href="/login" onClick={closeMenu} className="p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium">
                Fazer Login
              </Link>
              <Link href="/signup" onClick={closeMenu}>
                <button className="w-full bg-indigo-600 active:bg-indigo-700 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-900/50">
                  Começar Grátis
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 md:pt-48 pb-16 md:pb-24 px-4 md:px-6 text-center relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs md:text-sm mb-8 hover:bg-indigo-500/20 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="font-medium">O sistema favorito dos profissionais</span>
          </div>
          
          {/* Título Responsivo */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Gerencie seu negócio <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              sem perder tempo.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 mx-auto max-w-2xl leading-relaxed px-4">
            Agendamentos, pagamentos e gestão de clientes em um só lugar. 
            A plataforma completa para levar sua produtividade ao próximo nível.
          </p>

          {/* Botões Responsivos */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 px-4 sm:px-0">
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2">
                Criar Conta Grátis <ArrowRight size={18} />
              </button>
            </Link>
            <a href="#funcionalidades" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg border border-white/10 hover:bg-white/5 text-white transition-all backdrop-blur-sm">
                Ver Demonstração
              </button>
            </a>
          </div>

          {/* Mockup do Sistema (Melhorado) */}
          <div className="relative mx-auto max-w-5xl px-2 sm:px-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 md:opacity-30"></div>
            <div className="relative rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl overflow-hidden">
               {/* Fake Browser Header */}
               <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center px-4 gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
               </div>
               
               {/* Fake Dashboard Content */}
               <div className="aspect-[16/9] bg-slate-900/50 flex">
                  {/* Sidebar */}
                  <div className="w-16 md:w-64 border-r border-white/5 p-4 hidden md:flex flex-col gap-4">
                    <div className="h-8 w-32 bg-white/5 rounded mb-4"></div>
                    <div className="h-4 w-full bg-white/5 rounded"></div>
                    <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                    <div className="h-4 w-5/6 bg-white/5 rounded"></div>
                    <div className="mt-auto h-12 w-full bg-indigo-500/10 rounded border border-indigo-500/20"></div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-4 md:p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="h-8 w-48 bg-white/5 rounded"></div>
                      <div className="h-8 w-8 rounded-full bg-white/5"></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="h-24 rounded-lg bg-white/5 border border-white/5"></div>
                      <div className="h-24 rounded-lg bg-white/5 border border-white/5"></div>
                      <div className="h-24 rounded-lg bg-white/5 border border-white/5"></div>
                    </div>
                    
                    <div className="h-64 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="text-center">
                        <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto text-indigo-500 mb-4 opacity-50" />
                        <p className="text-slate-500 font-mono text-xs md:text-sm">Painel Administrativo</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-slate-900/50" id="funcionalidades">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Recursos Poderosos</h2>
            <p className="text-slate-400 text-sm md:text-base">Tudo que você precisa para escalar sua operação.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: <Zap className="text-yellow-400" size={28} />, title: "Rápido e Fácil", desc: "Configure sua agenda e comece a receber reservas em menos de 2 minutos." },
              { icon: <Shield className="text-green-400" size={28} />, title: "Dados Seguros", desc: "Criptografia de ponta a ponta e backups diários automáticos." },
              { icon: <Calendar className="text-indigo-400" size={28} />, title: "Agenda Inteligente", desc: "Lembretes automáticos via WhatsApp e E-mail reduzem faltas em 30%." }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors hover:bg-white/[0.07]">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 md:mb-6 ring-1 ring-white/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="py-20 md:py-32 px-4 relative" id="precos">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Planos que crescem com você</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
              Escolha o plano ideal para o tamanho do seu negócio. Sem contratos de fidelidade, cancele quando quiser.
            </p>

            {/* Toggle Mensal/Anual */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Mensal</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-14 h-8 bg-slate-800 rounded-full p-1 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className={`w-6 h-6 bg-indigo-500 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                Anual <span className="text-indigo-400 text-xs ml-1 font-bold">-20%</span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* STARTER */}
            <div className="flex flex-col p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-lg font-medium text-slate-300 mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">R$ 0</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <p className="text-slate-400 text-sm mt-4">Para quem está começando agora.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['1 Profissional', 'Agenda Básica', 'Link Personalizado', 'Lembretes por Email'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full">
                <button className="w-full py-3 px-4 rounded-xl border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors">
                  Começar Grátis
                </button>
              </Link>
            </div>

            {/* PROFESSIONAL */}
            <div className="flex flex-col p-8 rounded-3xl bg-[#1e1b4b]/40 border border-indigo-500/50 relative shadow-2xl shadow-indigo-900/20 transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                MAIS POPULAR
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-medium text-indigo-300 mb-2">Professional</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {billingCycle === 'monthly' ? 'R$ 49' : 'R$ 39'}
                  </span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <p className="text-slate-400 text-sm mt-4">Para salões em crescimento.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Até 5 Profissionais', 'Lembretes WhatsApp', 'Relatórios Financeiros', 'Controle de Estoque', 'Suporte Prioritário'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <div className="bg-indigo-500/20 p-0.5 rounded-full">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full">
                <button className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25">
                  Testar 7 dias grátis
                </button>
              </Link>
            </div>

            {/* ENTERPRISE */}
            <div className="flex flex-col p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-lg font-medium text-slate-300 mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {billingCycle === 'monthly' ? 'R$ 199' : 'R$ 159'}
                  </span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <p className="text-slate-400 text-sm mt-4">Para grandes redes e franquias.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Profissionais Ilimitados', 'API de Integração', 'Gerente de Conta', 'Whitelabel', 'Múltiplas Unidades'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full">
                <button className="w-full py-3 px-4 rounded-xl border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors">
                  Falar com Vendas
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* --- SOBRE (STATS) --- */}
      <section className="py-16 md:py-24 px-4 md:px-6" id="sobre">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-5xl font-bold mb-6">Focado em resultados</h2>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-12">
            Criado para simplificar sua vida.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 md:gap-8">
            <div className="p-4 rounded-2xl bg-white/5 sm:bg-transparent">
              <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">+10k</div>
              <div className="text-slate-400 text-sm md:text-base">Usuários ativos</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 sm:bg-transparent">
              <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">98%</div>
              <div className="text-slate-400 text-sm md:text-base">Satisfação</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 sm:bg-transparent">
              <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">24/7</div>
              <div className="text-slate-400 text-sm md:text-base">Suporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 md:py-12 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-[10px]">A</div>
            <span className="font-bold text-white">AppointPro Beauty</span>
          </div>
          <p className="text-xs md:text-sm">© 2026 AppointPro Beauty. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
