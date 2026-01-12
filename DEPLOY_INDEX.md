# 📚 Documentação de Deploy - Índice

Bem-vindo à documentação de deploy do Agendei! Escolha o guia apropriado:

---

## 🎯 Para Começar

### 1. [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) 
**👉 COMECE AQUI!**
- Guia rápido e completo
- Passo a passo simplificado
- Comandos prontos para usar
- **Tempo:** 15-30 minutos

### 2. [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
**✅ Lista de verificação**
- Checklist interativa
- Marque cada etapa concluída
- Evite esquecer passos importantes
- **Quando usar:** Durante todo o processo

---

## 🔐 Configuração

### 3. [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md)
**🔑 Configuração de Secrets**
- Lista completa de secrets necessários
- Como obter cada valor
- Exemplos práticos
- Troubleshooting de secrets
- **Quando usar:** Antes do primeiro deploy

### 4. [.env.server.example](./.env.server.example)
**⚙️ Variáveis de Ambiente**
- Template de .env para o servidor
- Todos os valores necessários
- Comentários explicativos
- **Quando usar:** Ao configurar o servidor

---

## 🚀 Deploy

### 5. [.github/workflows/main-cd.yml](./.github/workflows/main-cd.yml)
**⚡ Workflow de CI/CD**
- Automação completa
- Build e deploy automático
- Push para main = deploy
- **Não precisa editar** (já configurado)

### 6. [setup-server.sh](./setup-server.sh)
**🖥️ Setup Inicial do Servidor**
- Script de configuração automática
- Instala Docker, Compose, etc.
- Configura firewall e otimizações
- **Executar UMA vez no servidor novo**

```bash
# Exemplo de uso
scp setup-server.sh usuario@servidor:~
ssh usuario@servidor
sudo bash setup-server.sh
```

---

## 📖 Referências Detalhadas

### 7. [DEPLOY_VM.md](./DEPLOY_VM.md)
**📋 Deploy Manual em VM**
- Deploy passo a passo manual
- Para quem não usa GitHub Actions
- Comandos Docker detalhados
- Troubleshooting avançado
- **Quando usar:** Deploy manual ou debug

### 8. [nginx.production.conf](./nginx.production.conf)
**🌐 Configuração Nginx com SSL**
- Reverse proxy configurado
- SSL/HTTPS pronto
- Redirecionamento HTTP → HTTPS
- **Quando usar:** Após obter certificados SSL

---

## 📊 Arquivos de Suporte

### 9. [docker-compose.production.yml](./docker-compose.production.yml)
**🐳 Compose de Produção**
- Configuração completa dos containers
- Healthchecks configurados
- Networks e volumes
- **Não precisa editar** (configurado via .env)

### 10. [VERSION](./VERSION)
**🔢 Controle de Versão**
- Versão atual do sistema
- Atualizado automaticamente
- Formato: MAJOR.MINOR.PATCH

---

## 🎓 Roteiro de Aprendizado

### Primeiro Deploy (Iniciante)
1. ✅ Leia [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)
2. ✅ Use [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) como guia
3. ✅ Configure secrets com [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md)
4. ✅ Execute [setup-server.sh](./setup-server.sh) no servidor
5. ✅ Faça deploy via GitHub Actions

### Deploy Avançado
1. ✅ Entenda [.github/workflows/main-cd.yml](./.github/workflows/main-cd.yml)
2. ✅ Customize [docker-compose.production.yml](./docker-compose.production.yml)
3. ✅ Configure SSL com [nginx.production.conf](./nginx.production.conf)
4. ✅ Use [DEPLOY_VM.md](./DEPLOY_VM.md) para troubleshooting

---

## 🔍 Encontre o que Precisa

### Precisa de...

#### **Configurar pela primeira vez?**
→ [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) + [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

#### **Secrets do GitHub?**
→ [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md)

#### **Preparar o servidor?**
→ [setup-server.sh](./setup-server.sh)

#### **Deploy manual?**
→ [DEPLOY_VM.md](./DEPLOY_VM.md)

#### **Configurar SSL/HTTPS?**
→ [nginx.production.conf](./nginx.production.conf)

#### **Variáveis de ambiente?**
→ [.env.server.example](./.env.server.example)

#### **Troubleshooting?**
→ Todos os guias têm seção de troubleshooting

#### **Entender o workflow?**
→ [.github/workflows/main-cd.yml](./.github/workflows/main-cd.yml)

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

| Problema | Solução | Documento |
|----------|---------|-----------|
| Deploy falha no GitHub | Verificar secrets | [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md) |
| Erro de SSH | Verificar chave e host | [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md#servidor-vmssh) |
| Containers não iniciam | Ver logs e .env | [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md#-troubleshooting) |
| SSL não funciona | Verificar DNS e certbot | [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md#-configurar-ssl-https) |
| Servidor não configurado | Executar setup | [setup-server.sh](./setup-server.sh) |

### Fluxo de Troubleshooting

1. **Identificar o problema**
   - Deploy falha? → Ver logs do GitHub Actions
   - Container com erro? → Ver logs: `docker-compose logs`
   - Conexão falha? → Testar SSH e portas

2. **Consultar documentação**
   - Procure na seção de troubleshooting dos guias
   - Use Ctrl+F para buscar termos específicos

3. **Verificar configuração**
   - Secrets no GitHub corretos?
   - .env no servidor correto?
   - Servidor configurado?

4. **Testar componentes**
   ```bash
   # Testar SSH
   ssh usuario@servidor
   
   # Testar Docker
   docker ps
   
   # Testar API
   curl http://localhost:3001/api/health
   ```

---

## 📈 Fluxo de Deploy Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PREPARAÇÃO                                                │
│    - Ler DEPLOY_QUICK_START.md                              │
│    - Abrir DEPLOY_CHECKLIST.md                              │
│    - Provisionar servidor                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CONFIGURAÇÃO DO SERVIDOR                                  │
│    - Executar setup-server.sh                               │
│    - Verificar Docker instalado                             │
│    - Testar acesso SSH                                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CONFIGURAÇÃO GITHUB                                       │
│    - Seguir DEPLOY_SECRETS.md                               │
│    - Adicionar todos os secrets                             │
│    - Verificar secrets configurados                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PRIMEIRO DEPLOY                                           │
│    - GitHub → Actions → Run workflow                         │
│    - Aguardar conclusão                                      │
│    - Verificar containers no servidor                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CONFIGURAÇÃO DNS/SSL (Opcional)                           │
│    - Configurar DNS                                          │
│    - Obter certificados SSL                                  │
│    - Atualizar nginx.conf                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. VALIDAÇÃO                                                 │
│    - Testar aplicação                                        │
│    - Verificar logs                                          │
│    - Testar funcionalidades                                  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. DEPLOY CONTÍNUO                                           │
│    - Push para main = deploy automático                      │
│    - Monitorar via GitHub Actions                            │
│    - Acompanhar métricas do servidor                         │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Status dos Documentos

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| DEPLOY_QUICK_START.md | ✅ Completo | 2026-01-11 |
| DEPLOY_CHECKLIST.md | ✅ Completo | 2026-01-11 |
| DEPLOY_SECRETS.md | ✅ Completo | 2026-01-11 |
| DEPLOY_VM.md | ✅ Completo | Anterior |
| setup-server.sh | ✅ Completo | 2026-01-11 |
| main-cd.yml | ✅ Completo | 2026-01-11 |
| nginx.production.conf | ✅ Completo | 2026-01-11 |

---

**🎉 Toda a documentação de deploy está completa e atualizada!**

Comece por [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) e boa sorte com seu deploy! 🚀
