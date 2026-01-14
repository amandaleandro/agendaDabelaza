# Configuração de Domínio

## Domínio Configurado

- **Domínio Fictício (Padrão):** `agendei.app`
- **IP do Servidor:** `201.23.17.230`

## Acessar via IP

Você pode acessar a aplicação diretamente pelo IP:

```
http://201.23.17.230
```

## Acessar via Domínio Fictício (Local)

Para testar o domínio `agendei.app` no seu computador local:

### No Windows:

1. Abra o arquivo `C:\Windows\System32\drivers\etc\hosts` como administrador
2. Adicione a linha:
   ```
   201.23.17.230  agendei.app
   ```
3. Salve o arquivo
4. Acesse: `http://agendei.app`

### No macOS/Linux:

```bash
sudo nano /etc/hosts
```

Adicione a linha:
```
201.23.17.230  agendei.app
```

Pressione `Ctrl+O`, `Enter`, depois `Ctrl+X` para salvar.

Depois acesse: `http://agendei.app`

## Usar Domínio Real Personalizado

Se você tiver um domínio real (ex: `sua-empresa.com.br`), configure como variável de ambiente no GitHub Actions:

1. Vá para **Settings > Secrets and Variables > Actions**
2. Crie uma nova secret chamada `DOMAIN` com o valor do seu domínio
3. O workflow usará esse domínio automaticamente na próxima vez que fizer deploy

## URLs da Aplicação

- **Frontend:** `http://agendei.app` ou `http://201.23.17.230`
- **Backend API:** `http://agendei.app/api` ou `http://201.23.17.230/api`
- **Health Check:** `http://agendei.app/api/health`

## Status Atual

```
Versão: 0.0.23
Domínio: agendei.app
IP: 201.23.17.230
Status: ✅ Online
```
