'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

interface Establishment {
  id: string;
  name: string;
  depositPercent?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  professionalId: string;
}

interface Professional {
  id: string;
  name: string;
}

interface AppointmentItem {
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  isFlexible?: boolean; // Se true, backend pode escolher qualquer profissional disponível
}

export default function AgendarPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [bookingMode, setBookingMode] = useState<'any' | 'specific' | null>(null);
  const [appointmentItems, setAppointmentItems] = useState<AppointmentItem[]>([]); // Lista de serviços adicionados
  const [currentService, setCurrentService] = useState<string>(''); // Serviço sendo adicionado
  const [currentProfessional, setCurrentProfessional] = useState<string>(''); // Profissional selecionado
  const [availableSlots, setAvailableSlots] = useState<Array<{date: string, time: string}>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientPassword: '',
    clientPasswordConfirm: '',
  });
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    initialPrimary: establishment?.primaryColor,
    initialSecondary: establishment?.secondaryColor,
    persistSlug: true,
    fetchIfMissing: !establishment?.primaryColor || !establishment?.secondaryColor,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const estResponse = await fetch(`http://localhost:3001/api/public/establishments/${slug}`);
        if (estResponse.ok) {
          const estData = await estResponse.json();
          setEstablishment(estData);
        } else {
          setError('Estabelecimento não encontrado');
        }

        const srvResponse = await fetch(`http://localhost:3001/api/public/establishments/${slug}/services`);
        if (srvResponse.ok) {
          const srvData = await srvResponse.json();
          setServices(srvData);
        }

        const proResponse = await fetch(`http://localhost:3001/api/public/establishments/${slug}/professionals`);
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

  // Verificar assinatura quando o email for alterado
  useEffect(() => {
    const checkEmailAndSubscription = async () => {
      if (formData.clientEmail && formData.clientEmail.includes('@')) {
        setCheckingEmail(true);
        
        try {
          // Verificar se o email já existe
          const emailCheckResponse = await fetch(`http://localhost:3001/api/public/auth/check-email/${formData.clientEmail}`);
          if (emailCheckResponse.ok) {
            const emailData = await emailCheckResponse.json();
            setIsExistingUser(emailData.exists);
            
            // Preencher nome se o usuário já existe
            if (emailData.exists && emailData.user) {
              setFormData(prev => ({
                ...prev,
                clientName: emailData.user.name || prev.clientName,
                clientPassword: '', // Limpar senha
                clientPasswordConfirm: ''
              }));
            }
          }
          
          // Verificar assinatura
          const response = await fetch(`http://localhost:3001/api/public/establishments/${slug}/subscription/${formData.clientEmail}`);
          if (response.ok) {
            const data = await response.json();
            setSubscription(data.hasSubscription ? data : null);
          }
        } catch (error) {
          console.error('Erro ao verificar email/assinatura:', error);
        } finally {
          setCheckingEmail(false);
        }
      } else {
        setIsExistingUser(false);
        setSubscription(null);
      }
    };

  const timeoutId = setTimeout(checkEmailAndSubscription, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.clientEmail, slug]);

  // Carregar slots quando serviço e profissional selecionados
  useEffect(() => {
    const loadSlots = async () => {
      if (!currentService) {
        setAvailableSlots([]);
        return;
      }

      // Resolver profissional: no modo 'any', usar o profissional padrão do serviço
      const serviceObj = services.find(s => s.id === currentService);
      const resolvedProfessionalId = bookingMode === 'any' 
        ? serviceObj?.professionalId 
        : currentProfessional;

      if (!resolvedProfessionalId) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const response = await fetch('http://localhost:3001/api/public/appointments/available-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            establishmentSlug: slug,
            date: new Date().toISOString().split('T')[0], // Data inicial para buscar próximos 14 dias
            services: [{ serviceId: currentService, professionalId: resolvedProfessionalId }]
          })
        });

        if (response.ok) {
          const slots = await response.json();
          // Transformar em array de objetos {date, time}
          // A API retorna apenas horários, vamos buscar também as datas
          const response2 = await fetch('http://localhost:3001/api/public/appointments/available-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              establishmentSlug: slug,
              services: [{ serviceId: currentService, professionalId: resolvedProfessionalId }],
              daysAhead: 14
            })
          });

          if (response2.ok) {
            const dates = await response2.json();
            // Para cada data, buscar os horários
            const allSlots: Array<{date: string, time: string}> = [];
            
            for (const date of dates) {
              const slotsResponse = await fetch('http://localhost:3001/api/public/appointments/available-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  establishmentSlug: slug,
                  date,
                  services: [{ serviceId: currentService, professionalId: resolvedProfessionalId }]
                })
              });

              if (slotsResponse.ok) {
                const timeSlots = await slotsResponse.json();
                const now = new Date();
                timeSlots.forEach((time: string) => {
                  const slotDateTime = new Date(`${date}T${time}:00`);
                  // Apenas horários futuros
                  if (slotDateTime.getTime() > now.getTime()) {
                    allSlots.push({ date, time });
                  }
                });
              }
            }
            
            setAvailableSlots(allSlots);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [currentService, currentProfessional, slug]);

  // Calcular total baseado nos itens adicionados
  const total = appointmentItems.reduce((sum, item) => {
    const service = services.find(s => s.id === item.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const handleAddService = (slot: {date: string, time: string}) => {
    // Adicionar o serviço à lista de itens
    const serviceObj = services.find(s => s.id === currentService);
    const resolvedProfessionalId = bookingMode === 'any' 
      ? serviceObj?.professionalId 
      : currentProfessional;

    setAppointmentItems(prev => [...prev, {
      serviceId: currentService,
      professionalId: resolvedProfessionalId || currentProfessional,
      date: slot.date,
      time: slot.time,
      isFlexible: bookingMode === 'any' // Marca se backend pode escolher outro profissional
    }]);

    // Limpar seleção atual e voltar para step 2 para adicionar mais
    setCurrentService('');
    setCurrentProfessional('');
    setAvailableSlots([]);
    setStep(2);
  };

  const handleRemoveService = (index: number) => {
    setAppointmentItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      // Validar senhas apenas para novos usuários
      if (!isExistingUser) {
        if (formData.clientPassword !== formData.clientPasswordConfirm) {
          alert('As senhas não coincidem!');
          return;
        }

        if (formData.clientPassword.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres!');
          return;
        }
      }

      console.log('📋 Itens de agendamento:', appointmentItems);
      console.log('🎯 Modo de reserva:', bookingMode);

      // Agrupar agendamentos por data+hora (podem ter múltiplos serviços no mesmo horário)
      const appointmentsBySlot = appointmentItems.reduce((acc, item) => {
        const key = `${item.date}-${item.time}`;
        if (!acc[key]) {
          acc[key] = {
            date: item.date,
            slot: item.time,
            services: [],
            isFlexible: item.isFlexible
          };
        }
        acc[key].services.push({
          serviceId: item.serviceId,
          professionalId: item.professionalId
        });
        return acc;
      }, {} as Record<string, { date: string, slot: string, services: Array<{serviceId: string, professionalId: string}>, isFlexible?: boolean }>);

      console.log('📦 Agendamentos agrupados:', appointmentsBySlot);

      // Criar um agendamento para cada slot (data+hora)
      const appointmentPromises = Object.values(appointmentsBySlot).map(async (slotData) => {
        // Verificar se a data+hora está no futuro
        const [year, month, day] = slotData.date.split('-').map(Number);
        const [hour, minute] = slotData.slot.split(':').map(Number);
        const appointmentDateTime = new Date(year, month - 1, day, hour, minute);
        const now = new Date();
        
        console.log('🕐 Verificando horário:');
        console.log('  - Data/Hora do agendamento:', appointmentDateTime.toISOString());
        console.log('  - Agora:', now.toISOString());
        console.log('  - Está no futuro?', appointmentDateTime > now);

        // Se for modo 'any', remover professionalId para backend escolher automaticamente
        const services = slotData.isFlexible 
          ? slotData.services.map(s => ({ serviceId: s.serviceId }))
          : slotData.services;

        const requestBody: any = {
          establishmentSlug: slug,
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          services: services,
          date: slotData.date,
          slot: slotData.slot,
        };
        
        // Incluir senha apenas se for novo usuário
        if (!isExistingUser && formData.clientPassword) {
          requestBody.password = formData.clientPassword;
        }

        console.log('📤 Enviando agendamento:', JSON.stringify(requestBody, null, 2));

        // Adicionar depositPercent se configurado
        if (establishment?.depositPercent && establishment.depositPercent > 0) {
          requestBody.depositPercent = establishment.depositPercent;
        }

        const response = await fetch('http://localhost:3001/api/public/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          let errorMessage = 'Erro ao criar agendamento';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || 'Erro ao criar agendamento';
          } catch (parseError) {
            const statusText = response.statusText || `HTTP ${response.status}`;
            errorMessage = `Erro ao criar agendamento (${statusText})`;
          }
          console.error('Erro na resposta:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return await response.json();
      });

      const appointments = await Promise.all(appointmentPromises);

      // Redirecionar para confirmação (usar o primeiro appointment)
      router.push(`/${slug}/confirmacao?id=${appointments[0].id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao realizar agendamento';
      console.error('Erro ao agendar:', errorMsg);
      alert(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${slug}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Agendar Horário</h1>
          <p className="text-slate-400">{establishment?.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'text-white' : 'bg-slate-700 text-slate-400'
                }`}
                style={step >= s ? { backgroundColor: primary } : undefined}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 6 && (
                <div
                  className="w-8 h-1"
                  style={{ backgroundColor: step > s ? primary : '#334155' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Alertas */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 mb-6">
            <h3 className="text-yellow-300 font-bold mb-2">⚠️ Sem Serviços Cadastrados</h3>
            <p className="text-yellow-200/80 text-sm">
              Este estabelecimento ainda não cadastrou serviços. Por favor, entre em contato diretamente
              ou aguarde até que os serviços estejam disponíveis.
            </p>
          </div>
        )}

        {!loading && professionals.length === 0 && services.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 mb-6">
            <h3 className="text-yellow-300 font-bold mb-2">⚠️ Sem Profissionais Cadastrados</h3>
            <p className="text-yellow-200/80 text-sm">
              Este estabelecimento ainda não cadastrou profissionais. Por favor, entre em contato diretamente.
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-6">
          {/* Step 1: Modo de Agendamento */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Como deseja agendar?</h2>
                <p className="text-slate-400">Escolha a melhor opção para você</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Opção: Qualquer profissional disponível */}
                <button
                  onClick={() => setBookingMode('any')}
                  className={`p-8 rounded-2xl border-2 transition-all text-left ${
                    bookingMode === 'any'
                      ? 'hover:shadow-lg'
                      : 'hover:border-slate-600'
                  }`}
                  style={
                    bookingMode === 'any'
                      ? {
                          borderColor: primary,
                          backgroundColor: hexToRgba(primary, 0.08),
                          boxShadow: `0 10px 25px ${hexToRgba(primary, 0.12)}`,
                        }
                      : { borderColor: '#334155' }
                  }
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: bookingMode === 'any' ? primary : '#334155',
                        transition: 'all 0.3s'
                      }}
                    >
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        Primeiro horário disponível
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">
                        Agende com qualquer profissional que esteja livre no horário escolhido
                      </p>
                      <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Mais opções de horário
                      </div>
                    </div>
                  </div>
                </button>

                {/* Opção: Profissional específico */}
                <button
                  onClick={() => setBookingMode('specific')}
                  className={`p-8 rounded-2xl border-2 transition-all text-left ${
                    bookingMode === 'specific'
                      ? 'hover:shadow-lg'
                      : 'hover:border-slate-600'
                  }`}
                  style={
                    bookingMode === 'specific'
                      ? {
                          borderColor: primary,
                          backgroundColor: hexToRgba(primary, 0.08),
                          boxShadow: `0 10px 25px ${hexToRgba(primary, 0.12)}`,
                        }
                      : { borderColor: '#334155' }
                  }
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: bookingMode === 'specific' ? primary : '#334155',
                        transition: 'all 0.3s'
                      }}
                    >
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        Escolher profissional
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">
                        Selecione um profissional específico para cada serviço
                      </p>
                      <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        Você escolhe quem atende
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Escolher Serviço (um de cada vez) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Escolha um Serviço</h2>
                {appointmentItems.length > 0 && (
                  <p className="text-slate-400 text-sm">
                    Você já adicionou {appointmentItems.length} serviço(s). Adicione mais ou finalize.
                  </p>
                )}
              </div>

              {services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">Nenhum serviço disponível no momento.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => {
                    const professional = professionals.find(p => p.id === service.professionalId);
                    const isSelected = currentService === service.id;
                    return (
                      <button
                        key={service.id}
                        onClick={() => {
                          setCurrentService(service.id);
                          if (bookingMode === 'any') {
                            // Auto-selecionar profissional e avançar
                            setCurrentProfessional(service.professionalId);
                            setStep(4); // Pular para slots
                          } else {
                            setStep(3); // Ir para seleção de profissional
                          }
                        }}
                        className={`text-left p-6 rounded-xl border-2 transition-all hover:border-slate-600`}
                        style={{ borderColor: '#334155' }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                            {bookingMode === 'specific' && professional && (
                              <p className="text-sm text-slate-400 mt-1">
                                com {professional.name}
                              </p>
                            )}
                            {bookingMode === 'any' && (
                              <p className="text-sm text-slate-400 mt-1">
                                com profissional disponível
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {service.durationMinutes}min
                              </span>
                            </div>
                          </div>
                          <span className="text-2xl font-bold ml-4" style={{ color: primary }}>
                            R$ {service.price.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mostrar serviços já adicionados */}
              {appointmentItems.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-lg font-semibold text-white">Serviços Adicionados:</h3>
                  {appointmentItems.map((item, index) => {
                    const service = services.find(s => s.id === item.serviceId);
                    const prof = professionals.find(p => p.id === item.professionalId);
                    return (
                      <div key={index} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-semibold">{service?.name}</p>
                          <p className="text-sm text-slate-400">
                            {bookingMode === 'any' ? 'Profissional disponível' : prof?.name} • {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {item.time}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveService(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Escolher Profissional (apenas se bookingMode === 'specific') */}
          {step === 3 && bookingMode === 'specific' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Escolha o Profissional</h2>
              
              {currentService && (() => {
                const service = services.find(s => s.id === currentService);
                // Encontrar todos os profissionais que oferecem este serviço
                const availableProfsForService = professionals.filter(p => 
                  services.some(s => s.id === currentService && s.professionalId === p.id)
                );
                
                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: hexToRgba(primary, 0.08), border: `1px solid ${hexToRgba(primary, 0.3)}` }}>
                      <p className="text-sm font-medium text-slate-300">
                        {service?.name} - R$ {service?.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="grid gap-3">
                      {availableProfsForService.map(prof => (
                        <button
                          key={prof.id}
                          onClick={() => {
                            setCurrentProfessional(prof.id);
                            setStep(4); // Avançar para slots
                          }}
                          className="text-left p-4 rounded-xl border-2 transition-all hover:border-slate-600"
                          style={{ borderColor: '#334155' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                            >
                              {prof.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{prof.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 4: Escolher Slot (Data + Horário juntos) */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Escolha Data e Horário</h2>
              
              {loadingSlots ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 mt-4">Carregando horários disponíveis...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">Nenhum horário disponível nos próximos 14 dias.</p>
                  <p className="text-sm text-slate-500">
                    Tente escolher outro serviço ou profissional.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Agrupar slots por data */}
                  {Object.entries(
                    availableSlots.reduce((acc, slot) => {
                      if (!acc[slot.date]) acc[slot.date] = [];
                      acc[slot.date].push(slot.time);
                      return acc;
                    }, {} as Record<string, string[]>)
                  ).map(([date, times]) => {
                    const dateObj = new Date(date + 'T00:00:00');
                    const dayOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dateObj.getDay()];
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
                    
                    return (
                      <div key={date} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-[1px] bg-slate-700 flex-1" />
                          <h3 className="text-white font-semibold">
                            {dayOfWeek}, {formattedDate}
                          </h3>
                          <div className="h-[1px] bg-slate-700 flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {times.map(time => (
                            <button
                              key={`${date}-${time}`}
                              onClick={() => handleAddService({ date, time })}
                              className="p-3 rounded-xl border-2 transition-all hover:border-slate-600 hover:shadow-lg"
                              style={{ borderColor: '#334155' }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-300">{time}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Dados do Cliente */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Seus Dados</h2>
              
                {checkingEmail && (
                  <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 mb-4">
                    <p className="text-slate-300 text-sm">
                      🔍 Verificando email...
                    </p>
                  </div>
                )}
              
                {!checkingEmail && isExistingUser && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p className="text-blue-200 text-sm">
                      ✓ <strong>Bem-vindo de volta!</strong> Seus dados já estão cadastrados. Não é necessário informar senha novamente.
                    </p>
                  </div>
                )}
              
                {!checkingEmail && !isExistingUser && formData.clientEmail.includes('@') && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                    <p className="text-green-200 text-sm">
                      🎉 <strong>Novo por aqui?</strong> Crie uma senha para acessar sua área do cliente depois.
                    </p>
                  </div>
                )}
              
                {!checkingEmail && subscription && subscription.creditsRemaining > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <p className="text-green-200 text-sm">
                    ✓ <strong>Assinatura Ativa!</strong> Você tem {subscription.creditsRemaining} créditos disponíveis.
                    Este agendamento não terá custos adicionais.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  placeholder="Digite seu nome"
                                  disabled={isExistingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Mostrar campos de senha apenas para novos usuários */}
              {!isExistingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                    <input
                      type="password"
                      value={formData.clientPassword}
                      onChange={(e) => setFormData({ ...formData, clientPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      Esta senha será usada para acessar seu painel de cliente
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Senha</label>
                    <input
                      type="password"
                      value={formData.clientPasswordConfirm}
                      onChange={(e) => setFormData({ ...formData, clientPasswordConfirm: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Digite a senha novamente"
                      minLength={6}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 6: Confirmação */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Confirmar Agendamento</h2>
              
              <div className="space-y-4 p-6 bg-slate-900/50 rounded-xl">
                <div>
                  <span className="text-slate-400 block mb-2">Serviços Agendados:</span>
                  <div className="space-y-3">
                    {appointmentItems.map((item, index) => {
                      const service = services.find(s => s.id === item.serviceId);
                      const prof = professionals.find(p => p.id === item.professionalId);
                      return (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white">• {service?.name}</span>
                            <span style={{ color: primary }}>R$ {service?.price.toFixed(2)}</span>
                          </div>
                          <div className="ml-4 text-sm text-slate-400 mt-1">
                            {bookingMode === 'any' ? 'Profissional disponível no horário' : `com ${prof?.name}`}
                          </div>
                          <div className="ml-4 text-sm text-slate-400">
                            {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {item.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-between">
                  <span className="text-slate-300 font-semibold">Valor Total:</span>
                  <span className="text-2xl font-bold" style={{ color: primary }}>
                    R$ {total.toFixed(2)}
                  </span>
                </div>
                
                {/* Assinatura Ativa */}
                {subscription && subscription.creditsRemaining > 0 && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-400 text-lg">✓</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-green-200 font-semibold mb-1">
                          🎉 Assinatura Ativa
                        </p>
                        <p className="text-green-200/80 text-sm">
                          Agendamento será debitado da sua assinatura!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Depósito Antecipado */}
                {(!subscription || subscription.creditsRemaining === 0) && establishment?.depositPercent && establishment.depositPercent > 0 && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-lg">💰</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-amber-200 font-semibold mb-1">
                          Pagamento Antecipado Requerido
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-amber-300 text-sm">Valor do sinal ({establishment.depositPercent}%):</span>
                          <span className="text-amber-300 font-bold text-lg">
                            R$ {(total * (establishment.depositPercent / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step > 1 && step !== 3 && step !== 4 && ( // Não mostrar voltar nos steps de adicionar serviço
            <button
              onClick={() => {
                if (step === 2 && appointmentItems.length > 0) {
                  // Se está no step 2 e tem serviços, voltar para step 1
                  setStep(1);
                } else if (step === 5) {
                  // Voltar do dados cliente para adicionar mais serviços
                  setStep(2);
                } else if (step === 6) {
                  // Voltar da confirmação para dados cliente
                  setStep(5);
                } else {
                  setStep(step - 1);
                }
              }}
              className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold"
            >
              Voltar
            </button>
          )}

          {/* Botões especiais para Step 2 */}
          {step === 2 && appointmentItems.length > 0 && (
            <button
              onClick={() => setStep(5)} // Finalizar e ir para dados do cliente
              className="flex-1 px-6 py-3 text-white rounded-xl transition-all font-semibold hover:brightness-110 flex items-center justify-center gap-2"
              style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
            >
              Finalizar Serviços
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Botão Próximo para Steps 1 e 5 */}
          {(step === 1 || step === 5) && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !bookingMode) || 
                (step === 5 && (
                  !formData.clientName || 
                  !formData.clientEmail || 
                  !formData.clientPhone || 
                  (!isExistingUser && (!formData.clientPassword || !formData.clientPasswordConfirm))
                ))
              }
              className="flex-1 px-6 py-3 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
              style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
            >
              Próximo
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Botão Confirmar Agendamento no Step 6 */}
          {step === 6 && (
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Confirmar Agendamento
            </button>
          )}

          {/* Botões de voltar nos steps 3 e 4 */}
          {(step === 3 || step === 4) && (
            <button
              onClick={() => {
                if (step === 3) {
                  // Voltar para escolha de serviço
                  setCurrentService('');
                  setCurrentProfessional('');
                  setStep(2);
                } else if (step === 4) {
                  // Voltar para escolha de profissional ou serviço
                  if (bookingMode === 'specific') {
                    setCurrentProfessional('');
                    setStep(3);
                  } else {
                    setCurrentService('');
                    setCurrentProfessional('');
                    setStep(2);
                  }
                }
              }}
              className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
