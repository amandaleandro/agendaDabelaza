# Integração Frontend - Mercado Pago

## 📱 Como Integrar no Frontend

### 1. Instalar SDK (Opcional)

Se quiser usar o SDK do Mercado Pago no frontend para processar cartões:

```bash
npm install @mercadopago/sdk-react
# ou
yarn add @mercadopago/sdk-react
```

### 2. Criar Pagamento PIX

Quando o cliente fizer um agendamento que requer pagamento:

```typescript
// app/[slug]/agendar/page.tsx

const handleCreatePayment = async () => {
  try {
    // 1. Criar o agendamento
    const appointmentResponse = await fetch(`${API_URL}/public/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        establishmentId,
        serviceId,
        professionalId,
        clientName,
        clientEmail,
        clientPhone,
        scheduledFor: selectedDateTime,
      }),
    });

    const appointment = await appointmentResponse.json();

    // 2. Criar o pagamento PIX
    const paymentResponse = await fetch(`${API_URL}/payments/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appointment.id,
        amount: depositAmount, // 30% do valor do serviço
        paymentMethod: 'pix',
        clientEmail,
      }),
    });

    const payment = await paymentResponse.json();

    // 3. Mostrar QR Code PIX para o cliente
    if (payment.qrCode) {
      setQrCodePix(payment.qrCode);
      setQrCodeBase64(payment.qrCodeBase64);
      setPaymentUrl(payment.paymentUrl);
      setShowPaymentModal(true);
    }
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
  }
};
```

### 3. Exibir QR Code PIX

```typescript
// Componente de Modal de Pagamento
const PaymentModal = ({ qrCode, qrCodeBase64, paymentUrl }) => {
  const copyPixCode = () => {
    navigator.clipboard.writeText(qrCode);
    alert('Código PIX copiado!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Pagamento PIX</h2>
        
        {/* QR Code */}
        <div className="flex justify-center mb-4">
          {qrCodeBase64 && (
            <img 
              src={`data:image/png;base64,${qrCodeBase64}`} 
              alt="QR Code PIX"
              className="w-64 h-64"
            />
          )}
        </div>

        {/* Código PIX para copiar */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600 mb-2">Código PIX:</p>
          <p className="text-xs break-all font-mono">{qrCode}</p>
        </div>

        <button
          onClick={copyPixCode}
          className="w-full bg-green-500 text-white py-3 rounded-lg mb-2"
        >
          📋 Copiar Código PIX
        </button>

        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-500 text-white py-3 rounded-lg text-center"
          >
            🔗 Abrir Link de Pagamento
          </a>
        )}

        <p className="text-sm text-gray-500 mt-4 text-center">
          O pagamento será confirmado automaticamente após a aprovação
        </p>
      </div>
    </div>
  );
};
```

### 4. Verificar Status do Pagamento

```typescript
// Polling para verificar se o pagamento foi aprovado
const checkPaymentStatus = async (paymentId: string) => {
  try {
    const response = await fetch(`${API_URL}/payments/${paymentId}/status`);
    const data = await response.json();
    
    if (data.status === 'PAID') {
      // Pagamento aprovado!
      setPaymentApproved(true);
      router.push(`/confirmacao/${appointmentId}`);
    }
  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }
};

// Verificar a cada 3 segundos
useEffect(() => {
  if (paymentId && !paymentApproved) {
    const interval = setInterval(() => {
      checkPaymentStatus(paymentId);
    }, 3000);

    return () => clearInterval(interval);
  }
}, [paymentId, paymentApproved]);
```

### 5. Exemplo Completo - Fluxo de Pagamento

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const router = useRouter();

  // Criar agendamento e pagamento
  const handleBooking = async (bookingData: any) => {
    try {
      // 1. Criar agendamento
      const appointmentRes = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!appointmentRes.ok) throw new Error('Erro ao criar agendamento');

      const appointment = await appointmentRes.json();

      // 2. Se requer depósito, criar pagamento PIX
      if (appointment.requiresDeposit) {
        const paymentRes = await fetch('/api/payments/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id,
            amount: appointment.depositAmount,
            paymentMethod: 'pix',
            clientEmail: bookingData.clientEmail,
          }),
        });

        if (!paymentRes.ok) throw new Error('Erro ao criar pagamento');

        const payment = await paymentRes.json();
        setPaymentData(payment);
        setShowPaymentModal(true);

        // Iniciar polling de status
        startPaymentPolling(payment.id);
      } else {
        // Sem depósito necessário (cliente com assinatura)
        router.push(`/confirmacao/${appointment.id}`);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Verificar status do pagamento periodicamente
  const startPaymentPolling = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${paymentId}/status`);
        const data = await res.json();

        setPaymentStatus(data.status);

        if (data.status === 'PAID') {
          clearInterval(interval);
          setShowPaymentModal(false);
          router.push(`/confirmacao/${data.appointmentId}`);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Limpar após 10 minutos (timeout)
    setTimeout(() => clearInterval(interval), 600000);
  };

  return (
    <div>
      {/* Formulário de agendamento */}
      <BookingForm onSubmit={handleBooking} />

      {/* Modal de Pagamento PIX */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          qrCode={paymentData.qrCode}
          qrCodeBase64={paymentData.qrCodeBase64}
          paymentUrl={paymentData.paymentUrl}
          status={paymentStatus}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
```

## 🎨 Componente de QR Code Reutilizável

```typescript
// src/components/PixQRCode.tsx
import { useState } from 'react';
import { QrCode, Copy, Check } from 'lucide-react';

interface PixQRCodeProps {
  qrCode: string;
  qrCodeBase64?: string;
  paymentUrl?: string;
  amount: number;
  onPaymentConfirmed?: () => void;
}

export default function PixQRCode({
  qrCode,
  qrCodeBase64,
  paymentUrl,
  amount,
}: PixQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Erro ao copiar código');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <QrCode className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Pagamento PIX</h3>
        <p className="text-gray-600 mt-2">
          Valor: <span className="font-bold text-green-600">R$ {amount.toFixed(2)}</span>
        </p>
      </div>

      {/* QR Code */}
      {qrCodeBase64 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="w-full max-w-xs mx-auto"
          />
        </div>
      )}

      {/* Código PIX */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código PIX (Copia e Cola)
        </label>
        <div className="relative">
          <input
            type="text"
            value={qrCode}
            readOnly
            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button
            onClick={copyToClipboard}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Botões */}
      <div className="space-y-2">
        <button
          onClick={copyToClipboard}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {copied ? '✓ Código Copiado!' : 'Copiar Código PIX'}
        </button>

        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg text-center transition-colors"
          >
            Abrir no App do Mercado Pago
          </a>
        )}
      </div>

      {/* Instruções */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com PIX</li>
          <li>Escaneie o QR Code ou cole o código</li>
          <li>Confirme o pagamento</li>
        </ol>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        O pagamento será confirmado automaticamente em poucos segundos
      </p>
    </div>
  );
}
```

## 📱 Testando

1. Configure as credenciais de teste no `.env`
2. Faça um agendamento que requer depósito
3. O QR Code PIX será exibido
4. Em modo teste, o pagamento é aprovado automaticamente
5. A confirmação chegará via webhook em segundos

## 🔄 Webhook e Atualização Automática

O backend já está configurado para receber webhooks do Mercado Pago em:
```
POST /api/webhooks/mercadopago
```

Quando o pagamento for aprovado:
1. Mercado Pago envia notificação para o webhook
2. Backend atualiza status do pagamento para `PAID`
3. Frontend verifica status via polling e redireciona para confirmação

---

**Pronto! O Mercado Pago está integrado! 🎉**
