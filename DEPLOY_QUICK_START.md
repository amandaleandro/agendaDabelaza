# 🚀 Guia Rápido de Deploy - Agendei

## 📋 Resumo do Sistema de Deploy

O sistema está configurado com CI/CD automático usando **GitHub Actions** + **Docker** + **SSH**.

---

## 🎯 Pré-requisitos

### 1. No Servidor (VM/VPS)
```bash
# Copiar o script de setup para o servidor
scp setup-server.sh usuario@ip_do_servidor:~

# Conectar ao servidor
ssh usuario@ip_do_servidor

# Executar setup
sudo bash setup-server.sh

# IMPORTANTE: Fazer logout e login novamente
exit
```

### 2. No GitHub
Configure os seguintes **secrets** (veja [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md)):
- `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN`
- `VM_HOST`, `VM_USER`, `VM_SSH_KEY`
- `POSTGRES_PASSWORD`, `JWT_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_API_URL`

### 3. DNS (Opcional para produção)
```
app.seudominio.com  →  IP_DO_SERVIDOR
api.seudominio.com  →  IP_DO_SERVIDOR
```

---

## 🚀 Como Fazer Deploy

### Opção 1: Deploy Automático (Recomendado)
```bash
# Faça commit e push para a branch main
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# O deploy será automático! 🎉
```

### Opção 2: Deploy Manual
1. Acesse o GitHub → **Actions**
2. Clique em **Deploy Agendei - Production**
3. Clique em **Run workflow**
4. Escolha o tipo de versão:
   - `patch` → 0.0.0 → 0.0.1 (bugfixes)
   - `minor` → 0.0.0 → 0.1.0 (novas features)
   - `major` → 0.0.0 → 1.0.0 (breaking changes)
5. Clique em **Run workflow**

---

## 📦 O que o Deploy Faz

1. ✅ Incrementa a versão automaticamente
2. ✅ Faz build das imagens Docker (backend + frontend)
3. ✅ Publica no Docker Hub
4. ✅ Conecta no servidor via SSH
5. ✅ Baixa as novas imagens
6. ✅ Para os containers antigos
7. ✅ Inicia os novos containers
8. ✅ Executa migrações do banco
9. ✅ Limpa imagens antigas

**Tempo estimado:** 5-10 minutos

---

## 🔍 Verificar Deploy

### No GitHub
- Vá em **Actions** e veja o status do workflow
- ✅ Verde = sucesso
- ❌ Vermelho = erro (veja os logs)

### No Servidor
```bash
# Conectar ao servidor
ssh usuario@ip_do_servidor

# Ver status dos containers
cd ~/agendei
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar API
curl http://localhost:3001/api/health
```

---

## 🌐 Acessar o Sistema

### Desenvolvimento Local
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Produção (após deploy)
- Frontend: http://ip_do_servidor (porta 80) ou https://app.seudominio.com
- Backend: http://ip_do_servidor/api ou https://api.seudominio.com

---

## 🔐 Configurar SSL (HTTPS)

Após o primeiro deploy, configure SSL:

```bash
# Conectar ao servidor
ssh usuario@ip_do_servidor
cd ~/agendei

# Parar nginx temporariamente
docker-compose stop nginx

# Obter certificados (substitua os domínios)
sudo certbot certonly --standalone \
  -d app.seudominio.com \
  -d api.seudominio.com \
  --email seu@email.com \
  --agree-tos

# Copiar nginx.production.conf
cp nginx.production.conf nginx.conf

# Editar e trocar "app.seudominio.com" pelo seu domínio
nano nginx.conf

# Reiniciar nginx
docker-compose up -d nginx
```

---

## 🐛 Troubleshooting

### Deploy falhou?
```bash
# Ver logs do GitHub Actions
# GitHub → Actions → Clique no workflow falhado → Ver logs

# Possíveis causas:
# - Secrets não configurados
# - Servidor SSH inacessível
# - Docker Hub indisponível
```

### Containers não iniciam?
```bash
# No servidor
cd ~/agendei
docker-compose logs backend
docker-compose logs frontend

# Verificar variáveis de ambiente
cat .env

# Reiniciar tudo
docker-compose down
docker-compose up -d
```

### Erro de migração?
```bash
# Executar migrações manualmente
docker exec -it agendei-backend npx prisma migrate deploy

# Ver status
docker exec -it agendei-backend npx prisma migrate status
```

### Banco de dados corrompido?
```bash
# Restaurar backup
cd ~/agendei
docker exec -i agendei-postgres psql -U agendei < /backup/agendei/db_backup_YYYYMMDD.sql
```

---

## 📊 Comandos Úteis

```bash
# Status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar serviço específico
docker-compose restart backend

# Parar tudo
docker-compose down

# Iniciar tudo
docker-compose up -d

# Limpar sistema
docker system prune -a

# Backup manual
/usr/local/bin/backup-agendei.sh

# Acessar banco de dados
docker exec -it agendei-postgres psql -U agendei
```

---

## 🔄 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento Local
```bash
# Fazer alterações
code .

# Testar localmente
npm run dev

# Commit
git add .
git commit -m "feat: nova funcionalidade"
```

### 2. Push para Main
```bash
git push origin main
# Deploy automático inicia! 🚀
```

### 3. Monitorar Deploy
```bash
# Acompanhar no GitHub Actions
# Ou via SSH no servidor:
ssh usuario@ip_do_servidor
cd ~/agendei
docker-compose logs -f
```

### 4. Validar em Produção
```bash
# Testar endpoints
curl https://api.seudominio.com/api/health

# Verificar aplicação
# Abrir https://app.seudominio.com no navegador
```

---

## 📈 Monitoramento

### Logs
```bash
# Últimos 100 logs do backend
docker-compose logs --tail=100 backend

# Logs com timestamp
docker-compose logs -t -f
```

### Métricas
```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Memória
free -h
```

---

## 🎯 Checklist de Deploy

Antes de cada deploy:

- [ ] Código testado localmente
- [ ] Migrations criadas (se houver alterações no banco)
- [ ] Variáveis de ambiente atualizadas
- [ ] Secrets configurados no GitHub
- [ ] Servidor acessível via SSH
- [ ] Backup recente do banco de dados

---

## 📚 Arquivos Importantes

- [`.github/workflows/main-cd.yml`](.github/workflows/main-cd.yml) - Workflow de CI/CD
- [`DEPLOY_SECRETS.md`](./DEPLOY_SECRETS.md) - Configuração de secrets
- [`docker-compose.production.yml`](./docker-compose.production.yml) - Compose de produção
- [`setup-server.sh`](./setup-server.sh) - Setup inicial do servidor
- [`nginx.production.conf`](./nginx.production.conf) - Configuração nginx com SSL

---

## 🆘 Suporte

Em caso de problemas:
1. Consulte os logs no GitHub Actions
2. Verifique os logs dos containers
3. Revise a configuração dos secrets
4. Verifique conectividade SSH
5. Consulte a documentação específica em [`DEPLOY_VM.md`](./DEPLOY_VM.md)

---

**🎉 Pronto! Seu sistema está configurado para deploy contínuo!**
