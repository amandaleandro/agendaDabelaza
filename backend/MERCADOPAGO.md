# Integração Mercado Pago - AppointPro Beauty

## 📋 Visão Geral

O AppointPro Beauty está integrado com o **Mercado Pago** para processar pagamentos de agendamentos e assinaturas. A integração suporta:

- ✅ Pagamentos via PIX
- ✅ Pagamentos via Cartão de Crédito
- ✅ Geração de QR Code PIX
- ✅ Webhooks para notificações de status
- ✅ Consulta de status de pagamento

## 🚀 Como Configurar

### 1. Criar Conta no Mercado Pago

1. Acesse [https://www.mercadopago.com.br](https://www.mercadopago.com.br)
2. Crie uma conta ou faça login
3. Acesse o [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)

### 2. Obter Credenciais

1. No painel de desenvolvedores, vá em **Suas integrações**
2. Clique em **Criar aplicação**
3. Preencha os dados da aplicação
4. Copie suas credenciais:
   - **Access Token** (TEST para desenvolvimento, PROD para produção)
   - **Public Key** (para integração no frontend)

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `/backend/.env`:

```env
# Mercado Pago - Credenciais de Teste
MERCADOPAGO_ACCESS_TOKEN="TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789"
MERCADOPAGO_PUBLIC_KEY="TEST-abcd1234-5678-90ef-ghij-klmnopqrstuv"
MERCADOPAGO_WEBHOOK_URL="https://seu-dominio.com/api/webhooks/mercadopago"
```

**⚠️ IMPORTANTE:**
- Use credenciais **TEST** em desenvolvimento
- Use credenciais **PROD** apenas em produção
- **NUNCA** compartilhe suas credenciais ou faça commit delas no Git

### 4. Configurar Webhooks (Produção)

Para receber notificações de mudança de status de pagamento:

1. Acesse o [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Webhooks**
3. Configure a URL: `https://seu-dominio.com/api/webhooks/mercadopago`
4. Selecione os eventos: `payment`

**Em desenvolvimento local:**
- Use [ngrok](https://ngrok.com/) ou [localtunnel](https://localtunnel.github.io/) para expor seu localhost
- Configure o webhook apontando para a URL pública temporária

## 💻 Como Usar

### Backend - Processar Pagamento

```typescript
import { MercadoPagoGateway } from './path/to/MercadoPagoGateway';

const gateway = new MercadoPagoGateway();

// Criar pagamento
const result = await gateway.charge({
  paymentId: 'unique-payment-id',
  amount: 50.00,
  description: 'Pagamento de agendamento - Corte de Cabelo'
});

if (result.success) {
  console.log('Pagamento criado:', result.transactionId);
}
```

### Backend - Criar Link de Pagamento PIX

```typescript
const paymentLink = await gateway.createPaymentLink({
  amount: 50.00,
  description: 'Corte de Cabelo',
  payerEmail: 'cliente@example.com',
  externalReference: 'appointment-123'
});

if (paymentLink.success) {
  console.log('QR Code PIX:', paymentLink.qrCode);
  console.log('URL de Pagamento:', paymentLink.paymentUrl);
}
```

### Backend - Consultar Status

```typescript
const status = await gateway.getPaymentStatus('payment-id-123');
console.log('Status:', status?.status); // approved, pending, rejected, cancelled
```

## 📊 Status de Pagamento

O Mercado Pago retorna os seguintes status:

| Status MP | Status Interno | Descrição |
|-----------|----------------|-----------|
| `pending` | `PENDING` | Aguardando pagamento |
| `approved` | `PAID` | Pagamento aprovado |
| `rejected` | `FAILED` | Pagamento rejeitado |
| `cancelled` | `FAILED` | Pagamento cancelado |
| `in_process` | `PENDING` | Em processamento |
| `in_mediation` | `PENDING` | Em mediação |

## 🔔 Webhooks

O endpoint `/api/webhooks/mercadopago` recebe notificações automáticas quando:

- Um pagamento é aprovado
- Um pagamento é rejeitado
- O status de um pagamento muda

O webhook automaticamente atualiza o status do pagamento no banco de dados.

## 🧪 Testar em Desenvolvimento

### Usar Credenciais de Teste

O Mercado Pago fornece credenciais de teste que simulam pagamentos sem cobrar valores reais.

### Cartões de Teste

Use os seguintes cartões para simular cenários:

**Aprovado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Data: `11/25`

**Rejeitado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Data: `11/25`
- CPF: Use CPF que termine com números específicos para simular rejeição

[Ver mais cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/testing/test-cards)

### Simular PIX

Em ambiente de teste, o PIX é aprovado automaticamente após alguns segundos.

## 📚 Documentação Oficial

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [API Reference](https://www.mercadopago.com.br/developers/pt/reference)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/testing/test-cards)

## 🔐 Segurança

### Boas Práticas:

1. ✅ Nunca exponha seu Access Token no frontend
2. ✅ Use HTTPS em produção
3. ✅ Valide webhooks verificando a assinatura
4. ✅ Use credenciais TEST em desenvolvimento
5. ✅ Mantenha as credenciais em variáveis de ambiente
6. ✅ Não faça commit de credenciais no Git

### Produção:

- Configure rate limiting no seu servidor
- Monitore logs de transações
- Configure alertas para transações suspeitas
- Implemente retry logic para webhooks

## 🆘 Troubleshooting

### "Access Token inválido"
- Verifique se copiou o token completo
- Confirme que está usando TEST em desenvolvimento
- Verifique se o token não expirou

### "Webhook não está sendo recebido"
- Confirme que a URL está acessível publicamente
- Verifique logs do servidor
- Use ferramentas como RequestBin para testar
- Confirme que configurou o webhook no painel do Mercado Pago

### "Pagamento não é criado"
- Verifique logs do backend
- Confirme que o Access Token está correto
- Verifique se o amount está no formato correto (decimal)

## 📞 Suporte

- Documentação: https://www.mercadopago.com.br/developers
- Suporte: https://www.mercadopago.com.br/developers/pt/support
- Status da API: https://status.mercadopago.com/

---

**Última atualização:** 04/01/2026
