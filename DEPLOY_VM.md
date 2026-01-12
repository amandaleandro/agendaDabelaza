# Deploy em VM - Magalu Cloud

## 📋 Pré-requisitos na VM

1. **Docker e Docker Compose instalados**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Portas liberadas no firewall**
- 80 (HTTP)
- 443 (HTTPS)
- 22 (SSH)

3. **DNS configurado** apontando para o IP da VM:
- `app.seudominio.com` → IP da VM
- `api.seudominio.com` → IP da VM

## 🚀 Passo a Passo

### 1. Clonar o repositório na VM
```bash
git clone <seu-repositorio>
cd agendei
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.production.example .env.production
nano .env.production
```

Preencha:
- `REGISTRY_NAMESPACE`: namespace do registry Magalu
- `DOMAIN_APP`: app.seudominio.com
- `DOMAIN_API`: api.seudominio.com
- `POSTGRES_PASSWORD`: senha forte para o banco
- `JWT_SECRET`: chave secreta (use: `openssl rand -base64 32`)
- `MERCADO_PAGO_ACCESS_TOKEN`: token do Mercado Pago

### 3. Login no registry Magalu
```bash
docker login registry.magalu.cloud
# Usuário: seu-usuario
# Senha: seu-token
```

### 4. Ajustar email no deploy.sh
```bash
nano deploy.sh
# Linha com certbot: alterar "seu@email.com" para seu email real
```

### 5. Executar deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

O script vai:
- ✅ Construir e fazer push das imagens
- ✅ Configurar Nginx
- ✅ Obter certificados SSL (Let's Encrypt)
- ✅ Iniciar todos os containers
- ✅ Aplicar migrações do banco

### 6. Verificar status
```bash
docker-compose -f docker-compose.production.yml ps
```

Todos devem estar "Up" e "healthy".

## 📊 Comandos Úteis

### Logs
```bash
# Todos os serviços
docker-compose -f docker-compose.production.yml logs -f

# Apenas backend
docker-compose -f docker-compose.production.yml logs -f backend

# Apenas frontend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### Reiniciar serviços
```bash
# Todos
docker-compose -f docker-compose.production.yml restart

# Apenas backend
docker-compose -f docker-compose.production.yml restart backend
```

### Atualizar aplicação
```bash
# Pull das novas imagens
docker-compose -f docker-compose.production.yml pull

# Recriar containers
docker-compose -f docker-compose.production.yml up -d

# Aplicar migrações se houver
docker exec agendei-backend npx prisma migrate deploy
```

### Backup do banco
```bash
docker exec agendei-postgres pg_dump -U agendei agendei > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore do banco
```bash
cat backup.sql | docker exec -i agendei-postgres psql -U agendei -d agendei
```

### Acessar container
```bash
docker exec -it agendei-backend sh
docker exec -it agendei-frontend sh
docker exec -it agendei-postgres psql -U agendei
```

## 🔐 Renovação SSL (Automática)

O Certbot renova automaticamente a cada 12h. Para forçar:
```bash
docker-compose -f docker-compose.production.yml run --rm certbot renew
docker-compose -f docker-compose.production.yml restart nginx
```

## 📈 Monitoramento

### Health checks
```bash
# Backend
curl https://api.seudominio.com/api/health

# Frontend
curl https://app.seudominio.com
```

### Recursos da VM
```bash
# CPU e memória dos containers
docker stats

# Espaço em disco
df -h
docker system df
```

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Ver logs
docker logs agendei-backend

# Verificar banco
docker exec agendei-postgres pg_isready -U agendei

# Testar conexão
docker exec agendei-backend npx prisma db pull
```

### Frontend não carrega
```bash
# Ver logs
docker logs agendei-frontend

# Verificar variável de ambiente
docker exec agendei-frontend env | grep NEXT_PUBLIC_API_URL
```

### Certificado SSL não gerado
```bash
# Verificar DNS
nslookup app.seudominio.com
nslookup api.seudominio.com

# Certificado manual
docker-compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email seu@email.com --agree-tos --no-eff-email \
  -d app.seudominio.com -d api.seudominio.com
```

## 🔄 CI/CD (Opcional)

Adicione no seu pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to VM
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VM_HOST }}
        username: ${{ secrets.VM_USER }}
        key: ${{ secrets.VM_SSH_KEY }}
        script: |
          cd /path/to/agendei
          git pull
          ./deploy.sh
```

## 📞 Suporte

- Logs: `/var/log/agendei/`
- Documentação API: https://api.seudominio.com/api
- Status: `docker-compose -f docker-compose.production.yml ps`
