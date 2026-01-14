# GitHub Secrets - Configuração Necessária

Adicione os seguintes secrets no repositório GitHub:
**Settings > Secrets and variables > Actions**

## Banco de Dados (Magalu Cloud)
```
DATABASE_URL=postgresql://agenda:agenda2026@172.18.2.122:5432/agendabeleza
```

## Docker Hub
```
DOCKERHUB_USERNAME=amandalscarmo
DOCKERHUB_TOKEN=seu_token_docker_hub_aqui
```

## Credenciais SSH (Deploy)
```
DEPLOY_HOST=seu_ip_servidor_aqui
DEPLOY_USER=seu_usuario_ssh_aqui
DEPLOY_KEY=sua_chave_privada_ssh_aqui
DEPLOY_PORT=22
```

## Segurança
```
JWT_SECRET=jwt_secret_key_2026_production_secure
MERCADOPAGO_ACCESS_TOKEN=seu_token_mercado_pago_aqui
NEXT_PUBLIC_API_URL=/api
DOMAIN=agendei.app
```

## Resumo das Mudanças
- ✅ `docker-compose.yml` atualizado - PostgreSQL removido (usando Magalu Cloud)
- ✅ `.env.production` atualizado com `DATABASE_URL`
- ✅ GitHub Actions atualizado para usar secrets do banco

## Próximos Passos
1. Ir em **https://github.com/seu-usuario/agendei/settings/secrets/actions**
2. Adicionar cada secret acima
3. Fazer push para disparar o deploy
