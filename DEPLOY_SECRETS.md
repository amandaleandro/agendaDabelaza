# 🔐 Configuração de Secrets para Deploy

Para o workflow de CI/CD funcionar, você precisa configurar os seguintes **secrets** no GitHub:

## Como adicionar Secrets no GitHub

1. Vá para o repositório no GitHub
2. Clique em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret abaixo

---

## 📋 Secrets Necessários

### Docker Hub
```
DOCKERHUB_USERNAME=seu_usuario_dockerhub
DOCKERHUB_TOKEN=seu_token_dockerhub
```

**Como obter:**
1. Acesse https://hub.docker.com
2. Vá em **Account Settings** > **Security** > **New Access Token**
3. Copie o token gerado

---

### Servidor VM/SSH
```
VM_HOST=seu_ip_ou_dominio
VM_USER=seu_usuario_ssh
VM_SSH_KEY=sua_chave_privada_ssh
VM_SSH_PORT=22  # opcional, padrão 22
```

**Como obter a chave SSH:**
```bash
# No seu computador local, gere uma chave (se não tiver)
ssh-keygen -t rsa -b 4096 -C "seu@email.com"

# Copie a chave PÚBLICA para o servidor
ssh-copy-id usuario@ip_do_servidor

# Copie o conteúdo da chave PRIVADA (TODA!)
cat ~/.ssh/id_rsa
```

⚠️ **IMPORTANTE:** Copie TODO o conteúdo da chave privada, incluindo:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...todo o conteúdo...
-----END OPENSSH PRIVATE KEY-----
```

---

### Banco de Dados
```
POSTGRES_PASSWORD=senha_super_forte_aqui
```

**Gerar senha forte:**
```bash
openssl rand -base64 32
```

---

### JWT
```
JWT_SECRET=chave_secreta_jwt_aqui
```

**Gerar secret:**
```bash
openssl rand -base64 32
```

---

### Mercado Pago
```
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef...
```

**Como obter:**
1. Acesse https://www.mercadopago.com.br/developers
2. Vá em **Suas integrações** > **Criar aplicação**
3. Copie o **Access Token** (use TEST para testes, PROD para produção)

---

### Frontend
```
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

**Exemplo:**
- Produção: `https://api.agendei.com.br`
- Desenvolvimento: `http://localhost:3001`

---

## 📝 Resumo dos Secrets

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DOCKERHUB_USERNAME` | Usuário do Docker Hub | `johndoe` |
| `DOCKERHUB_TOKEN` | Token de acesso do Docker Hub | `dckr_pat_abc123...` |
| `VM_HOST` | IP ou domínio do servidor | `123.45.67.89` ou `server.com` |
| `VM_USER` | Usuário SSH do servidor | `ubuntu` ou `root` |
| `VM_SSH_KEY` | Chave privada SSH completa | `-----BEGIN OPENSSH...` |
| `VM_SSH_PORT` | Porta SSH (opcional) | `22` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `xK8mP3nQ9...` |
| `JWT_SECRET` | Chave secreta JWT | `aB9dK2lM5...` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token Mercado Pago | `TEST-1234567890...` |
| `NEXT_PUBLIC_API_URL` | URL da API backend | `https://api.seudominio.com` |

---

## 🚀 Como Fazer Deploy

### 1. Deploy Manual (via GitHub Actions)
1. Vá para **Actions** no GitHub
2. Selecione **Deploy Agendei - Production**
3. Clique em **Run workflow**
4. Escolha o tipo de versão (patch/minor/major)
5. Clique em **Run workflow**

### 2. Deploy Automático
O deploy é disparado automaticamente quando você faz push na branch `main`:
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

---

## ✅ Checklist Pré-Deploy

Antes de fazer o primeiro deploy, certifique-se de:

- [ ] Todos os secrets configurados no GitHub
- [ ] Servidor SSH acessível e configurado
- [ ] Docker e Docker Compose instalados no servidor
- [ ] Portas 80 e 443 liberadas no firewall
- [ ] DNS configurado (se aplicável)
- [ ] Conta no Docker Hub criada
- [ ] Token do Mercado Pago obtido

---

## 🔧 Comandos Úteis no Servidor

Após o deploy, você pode usar esses comandos SSH:

```bash
# Conectar ao servidor
ssh usuario@ip_do_servidor

# Ver logs dos containers
cd ~/agendei
docker-compose logs -f

# Ver status
docker-compose ps

# Reiniciar serviços
docker-compose restart

# Ver logs do backend
docker-compose logs -f backend

# Executar migrações manualmente
docker exec agendei-backend npx prisma migrate deploy

# Acessar banco de dados
docker exec -it agendei-postgres psql -U agendei
```

---

## 🐛 Troubleshooting

### Erro: "permission denied"
```bash
# No servidor, adicione seu usuário ao grupo docker
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

### Erro: "Connection refused"
```bash
# Verifique se o SSH está rodando
sudo systemctl status ssh

# Verifique a porta SSH
sudo netstat -tlnp | grep ssh
```

### Backend não inicia
```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar variáveis de ambiente
docker exec agendei-backend env | grep DATABASE_URL
```

### Migrações falhando
```bash
# Conectar ao container e executar manualmente
docker exec -it agendei-backend sh
npx prisma migrate deploy
```

---

## 📚 Documentação Adicional

- [Docker Hub](https://hub.docker.com)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Mercado Pago Docs](https://www.mercadopago.com.br/developers)
- [Let's Encrypt](https://letsencrypt.org)
