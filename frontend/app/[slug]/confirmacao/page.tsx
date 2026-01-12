'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Check, Calendar, User, DollarSign, QrCode, ExternalLink, Mail } from 'lucide-react';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';

interface AppointmentDetails {
  id: string;
  date: string;
  slot: string;
  price: number;
  status: string;
  service: { name: string; durationMinutes: number };
  professional: { name: string };
  // Backend returns `user`; keep optional `client` for compatibility when present.
  user?: { name: string; email: string; phone: string };
  client?: { name: string; email: string; phone: string };
}

interface PaymentLink {
  paymentUrl: string;
  pixQrCode: string;
  pixQrCodeBase64: string;
  platformFee: number;
  establishmentAmount: number;
}

export default function ConfirmacaoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const appointmentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState('');

  const { primary, secondary, hexToRgba } = useEstablishmentTheme({
    slug,
    persistSlug: true,
    fetchIfMissing: true,
  });

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails();
    }
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}`);
      if (response.ok) {
        const data = await response.json();
        // Normalize to always have `user` populated
        const normalized: AppointmentDetails = {
          ...data,
          user: data.user || data.client,
          client: data.client,
        };
        setAppointment(normalized);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!appointment) return;
    
    setLoadingPayment(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerEmail: appointment.user?.email || appointment.client?.email || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro do servidor:', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPaymentLink(data);
    } catch (error: any) {
      console.error('Erro ao gerar link:', error);
      setError(error.message || 'Erro ao gerar link de pagamento');
    } finally {
      setLoadingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: primary }}
        />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-red-400 text-xl">Agendamento não encontrado</p>
          <button
            onClick={() => router.push(`/${slug}`)}
            className="mt-4 px-6 py-3 text-white rounded-xl hover:brightness-110"
            style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Agendamento Confirmado!</h1>
          <p className="text-xl text-slate-300">Seu horário foi reservado com sucesso</p>
        </div>

        {/* Appointment Details */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Detalhes do Agendamento</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primary }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Data e Horário</p>
                <p className="text-lg font-semibold text-white capitalize">
                  {formattedDate}
                </p>
                <p className="text-sm" style={{ color: primary }}>{appointment.slot}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: secondary }}
              >
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Profissional</p>
                <p className="text-lg font-semibold text-white">{appointment.professional.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: hexToRgba(primary, 0.4) }}
              >
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Serviço</p>
                <p className="text-lg font-semibold text-white">{appointment.service.name}</p>
                <p className="text-sm" style={{ color: primary }}>R$ {appointment.price.toFixed(2)} • {appointment.service.durationMinutes}min</p>
              </div>
            </div>
          </div>

          <div
            className="mt-6 p-4 rounded-xl"
            style={{ backgroundColor: hexToRgba(primary, 0.08), border: `1px solid ${hexToRgba(primary, 0.25)}` }}
          >
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: primary }}>
              <Mail className="w-4 h-4" />
              <strong>Confirmação enviada para:</strong>
            </div>
            <p className="text-white ml-6">{appointment?.user?.email || appointment?.client?.email || 'Email não informado'}</p>
          </div>
        </div>

        {/* Payment Section */}
        <div
          className="backdrop-blur-sm rounded-2xl p-8 mb-6"
          style={{
            backgroundImage: `linear-gradient(135deg, ${hexToRgba(primary, 0.12)}, ${hexToRgba(secondary, 0.12)})`,
            border: `1px solid ${hexToRgba(primary, 0.3)}`,
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">💳 Pagamento Online</h2>
          <p className="text-slate-300 mb-6">
            Finalize seu agendamento realizando o pagamento online via PIX
          </p>

          {!paymentLink && (
            <button
              onClick={handleGeneratePaymentLink}
              disabled={loadingPayment}
              className="w-full px-6 py-4 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
              style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
            >
              {loadingPayment ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando Link...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Gerar Link de Pagamento PIX
                </>
              )}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {paymentLink && (
            <div className="space-y-4">
              {/* QR Code */}
              {paymentLink.pixQrCodeBase64 && (
                <div className="bg-white p-4 rounded-xl flex justify-center">
                  <img 
                    src={`data:image/png;base64,${paymentLink.pixQrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              )}

              {/* PIX Copy */}
              {paymentLink.pixQrCode && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={paymentLink.pixQrCode}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-900/50 border rounded-xl text-white text-sm"
                      style={{ borderColor: hexToRgba(primary, 0.35) }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentLink.pixQrCode);
                        alert('Código PIX copiado!');
                      }}
                      className="px-6 py-3 text-white rounded-xl transition-all font-semibold hover:brightness-110"
                      style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Link */}
              {paymentLink.paymentUrl && (
                <a
                  href={paymentLink.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-white rounded-xl transition-all font-semibold hover:brightness-110"
                  style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                >
                  <ExternalLink className="w-5 h-5" />
                  Abrir Página de Pagamento
                </a>
              )}

              {/* Split Info */}
              <div className="p-4 bg-slate-900/50 rounded-xl text-sm text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Valor do Serviço:</span>
                  <span className="text-white font-semibold">R$ {appointment.price.toFixed(2)}</span>
                </div>
                {paymentLink.platformFee > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taxa da Plataforma:</span>
                    <span>R$ {paymentLink.platformFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => router.push(`/${slug}`)}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold"
          >
            Voltar ao Início
          </button>
          <button
            onClick={() => router.push(`/${slug}/admincliente`)}
            className="px-6 py-3 text-white rounded-xl transition-all font-semibold hover:brightness-110 flex items-center justify-center gap-2"
            style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
          >
            <Calendar className="w-5 h-5" />
            Meus Agendamentos
          </button>
          <button
            onClick={() => router.push(`/${slug}/agendar`)}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold"
          >
            Fazer Outro Agendamento
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
          <h3 className="font-semibold text-white mb-3">💡 Dicas Importantes:</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• Chegue com 10 minutos de antecedência</li>
            <li>• Traga um documento com foto</li>
            <li>• Em caso de cancelamento, avise com 24h de antecedência</li>
            <li>• Guarde o número de confirmação: <strong style={{ color: primary }}>#{appointmentId?.slice(0, 8)}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
