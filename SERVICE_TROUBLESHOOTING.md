# 🔧 Guia de Troubleshooting - Serviços Não Aparecem no Agendamento

## Problema
Você criou um profissional e tentou criar um serviço, mas o serviço **não aparece** na página de agendamento (`/[slug]/agendar`).

## Possíveis Causas e Soluções

### 1. **Não Autenticado ou Estabelecimento Não Associado**

**Problema:** A página de serviços mostra: *"Erro de Autenticação - Nenhum estabelecimento foi associado à sua conta"*

**Causa:** Você não está autenticado ou o `establishment` não foi retornado durante o login.

**Solução:**
```bash
1. Clique em "Ir para Login"
2. Faça login com suas credenciais (admin@agendei.com / senha123 ou suas credenciais de produção)
3. Volte para a página de Serviços
```

**O que acontece internamente:**
- O sistema armazena o `establishmentId` no localStorage
- Todos os serviços criados vinculam-se a este `establishmentId`
- O endpoint público `/public/establishments/{slug}/services` retorna apenas serviços com este `establishmentId`

---

### 2. **Nenhum Profissional Cadastrado**

**Problema:** A página de serviços mostra: *"Nenhum Profissional Cadastrado"*

**Causa:** Você precisa de pelo menos um profissional para criar serviços (todos os serviços devem estar vinculados a um profissional).

**Solução:**
```bash
1. Clique em "Ir para Profissionais"
2. Crie um novo profissional
3. O sistema automaticamente criará schedules (seg-sex 9h-18h) para o profissional
4. Volte para Serviços e crie um novo serviço
```

**O que acontece internamente:**
- Quando você cria um profissional, o sistema cria automaticamente 5 schedules (Mon-Fri, 9:00-18:00)
- O serviço precisa estar vinculado a um profissional com ID válido
- O endpoint `/public/establishments/{slug}/services` retorna `professionalId` para cada serviço

---

### 3. **Serviço Criado Mas Sem PROFISSIONAL CORRETO**

**Problema:** O serviço aparece na lista de serviços, mas:
- Ao clicar em "Agendar", mostra "Nenhum horário disponível"
- O profissional não está disponível no passo de seleção

**Causa:** O serviço foi criado sem vincular ao profissional correto ou o profissional não tem schedules ativas.

**Solução:**

1. **Verificar se o serviço está vinculado ao profissional correto:**
   ```bash
   # No admin, editar o serviço (em desenvolvimento)
   # Ou verificar se você selecionou o profissional correto ao criar
   ```

2. **Verificar se o profissional tem schedules:**
   ```bash
   GET /professionals/{professionalId}/schedules
   ```
   Deveria retornar algo como:
   ```json
   [
     { "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "18:00", "isAvailable": true },
     { "dayOfWeek": "TUESDAY", "startTime": "09:00", "endTime": "18:00", "isAvailable": true },
     ...
   ]
   ```

3. **Se não houver schedules:** O backend deveria ter criado automaticamente. Se isso não aconteceu:
   - Recrie o profissional
   - O sistema criará as schedules novamente

---

### 4. **Serviço COM DURATION Maior Que o HORÁRIO DE TRABALHO**

**Problema:** Você criou um serviço com 120 minutos, mas o profissional trabalha 9-10h (1 hora).

**Causa:** O endpoint `/public/appointments/available-slots` valida se a duração total do serviço cabe dentro do horário de trabalho.

**Solução:**
```bash
1. Editar o serviço e reduzir durationMinutes
   - OU -
2. Editar o schedule do profissional para expandir o horário de trabalho
```

**Exemplo:**
- Profissional trabalha 9h-18h = 9 horas = 540 minutos ✅
- Serviço com 60 minutos = OK ✅
- Serviço com 120 minutos = OK ✅
- Mas se profissional trabalha apenas 9h-10h = 60 minutos = Serviço de 120min ❌

---

### 5. **VERIFICAR DADOS NO BANCO**

Se nada funcionar, vamos debugar. Execute este script:

```javascript
// Abra o DevTools no navegador (F12 > Console)
// Teste estes endpoints:

// 1. Existe o estabelecimento?
fetch('/api/public/establishments/salao-da-maria')
  .then(r => r.json())
  .then(d => console.log('Establishment:', d))

// 2. Existem profissionais?
fetch('/api/public/establishments/salao-da-maria/professionals')
  .then(r => r.json())
  .then(d => console.log('Professionals:', d))

// 3. Existem serviços?
fetch('/api/public/establishments/salao-da-maria/services')
  .then(r => r.json())
  .then(d => console.log('Services:', d))

// 4. Existe schedule para amanhã?
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().split('T')[0];

fetch('/api/public/appointments/available-slots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    establishmentSlug: 'salao-da-maria',
    date: dateStr,
    services: [{ serviceId: 'service-id-here', professionalId: 'prof-id-here' }]
  })
})
  .then(r => r.json())
  .then(d => console.log('Available Slots:', d))
```

---

## Fluxo Correto de Criação

### Passo 1: Login
- ✅ Você faz login
- ✅ Recebe token + establishment
- ✅ `establishment.id` armazenado no localStorage

### Passo 2: Criar Profissional
- ✅ Você vai para Profissionais
- ✅ Clica "Novo Profissional"
- ✅ Preenche: nome, email, telefone
- ✅ Marca se é freelancer (opcional)
- ✅ Sistema cria profissional + 5 schedules automáticas

### Passo 3: Criar Serviço
- ✅ Você vai para Serviços
- ✅ Clica "Novo Serviço"
- ✅ Seleciona o **Profissional** (obrigatório)
- ✅ Preenche: nome, descrição, preço, duração
- ✅ POST para `/professionals/{professionalId}/services`
- ✅ Sistema vincula: `establishmentId` + `professionalId` + serviço

### Passo 4: Agendar
- ✅ Visitante acessa `/[slug]/agendar`
- ✅ GET `/public/establishments/{slug}/services` retorna serviços
- ✅ GET `/public/establishments/{slug}/professionals` retorna profissionais
- ✅ Visitante seleciona serviço
- ✅ POST `/public/appointments/available-slots` retorna horários disponíveis
- ✅ Visitante confirma agendamento

---

## Checklist de Verificação

- [ ] Você fez login e está vendo seu estabelecimento no admin?
- [ ] Você criou um profissional?
- [ ] O profissional aparece na lista de profissionais?
- [ ] Você criou um serviço selecionando um profissional?
- [ ] O serviço aparece na lista de serviços?
- [ ] Ao clicar no link de agendamento do seu estabelecimento, os serviços aparecem?
- [ ] Ao selecionar um serviço, aparecem horários disponíveis?

Se tudo passou: 🎉 Está funcionando!

Se não passou em algum ponto: consulte o guia acima.

---

## Erros Comuns Resolvidos

### ❌ "Erro de Autenticação"
→ **Solução:** Faça login novamente

### ❌ "Nenhum Profissional Cadastrado"
→ **Solução:** Crie um profissional primeiro

### ❌ "Nenhum horário disponível nos próximos 14 dias"
→ **Solução:** Verifique se:
   - O serviço está vinculado a um profissional
   - O profissional tem schedules ativas
   - O serviço duration não é maior que o horário de trabalho
   - Procurando por data no futuro (não passado)

### ❌ POST /professionals/{id}/services retorna 400
→ **Possíveis razões:**
   - `establishmentId` ausente ou inválido
   - `professionalId` não existe
   - `price` ou `durationMinutes` são 0 ou negativos
   - Você não fez login

---

## Contato

Se mesmo após seguir este guia o problema persistir, verifique:

1. Os logs do backend (npm run start:dev)
2. Os logs do DevTools (F12)
3. A URL do seu establishment (deve ser um slug válido, ex: `salao-da-maria`)

