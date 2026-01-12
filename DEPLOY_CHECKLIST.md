# ✅ Checklist de Deploy - Agendei

Use esta checklist para garantir que tudo está configurado corretamente antes do deploy.

---

## 🎯 Fase 1: Preparação do Servidor

### No Servidor (VM/VPS)

- [ ] Servidor Linux (Ubuntu 20.04+ recomendado) provisionado
- [ ] Acesso SSH configurado
- [ ] IP público disponível
- [ ] Portas abertas no firewall: 22, 80, 443
- [ ] Script `setup-server.sh` executado com sucesso
- [ ] Docker instalado e funcionando
- [ ] Docker Compose instalado
- [ ] Logout e login realizado após instalação do Docker

**Comandos de verificação:**
```bash
docker --version              # Deve mostrar versão
docker-compose --version      # Deve mostrar versão
docker ps                     # Não deve dar erro de permissão
```

---

## 🔐 Fase 2: Configuração de Secrets no GitHub

### Acesse: GitHub → Settings → Secrets and variables → Actions

#### Docker Hub
- [ ] `DOCKERHUB_USERNAME` - Seu usuário do Docker Hub
- [ ] `DOCKERHUB_TOKEN` - Token de acesso do Docker Hub

**Como obter:** https://hub.docker.com → Account Settings → Security → New Access Token

#### Servidor SSH
- [ ] `VM_HOST` - IP ou domínio do servidor (ex: `123.45.67.89`)
- [ ] `VM_USER` - Usuário SSH (ex: `ubuntu` ou `root`)
- [ ] `VM_SSH_KEY` - Chave privada SSH completa (incluindo BEGIN/END)
- [ ] `VM_SSH_PORT` - Porta SSH (padrão: `22`)

**Como obter chave SSH:**
```bash
cat ~/.ssh/id_rsa    # Copiar TODO o conteúdo
```

#### Banco de Dados
- [ ] `POSTGRES_PASSWORD` - Senha forte gerada

**Gerar senha:**
```bash
openssl rand -base64 32
```

#### Autenticação
- [ ] `JWT_SECRET` - Chave secreta para JWT

**Gerar secret:**
```bash
openssl rand -base64 32
```

#### Mercado Pago
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Token do Mercado Pago

**Como obter:** https://www.mercadopago.com.br/developers → Suas integrações

#### Frontend
- [ ] `NEXT_PUBLIC_API_URL` - URL da API (ex: `https://api.seudominio.com`)

---

## 🌐 Fase 3: Configuração de DNS (Opcional mas Recomendado)

### No provedor de DNS (GoDaddy, Cloudflare, etc.)

- [ ] Registro A: `app.seudominio.com` → IP do servidor
- [ ] Registro A: `api.seudominio.com` → IP do servidor
- [ ] DNS propagado (teste com `nslookup app.seudominio.com`)

**Verificar propagação:**
```bash
nslookup app.seudominio.com
nslookup api.seudominio.com
```

---

## 📦 Fase 4: Preparação do Código

### No Repositório Local

- [ ] Código atualizado e testado localmente
- [ ] Migrations criadas (se houver alterações no banco)
- [ ] Arquivo `VERSION` existe na raiz (será criado automaticamente se não existir)
- [ ] Dockerfiles do backend e frontend funcionando
- [ ] `.github/workflows/main-cd.yml` configurado
- [ ] Código commitado e pushed para GitHub

**Testar localmente:**
```bash
cd backend && npm run build    # Backend compila?
cd frontend && npm run build   # Frontend compila?
```

---

## 🚀 Fase 5: Primeiro Deploy

### Deploy Manual

- [ ] GitHub → Actions → Deploy Agendei - Production → Run workflow
- [ ] Escolher `patch` como version type
- [ ] Workflow executado sem erros
- [ ] Imagens publicadas no Docker Hub
- [ ] Containers iniciados no servidor

**Acompanhar:**
- Monitor na aba Actions do GitHub
- Logs devem mostrar ✅ em cada etapa

### Verificação no Servidor

```bash
ssh usuario@ip_do_servidor
cd ~/agendei

# Todos devem estar "Up" e "healthy"
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar API
curl http://localhost:3001/api/health
```

- [ ] Container `agendei-postgres` está Up
- [ ] Container `agendei-backend` está Up e healthy
- [ ] Container `agendei-frontend` está Up e healthy
- [ ] Container `agendei-nginx` está Up
- [ ] API responde em `/api/health`

---

## 🔐 Fase 6: Configurar SSL/HTTPS (Opcional)

### Apenas se DNS estiver configurado

```bash
# No servidor
ssh usuario@ip_do_servidor
cd ~/agendei

# Parar nginx
docker-compose stop nginx

# Obter certificados
sudo certbot certonly --standalone \
  -d app.seudominio.com \
  -d api.seudominio.com \
  --email seu@email.com \
  --agree-tos

# Usar configuração nginx com SSL
cp nginx.production.conf nginx.conf
nano nginx.conf  # Editar com seus domínios

# Reiniciar nginx
docker-compose up -d nginx
```

- [ ] Certificados SSL obtidos com sucesso
- [ ] nginx.conf editado com domínios corretos
- [ ] HTTPS funcionando em ambos os domínios
- [ ] Redirecionamento HTTP → HTTPS ativo

---

## ✅ Fase 7: Testes de Produção

### Acessar Aplicação

- [ ] Frontend carrega: http://IP_SERVIDOR ou https://app.seudominio.com
- [ ] Backend responde: http://IP_SERVIDOR:3001/api/health
- [ ] Consegue fazer login
- [ ] Consegue criar agendamento
- [ ] Mercado Pago funcionando (se configurado)

### Monitoramento

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver uso de recursos
docker stats

# Ver disco
df -h
```

- [ ] Logs sem erros críticos
- [ ] Memória < 80% utilizada
- [ ] Disco < 80% utilizado
- [ ] Aplicação respondendo rapidamente

---

## 🔄 Fase 8: Deploy Contínuo

### Configurar Deploy Automático

- [ ] Push para `main` dispara deploy automaticamente
- [ ] Testar com pequena mudança
- [ ] Verificar que versão incrementou
- [ ] Containers atualizaram

**Fluxo de trabalho:**
```bash
# Fazer alteração
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Deploy acontece automaticamente!
# Acompanhar em: GitHub → Actions
```

---

## 📊 Fase 9: Backup e Manutenção

### Backups Automáticos

- [ ] Cron job de backup configurado (via setup-server.sh)
- [ ] Backup manual testado: `/usr/local/bin/backup-agendei.sh`
- [ ] Backup restaurado com sucesso (testar)

```bash
# Testar backup
sudo /usr/local/bin/backup-agendei.sh

# Ver backups
ls -lh /backup/agendei/
```

### Monitoramento Contínuo

- [ ] Script de monitoramento criado (opcional)
- [ ] Alertas configurados (opcional)
- [ ] Logs sendo analisados periodicamente

---

## 🎉 Deploy Concluído!

Se todas as checkboxes acima estão marcadas, seu deploy está completo e funcional!

### Próximos Passos

1. **Monitoramento:** Configure alertas para downtime
2. **Backups:** Valide que backups estão funcionando
3. **Performance:** Monitore métricas e otimize se necessário
4. **Segurança:** Revise logs regularmente
5. **Atualizações:** Mantenha dependências atualizadas

---

## 📚 Documentação Adicional

- [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) - Guia rápido
- [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md) - Detalhes dos secrets
- [DEPLOY_VM.md](./DEPLOY_VM.md) - Deploy manual
- [README.md](./README.md) - Documentação geral

---

## 🆘 Problemas?

### Deploy falhou?
1. Ver logs no GitHub Actions
2. Verificar secrets configurados
3. Testar SSH: `ssh usuario@ip_do_servidor`
4. Ver logs do servidor: `docker-compose logs -f`

### Containers não iniciam?
1. Ver logs: `docker-compose logs backend`
2. Verificar .env: `cat .env`
3. Testar conexão com banco: `docker exec -it agendei-postgres psql -U agendei`

### SSL não funciona?
1. Verificar DNS: `nslookup app.seudominio.com`
2. Testar certbot: `sudo certbot certificates`
3. Ver logs nginx: `docker-compose logs nginx`

---

**🎊 Parabéns! Seu sistema está em produção!** 🚀
