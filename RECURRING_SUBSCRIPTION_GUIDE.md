# 🚀 Sistema de Assinatura Recorrente - Guia Completo

## ✅ O que foi implementado

### 1. **Cobrança Recorrente Automática**
- Assinaturas mensais via Mercado Pago
- Primeira cobrança na aprovação
- Renovação automática todo mês
- Histórico completo de pagamentos

### 2. **Trial de 14 Dias**
- Novo plano pago inicia com status `TRIAL`
- Válido por 14 dias antes da primeira cobrança
- Após aprovação do primeiro pagamento, muda para `ACTIVE`
- Próxima renovação em +30 dias

### 3. **Gerenciamento de Assinatura**
- Dashboard mostra renovação automática (ativa/desativada)
- Botão "Desativar" para parar cobranças futuras
- Histórico de pagamentos com datas e status
- Próxima data de cobrança visível

### 4. **Notificações por Email** (configurável)
- Confirmação de pagamento após cobrança
- Confirmação de renovação automática
- Aviso quando trial expira em breve
- Modo simulação se SMTP não configurado

---

## 🧪 Como Testar

### Pré-requisitos
- Estar logado no painel: http://201.23.17.230/admin/assinatura
- Ter estabelecimento criado
- Acesso ao Mercado Pago sandbox

### Teste 1: Contratar Plano Pago (com Trial)

1. **Acesse o painel de assinatura**
   - URL: http://201.23.17.230/admin/assinatura

2. **Clique em "Mudar para BÁSICO"** (ou PRO/PREMIUM)

3. **Confirme a mudança**
   - Você será redirecionado ao checkout do Mercado Pago

4. **Complete o pagamento**
   - Use cartão de teste:
     - Número: `4111 1111 1111 1111`
     - Vencimento: `12/25`
     - CVV: `123`
   - Nome: qualquer um

5. **Após sucesso**
   - Você verá: "Plano alterado para BÁSICO com sucesso!"
   - Status no painel: **TRIAL** (válido por 14 dias)
   - Próxima cobrança: em 14 dias

### Teste 2: Ver Histórico de Pagamentos

1. **No painel de assinatura, role para baixo**
2. **Procure por "Histórico de Pagamentos"**
3. **Você verá:**
   - Data do pagamento
   - Valor (R$ 49.90 para BASIC)
   - Status: `PAID` (verde), `FAILED` (vermelho), ou `PENDING` (amarelo)

### Teste 3: Gerenciar Renovação Automática

1. **No bloco do plano atual, procure por "Renovação Automática"**
2. **Se estiver ativa, verá:**
   - Status: "Ativa: cobra todo mês automaticamente"
   - Botão "Desativar"
3. **Clique "Desativar"**
   - Confirmação: "Renovação automática desativada com sucesso"
   - Próxima cobrança: NÃO acontecerá
   - Status muda para: não-renovável

### Teste 4: Cancelar Assinatura

1. **Clique no botão "Cancelar Assinatura"** (vermelho)
2. **Confirme**
   - Você volta para o plano FREE
   - Renovação automática é cancelada
   - Mercado Pago é notificado para parar cobranças

---

## 📧 Configurar Notificações por Email

### Opção 1: Usar Resend (Recomendado)

1. **Crie conta grátis em** https://resend.com
2. **Obtenha seu API Key**
3. **Adicione ao `.env` do backend:**
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_USER=onboarding@resend.dev
   SMTP_PASS=seu-api-key-resend
   SMTP_SECURE=true
   SMTP_FROM_EMAIL=noreply@seu-dominio.com
   ```

### Opção 2: Usar Gmail

1. **Gere senha de app em:**
   https://myaccount.google.com/apppasswords
2. **Adicione ao `.env`:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=sua-senha-app
   SMTP_SECURE=true
   ```

### Opção 3: Usar SendGrid

1. **Crie conta em** https://sendgrid.com
2. **Gere API Key**
3. **Adicione ao `.env`:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxx...
   SMTP_SECURE=false
   ```

### Após configurar:
- Reinicie o backend: `docker-compose up -d --force-recreate backend`
- Teste: Faça novo pagamento ou aguarde webhook de renovação
- Verifique se email foi enviado para o proprietário

**Sem configuração:** Emails serão simulados em logs do container
```bash
ssh ubuntu@201.23.17.230 "cd ~/agendei && docker-compose logs backend | grep 'SIMULAÇÃO'"
```

---

## 🔄 Fluxo de Renovação Automática

```
Dia 1: Usuário aprova pagamento
  ↓
✅ Assinatura criada com status TRIAL
✅ Primeira cobrança processada
✅ Email de confirmação enviado
✅ expiresAt = data + 30 dias
  ↓
Dia 14: Trial está acabando (nenhuma ação necessária)
  ↓
Dia 30: Mercado Pago cobra automaticamente
  ↓
✅ Webhook recebe notificação
✅ Status = ACTIVE
✅ expiresAt = data + 30 dias
✅ Email de renovação enviado
  ↓
Próximo ciclo...
```

---

## 🛑 O que NÃO faz automaticamente

- ❌ Verificação de expiração de trial (é no webhook)
- ❌ Envio de lembrete antes do trial expirar (próximo: implementar cron job)
- ❌ Downgrade automático (usuário clica "Cancelar" ou "Desativar")
- ❌ Cobrança retroativa se payment falhar (status = PAST_DUE)

---

## 📊 Estados de Assinatura

| Status | Significado | Pode usar? |
|--------|-------------|-----------|
| `FREE` | Plano gratuito | ✅ Sim |
| `TRIAL` | Plano pago no período de teste (14d) | ✅ Sim |
| `ACTIVE` | Plano pago com cobranças ativas | ✅ Sim |
| `PAST_DUE` | Pagamento recusado | ❌ Volta para FREE |
| `EXPIRED` | Expirou, precisa renovar | ❌ Volta para FREE |
| `CANCELLED` | Usuário cancelou | ❌ Volta para FREE |
| `PENDING` | Aguardando primeiro pagamento | ⏳ Não |

---

## 🔍 Troubleshooting

### "Não vejo o botão Pagar Agora"
- ✅ Certifique-se que está no plano FREE
- ✅ Clique em "Mudar para [PLANO]"

### "Mercado Pago retorna erro"
- ✅ Verifique se MERCADOPAGO_ACCESS_TOKEN está configurado
- ✅ Use token **sandbox**: começa com `TEST-`
- ✅ Veja logs: `docker-compose logs backend | grep "Mercado"`

### "Não recebi email"
- ✅ Configure SMTP (veja seção acima)
- ✅ Ou verifique logs: `docker-compose logs backend | grep "SIMULAÇÃO"`

### "Histórico de pagamentos vazio"
- ✅ Faça um novo pagamento ou aguarde webhook
- ✅ Verifique se webhook foi chamado: `docker-compose logs backend | grep webhook`

---

## 🚀 Próximas Melhorias

1. **Cron Job de Verificação de Trial**
   - Verificar diariamente assinaturas expirando
   - Enviar email de aviso 1 dia antes

2. **Dashboard de Administrador**
   - Ver todas as assinaturas ativas
   - Gerenciar pagamentos falhados
   - Visualizar receita total

3. **Suporte a Diferentes Ciclos**
   - Anual (desconto)
   - Mensal com possibilidade de cancelamento
   - Pay-as-you-go (consumo)

4. **Webhooks Adicionais**
   - Notificação de atualização de método de pagamento
   - Alerta de cartão expirado
   - Confirmação de downgrade de plano

---

## 📱 Endpoints da API

### Listar Pagamentos
```bash
GET /api/subscriptions/{subscriptionId}/payments
# Retorna histórico de pagamentos da assinatura
```

### Listar Pagamentos do Proprietário
```bash
GET /api/subscriptions/owner/{ownerId}/payments
# Retorna todos os pagamentos de todas as assinaturas do proprietário
```

### Cancelar Renovação Automática
```bash
POST /api/subscriptions/recurring/{subscriptionId}/cancel
# Cancela cobrança no Mercado Pago e atualiza status
```

### Webhook de Renovação
```bash
POST /api/subscriptions/webhook/recurring
# Mercado Pago chama automaticamente quando há cobrança
# Evento: subscription_recurring com status: approved/rejected/refunded
```

---

## 📞 Suporte

Para mais informações ou bugs:
1. Verifique os logs: `docker-compose logs backend --tail 100`
2. Procure pela função relacionada no código
3. Valide no Mercado Pago Dashboard (https://www.mercadopago.com.br/business/dashboard)
