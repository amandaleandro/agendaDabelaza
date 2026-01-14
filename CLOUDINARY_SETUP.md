# Upload de Imagens - Cloudinary

## ✅ O que foi implementado

Sistema completo de upload de imagens para:
- 🖼️ **Logo** do estabelecimento (máx. 5MB)
- 🎨 **Banner** da landing page (máx. 10MB)
- 📸 **Galeria** de imagens (até 20 arquivos, máx. 10MB cada)
- 🌄 **Imagens genéricas** (máx. 10MB)

## 🚀 Como Configurar o Cloudinary

### 1. Criar Conta Gratuita

1. Acesse: https://cloudinary.com/users/register/free
2. Crie uma conta (gratuita)
3. Confirme o email
4. Faça login no dashboard

### 2. Obter as Credenciais

No dashboard do Cloudinary, copie:
- **Cloud Name** (visível no topo)
- **API Key** (em Account Settings → API Keys)
- **API Secret** (em Account Settings → API Keys)

### 3. Configurar no Backend

Crie arquivo `.env` no diretório `backend/`:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME="seu_cloud_name"
CLOUDINARY_API_KEY="seu_api_key"
CLOUDINARY_API_SECRET="seu_api_secret"
```

### 4. Instalar Dependências

```bash
cd backend
npm install cloudinary

# Ou se estiver usando yarn
yarn add cloudinary
```

### 5. Rodar a Aplicação

```bash
docker-compose down
docker-compose up -d --build
```

## 📡 Endpoints de Upload

### Upload de Logo
```bash
POST /api/uploads/logo
Content-Type: multipart/form-data

{
  "file": <arquivo>
}

# Resposta:
{
  "success": true,
  "url": "https://res.cloudinary.com/.../logo.jpg",
  "publicId": "agendei/logos/..."
}
```

### Upload de Banner
```bash
POST /api/uploads/banner
Content-Type: multipart/form-data

{
  "file": <arquivo>
}
```

### Upload de Galeria (múltiplos)
```bash
POST /api/uploads/gallery
Content-Type: multipart/form-data

{
  "files": [<arquivo1>, <arquivo2>, ...]
}

# Resposta:
{
  "success": true,
  "images": [
    { "url": "...", "publicId": "..." },
    { "url": "...", "publicId": "..." }
  ]
}
```

### Upload Genérico
```bash
POST /api/uploads/image
Content-Type: multipart/form-data

{
  "file": <arquivo>
}
```

## 💻 Como Usar no Frontend

### Exemplo 1: Upload de Logo

```typescript
import { ApiClient } from '@/services/api';

const api = new ApiClient();

const handleLogoUpload = async (file: File) => {
  try {
    const result = await api.uploadLogo(file);
    console.log('Logo salvo:', result.url);
    
    // Salvar URL no banco
    await api.updateEstablishment(establishmentId, {
      logoUrl: result.url
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
  }
};
```

### Exemplo 2: Upload de Banner

```typescript
const handleBannerUpload = async (file: File) => {
  const result = await api.uploadBanner(file);
  await api.updateEstablishment(establishmentId, {
    bannerUrl: result.url
  });
};
```

### Exemplo 3: Upload de Galeria

```typescript
const handleGalleryUpload = async (files: File[]) => {
  const images = await api.uploadGallery(files);
  console.log('Imagens salvas:', images);
  
  // Salvar URLs no banco
  const imageUrls = images.map(img => img.url);
  await api.saveGallery(establishmentId, imageUrls);
};
```

## 🎯 Integração com Admin Landing Page

A página `/admin/landing` já está preparada para fazer uploads de imagens. Quando você clica em "Upload" de logo ou banner:

1. **Frontend** → Faz upload para Cloudinary via `/api/uploads/logo` ou `/api/uploads/banner`
2. **Backend** → Cloudinary retorna a URL
3. **Frontend** → Recebe a URL e a exibe no preview
4. **Admin clica "Salvar"** → URL é salva no banco de dados via `PUT /api/establishments/:id/landing-config`
5. **Landing pública** → Busca a URL do banco e exibe a imagem

## 📋 Limites Cloudinary (Plano Gratuito)

- **Storage:** 25 GB
- **Bandwidth:** 25 GB/mês
- **Transformações ilimitadas**
- **API calls:** Ilimitado
- **Usuários:** 1 usuário

## 🔒 Segurança

- API Secret é armazenado apenas no backend
- Frontend usa endpoints públicos do backend para upload
- Cloudinary é um serviço confiável e certificado

## 🆘 Troubleshooting

### Erro: "CLOUDINARY_CLOUD_NAME is not defined"
- ✅ Verifique se as variáveis de ambiente estão corretas
- ✅ Reinicie o container do backend

### Erro 401 Unauthorized
- ✅ Verifique API Key e API Secret
- ✅ Certifique-se que estão copiados corretamente

### Arquivo muito grande
- ✅ Logo: máximo 5MB
- ✅ Banner: máximo 10MB
- ✅ Galeria: máximo 10MB por arquivo

## 📚 Documentação

- Cloudinary: https://cloudinary.com/documentation
- NestJS Multer: https://docs.nestjs.com/techniques/file-upload
- API Reference: https://cloudinary.com/documentation/image_upload_api_reference

## ✨ Próximos Passos

Após configurar, você pode:
1. ✅ Fazer upload de logo no `/admin/landing`
2. ✅ Fazer upload de banner no `/admin/landing`
3. ✅ Fazer upload de galeria de fotos
4. ✅ As imagens aparecem automaticamente na landing page pública
