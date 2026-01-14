# Configuração para Acesso via IP

## Objetivo
Configurar o sistema para funcionar via IP `http://201.23.17.230/[slug]` ao invés de localhost.

## Passos de Configuração

### 1. Configurar Variáveis de Ambiente no Frontend

Crie o arquivo `frontend/.env.local`:

```bash
# API URL - usar IP da máquina
NEXT_PUBLIC_API_URL=http://201.23.17.230/api

# App URL - para landing pages públicas
NEXT_PUBLIC_APP_URL=http://201.23.17.230
```

### 2. Usar Configuração de Nginx Simplificada

No servidor de produção, use a configuração `nginx.ip.conf` que:
- **Não usa SSL** (ideal para IP sem certificado)
- Configurações de timeout aumentadas (60s)
- Aceita qualquer host (`server_name _`)

```bash
# No docker-compose.yml, ajuste o volume do nginx:
volumes:
  - ./nginx.ip.conf:/etc/nginx/nginx.conf:ro
```

### 3. Acessar a Landing Page

Após configurado, acesse:
- Landing page: `http://201.23.17.230/[slug-do-estabelecimento]`
- Admin: `http://201.23.17.230/admin`
- Login: `http://201.23.17.230/login`

Exemplo com o slug `amanda-leandro-soares-do-carmo`:
```
http://201.23.17.230/amanda-leandro-soares-do-carmo
```

### 4. Cores Customizadas na Landing Page

A landing page **automaticamente** usa as cores configuradas no admin:

1. Acesse `http://201.23.17.230/admin/landing`
2. Configure:
   - **Cor Primária**: Cor principal do tema (botões, títulos)
   - **Cor Secundária**: Cor de destaque (gradientes)
3. As cores são salvas no banco de dados (`establishment.primaryColor` e `establishment.secondaryColor`)
4. A landing page busca essas cores via API: `GET /api/public/establishments/{slug}`

**Como funciona:**
```tsx
// A landing page usa o hook useEstablishmentTheme
const { primary, secondary, gradient } = useEstablishmentTheme({
  slug,
  initialPrimary: establishment?.primaryColor,
  initialSecondary: establishment?.secondaryColor,
});

// E aplica as cores em toda a página
<section style={{ background: gradient('135deg') }}>
  <button style={{ backgroundColor: primary }}>Agendar</button>
</section>
```

### 5. Solução para ERR_TIMED_OUT

Se você estiver vendo erros de timeout:

**Frontend:**
- ✅ Adicionado timeout de 30s no axios (`frontend/src/services/api.ts`)

**Backend/Nginx:**
- ✅ Adicionado timeouts de 60s no nginx (`nginx.ip.conf`)

**Verificação:**
```bash
# Testar se o backend está respondendo
curl http://201.23.17.230/api/professionals

# Ver logs do backend
docker logs agendei-backend-1

# Ver logs do nginx
docker logs agendei-nginx-1
```

## Troubleshooting

### Landing page não carrega as cores
1. Verifique se as cores foram salvas no admin
2. Teste o endpoint: `curl http://201.23.17.230/api/public/establishments/[slug]`
3. Deve retornar `primaryColor` e `secondaryColor`

### ERR_TIMED_OUT ainda ocorre
1. Verifique se o backend está rodando: `docker ps`
2. Verifique logs: `docker logs agendei-backend-1`
3. Teste conexão direta com backend: `curl http://201.23.17.230/api/professionals`

### Landing page mostra "Estabelecimento não encontrado"
1. Verifique se o slug está correto
2. Acesse o admin e confirme o slug do estabelecimento
3. Teste: `curl http://201.23.17.230/api/public/establishments/[seu-slug]`

## Arquivos Modificados

- ✅ `nginx.ip.conf` - Nova configuração nginx para IP sem SSL
- ✅ `frontend/.env.example` - Documentação das variáveis de ambiente
- ✅ `frontend/src/services/api.ts` - Timeout de 30s adicionado
- ✅ `frontend/app/[slug]/page.tsx` - Já usa as cores do establishment
- ✅ `frontend/src/hooks/useEstablishmentTheme.ts` - Hook que busca as cores

## Deploy

Para fazer deploy com essas configurações:

```bash
# 1. Atualizar variáveis de ambiente no servidor
# 2. Usar nginx.ip.conf no docker-compose
# 3. Rebuild e restart dos containers
docker-compose down
docker-compose up -d --build
```
