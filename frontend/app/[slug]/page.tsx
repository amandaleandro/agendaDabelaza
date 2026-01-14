'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Phone, Star, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';
import { API_BASE_URL } from '@/config/api';

interface Establishment {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  phone?: string;
  bannerUrl?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
}

interface Professional {
  id: string;
  name: string;
  phone?: string;
}

export default function LandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar estabelecimento
        const estResponse = await fetch(`${API_BASE_URL}/public/establishments/${slug}`);
        if (!estResponse.ok) {
          setError('Estabelecimento não encontrado');
          return;
        }
        const estData = await estResponse.json();

        // Merge com config salva em localStorage (preview offline da landing)
        let mergedEst = estData;
        try {
          const saved = localStorage.getItem(`landing_config_${slug}`);
          if (saved) {
            const cfg = JSON.parse(saved);
            mergedEst = {
              ...estData,
              name: cfg?.branding?.businessName || estData.name,
              bio: cfg?.branding?.description || estData.bio,
              primaryColor: cfg?.colors?.primary || estData.primaryColor,
              secondaryColor: cfg?.colors?.secondary || estData.secondaryColor,
            };
          }
        } catch (err) {
          console.warn('Falha ao aplicar config local da landing:', err);
        }

        setEstablishment(mergedEst);

        // Carregar serviços
        const srvResponse = await fetch(`${API_BASE_URL}/public/establishments/${slug}/services`);
        if (srvResponse.ok) {
          const srvData = await srvResponse.json();
          setServices(srvData);
        }

        // Carregar profissionais
        const proResponse = await fetch(`${API_BASE_URL}/public/establishments/${slug}/professionals`);
        if (proResponse.ok) {
          const proData = await proResponse.json();
          setProfessionals(proData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar dados do estabelecimento');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    initialPrimary: establishment?.primaryColor,
    initialSecondary: establishment?.secondaryColor,
    persistSlug: true,
    fetchIfMissing: !establishment?.primaryColor || !establishment?.secondaryColor,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: primary }} />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Estabelecimento não encontrado</h1>
          <p className="text-slate-400">{error || 'Verifique a URL e tente novamente'}</p>
        </div>
      </div>
    );
  }

  const est = establishment!;

  return (
    <div className="min-h-screen">
      {/* Hero - Full Screen */}
      <section 
        className="relative min-h-screen flex items-center justify-center text-white overflow-hidden"
        style={{
          backgroundImage: est.bannerUrl
            ? `url(${est.bannerUrl})`
            : `linear-gradient(135deg, ${primary}, ${secondary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {est.bannerUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${hexToRgba(primary, 0.75)}, ${hexToRgba(secondary, 0.75)})`,
            }}
          />
        )}
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s', backgroundColor: hexToRgba(secondary, 0.1) }}
          />
        </div>

        <div className="relative z-10 w-full px-6 sm:px-12 py-20 text-center">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-3 backdrop-blur-lg px-8 py-4 rounded-full shadow-xl animate-fade-in"
              style={{ backgroundColor: hexToRgba(primary, 0.12), border: `1px solid ${hexToRgba(primary, 0.4)}` }}
            >
              <Sparkles className="w-6 h-6" style={{ color: primary }} />
              <span className="text-lg font-semibold">Bem-vindo</span>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {est.name}
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl opacity-95 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {est.bio || 'O melhor lugar para cuidar de você'}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Link href={`/${slug}/agendar`} className="w-full sm:w-auto">
                <button className="group relative w-full sm:w-auto bg-white hover:bg-slate-50 font-bold px-12 py-6 text-xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-4 justify-center overflow-hidden" style={{ color: primary }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, ${hexToRgba(primary, 0.12)}, ${hexToRgba(secondary, 0.12)})` }} />
                  <Calendar className="w-7 h-7 relative z-10" />
                  <span className="relative z-10">Agendar Agora</span>
                </button>
              </Link>
              <Link href={`/${slug}/planos`} className="w-full sm:w-auto">
                <button
                  className="group relative w-full sm:w-auto text-white font-bold px-12 py-6 text-xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-4 justify-center overflow-hidden hover:brightness-110"
                  style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                >
                  <Sparkles className="w-7 h-7 relative z-10" />
                  <span className="relative z-10">Ver Planos</span>
                </button>
              </Link>
              {est.phone && (
                <a href={`tel:${est.phone}`} className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white font-semibold px-12 py-6 text-xl rounded-2xl border-2 border-white/40 shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-4 justify-center">
                    <Phone className="w-7 h-7" />
                    <span>{est.phone}</span>
                  </button>
                </a>
              )}
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronRight className="w-8 h-8 rotate-90 opacity-70" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Full Width */}
      <section className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: hexToRgba(primary, 0.2) }}>
              <Sparkles className="w-10 h-10" style={{ color: primary }} />
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              Nossos Serviços
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto">
              Escolha o serviço perfeito para você
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {services.length > 0 ? (
              services.map((service, index) => (
                <div 
                  key={service.id} 
                  className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    borderColor: hexToRgba(primary, 0.35),
                    boxShadow: `0 10px 25px ${hexToRgba(primary, 0.12)}`,
                  }}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl transition-all duration-500" style={{ background: `linear-gradient(135deg, ${hexToRgba(primary, 0.02)}, ${hexToRgba(secondary, 0.02)})` }} />
                  
                  <div className="relative space-y-6">
                    <h3 className="font-bold text-2xl lg:text-3xl text-white transition-colors" style={{ textShadow: `0 0 20px ${hexToRgba(primary, 0.15)}` }}>
                      {service.name}
                    </h3>
                    <p className="text-slate-400 text-base lg:text-lg leading-relaxed min-h-[90px]">
                      {service.description || 'Serviço de alta qualidade para o seu bem-estar'}
                    </p>
                    <div className="flex justify-between items-center pt-6 border-t border-slate-700/50">
                      <span className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text"
                        style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}>
                        R$ {service.price?.toFixed(2)}
                      </span>
                      <span className="text-base px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 border"
                        style={{ backgroundColor: hexToRgba(primary, 0.15), color: primary, borderColor: hexToRgba(primary, 0.3) }}>
                        <Clock className="w-5 h-5" />
                        {service.durationMinutes}min
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-800/30 border border-slate-700 rounded-3xl backdrop-blur-sm">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-6" />
                <p className="text-slate-400 text-xl">Nenhum serviço disponível no momento</p>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Team Section - Full Width */}
      <section className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: hexToRgba(primary, 0.2) }}>
              <Star className="w-10 h-10" style={{ color: primary }} />
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              Nossa Equipe
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto">
              Profissionais qualificados e experientes
            </p>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {professionals.length > 0 ? (
              professionals.map((pro, index) => (
                <div 
                  key={pro.id} 
                  className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border rounded-3xl p-10 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    borderColor: hexToRgba(primary, 0.35),
                    boxShadow: `0 10px 25px ${hexToRgba(primary, 0.12)}`,
                  }}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl transition-all duration-500" style={{ background: `linear-gradient(135deg, ${hexToRgba(primary, 0.02)}, ${hexToRgba(secondary, 0.02)})` }} />
                  
                  <div className="relative text-center space-y-6">
                    {/* Avatar (Iniciais apenas, como no original) */}
                    <div className="relative inline-block">
                      <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl transform group-hover:scale-110 transition-transform duration-500"
                        style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 20px 50px ${hexToRgba(primary, 0.3)}` }}>
                        {pro.name.charAt(0)}
                      </div>
                      <div className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${hexToRgba(primary, 0.5)}, ${hexToRgba(secondary, 0.5)})` }} />
                    </div>
                    
                    {/* Info */}
                    <div>
                      <h3 className="font-bold text-2xl lg:text-3xl text-white transition-colors" style={{ textShadow: `0 0 20px ${hexToRgba(primary, 0.15)}` }}>
                        {pro.name}
                      </h3>
                      <p className="text-slate-400 text-base lg:text-lg mt-3">Especialista</p>
                    </div>
                    
                    {/* Contact */}
                    {pro.phone && (
                      <div className="pt-6 border-t border-slate-700/50">
                        <p className="text-slate-300 text-base lg:text-lg flex items-center justify-center gap-3 transition-colors">
                          <Phone className="w-5 h-5" />
                          {pro.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-800/30 border border-slate-700 rounded-3xl backdrop-blur-sm">
                <Star className="w-16 h-16 text-slate-600 mx-auto mb-6" />
                <p className="text-slate-400 text-xl">Nenhum profissional disponível</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Por que escolher a gente?
            </h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Oferecemos o melhor atendimento com qualidade e praticidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform hover:scale-110 transition-transform" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Agendamento Fácil</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Agende online em minutos, sem complicação. Escolha o melhor horário para você.
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform hover:scale-110 transition-transform" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Profissionais Qualificados</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Equipe experiente e atualizada com as últimas tendências do mercado.
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform hover:scale-110 transition-transform" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Localização Ideal</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {est.address || 'Localização privilegiada e fácil acesso para você.'}
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform hover:scale-110 transition-transform" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Ambiente Acolhedor</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Espaço confortável e moderno para você relaxar e se cuidar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="w-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Como funciona?
            </h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Agendar seu horário é simples e rápido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="relative">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-3xl font-black shadow-2xl" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                    1
                  </div>
                  {/* Linha conectora - desktop only */}
                  <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5" style={{ backgroundImage: `linear-gradient(to right, ${hexToRgba(primary, 0.4)}, transparent)` }}></div>
                </div>
                <h3 className="text-2xl font-bold text-white">Escolha o Serviço</h3>
                <p className="text-slate-400 leading-relaxed">
                  Navegue pelos nossos serviços e escolha o que você precisa
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-3xl font-black shadow-2xl" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                    2
                  </div>
                  <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5" style={{ backgroundImage: `linear-gradient(to right, ${hexToRgba(secondary, 0.4)}, transparent)` }}></div>
                </div>
                <h3 className="text-2xl font-bold text-white">Selecione Data e Hora</h3>
                <p className="text-slate-400 leading-relaxed">
                  Escolha o dia e horário que melhor se encaixa na sua agenda
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-3xl font-black shadow-2xl" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  3
                </div>
                <h3 className="text-2xl font-bold text-white">Confirme seu Agendamento</h3>
                <p className="text-slate-400 leading-relaxed">
                  Pronto! Você receberá uma confirmação e estará tudo certo
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href={`/${slug}/agendar`}>
              <button className="text-white font-bold px-10 py-4 text-lg rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 hover:brightness-110" style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}>
                Começar Agora
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              O que nossos clientes dizem
            </h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Experiências reais de quem já foi atendido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border rounded-2xl p-8 space-y-6 transition-all duration-300" style={{ borderColor: hexToRgba(primary, 0.35) }}>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "Atendimento impecável! Ambiente super agradável e profissionais muito atenciosos. Recomendo demais!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  A
                </div>
                <div>
                  <p className="text-white font-semibold">Ana Silva</p>
                  <p className="text-slate-400 text-sm">Cliente há 2 anos</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border rounded-2xl p-8 space-y-6 transition-all duration-300" style={{ borderColor: hexToRgba(primary, 0.35) }}>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "O sistema de agendamento online é muito prático. Nunca mais perdi tempo esperando na fila!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  C
                </div>
                <div>
                  <p className="text-white font-semibold">Carlos Mendes</p>
                  <p className="text-slate-400 text-sm">Cliente há 1 ano</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border rounded-2xl p-8 space-y-6 transition-all duration-300" style={{ borderColor: hexToRgba(primary, 0.35) }}>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "Qualidade excepcional! Saio sempre satisfeita e já virei cliente fiel. Vale muito a pena!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  M
                </div>
                <div>
                  <p className="text-white font-semibold">Mariana Costa</p>
                  <p className="text-slate-400 text-sm">Cliente há 6 meses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato Section */}
      <section className="w-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Entre em Contato
            </h2>
            <p className="text-lg md:text-xl text-slate-400">
              Estamos aqui para atender você
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Telefone</h3>
                {est.phone ? (
                  <a
                    href={`tel:${est.phone}`}
                    className="text-slate-300 transition-colors text-lg"
                    onMouseEnter={(e) => (e.currentTarget.style.color = primary)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                  >
                    {est.phone}
                  </a>
                ) : (
                  <p className="text-slate-400">Entre em contato para mais informações</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Endereço</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  {est.address || 'Venha nos visitar e conhecer nosso espaço'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Horário de Funcionamento</h3>
                <p className="text-slate-300 leading-relaxed">
                  Segunda a Sexta: 9h às 19h<br />
                  Sábado: 9h às 17h<br />
                  Domingo: Fechado
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-6">
              <Sparkles className="w-16 h-16" style={{ color: primary }} />
              <h3 className="text-2xl font-bold text-white">Agende Já!</h3>
              <p className="text-slate-300 leading-relaxed">
                Não perca tempo! Reserve seu horário agora mesmo de forma rápida e prática.
              </p>
              <Link href={`/${slug}/agendar`} className="w-full">
                <button className="w-full text-white font-bold px-8 py-4 text-lg rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 hover:brightness-110" style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}>
                  <Calendar className="w-6 h-6" />
                  Fazer Agendamento
                </button>
              </Link>
            </div>

            <div
              className="backdrop-blur-xl rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-6 border"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(primary, 0.4)}, ${hexToRgba(secondary, 0.4)})`,
                borderColor: hexToRgba(primary, 0.5),
              }}
            >
              <Sparkles className="w-16 h-16" style={{ color: primary }} />
              <h3 className="text-2xl font-bold text-white">Planos Especiais</h3>
              <p className="text-slate-300 leading-relaxed">
                Escolha o melhor plano de serviços para aproveitar mais benefícios.
              </p>
              <Link href={`/${slug}/planos`} className="w-full">
                <button
                  className="w-full text-white font-bold px-8 py-4 text-lg rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 hover:brightness-110"
                  style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                >
                  <Sparkles className="w-6 h-6" />
                  Ver Planos
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Profissionais Section */}
      {professionals.length > 0 && (
        <section className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                Nossa Equipe
              </h2>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                Profissionais qualificados e experientes para cuidar de você
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {professionals.map((pro) => (
                <div
                  key={pro.id}
                  className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border rounded-2xl p-8 space-y-6 transition-all duration-300 hover:scale-105"
                  style={{ borderColor: hexToRgba(primary, 0.35) }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl"
                      style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                    >
                      {pro.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{pro.name}</h3>
                      {pro.phone && (
                        <p className="text-slate-400 mt-2">{pro.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Full Width */}
      <section
        className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${hexToRgba(primary, 0.85)}, ${hexToRgba(secondary, 0.85)})`,
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div
            className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl animate-pulse"
            style={{ backgroundColor: hexToRgba(primary, 0.12) }}
          />
          <div
            className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s', backgroundColor: hexToRgba(secondary, 0.12) }}
          />
        </div>

        <div className="relative z-10 w-full px-6 py-32 text-center">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full mb-8 animate-bounce">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              Pronto para sua transformação?
            </h2>
            
            <p className="text-2xl md:text-3xl text-white/95 max-w-3xl mx-auto leading-relaxed">
              Reserve seu horário agora e aproveite nossos serviços premium
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Link href={`/${slug}/agendar`} className="inline-block">
                <button className="group relative bg-white hover:bg-slate-50 font-black px-16 py-8 text-2xl md:text-3xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-5 overflow-hidden" style={{ color: primary }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, ${hexToRgba(primary, 0.12)}, ${hexToRgba(secondary, 0.12)})` }} />
                  <Calendar className="w-10 h-10 relative z-10" />
                  <span className="relative z-10">Agendar Agora</span>
                </button>
              </Link>

              <Link href={`/${slug}/planos`} className="inline-block">
                <button
                  className="group relative text-white font-black px-16 py-8 text-2xl md:text-3xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-5 overflow-hidden hover:brightness-110"
                  style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                >
                  <Sparkles className="w-10 h-10 relative z-10" />
                  <span className="relative z-10">Ver Planos</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}