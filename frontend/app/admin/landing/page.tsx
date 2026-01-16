'use client';

import { useState, useEffect } from 'react';
import {
  Palette,
  Upload,
  Globe,
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  Eye,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  MousePointer,
  Link as LinkIcon,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { getAppUrl, API_BASE_URL } from '@/config/api';
import { ApiClient } from '@/services/api';
import { useAuth } from '@/store/auth';

const api = new ApiClient();

interface LandingConfig {
  branding: {
    businessName: string;
    tagline: string;
    description: string;
    logo?: string;
    coverImage?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  schedule: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  cta: {
    mainButton: string;
    secondaryButton: string;
  };
  gallery: string[];
  testimonials: Array<{
    name: string;
    text: string;
    rating: number;
  }>;
}

export default function AdminLandingPage() {
  const { establishment, loadFromStorage } = useAuth();
  const [config, setConfig] = useState<LandingConfig>({
    branding: {
      businessName: 'Seu Estabelecimento',
      tagline: 'Beleza e bem-estar',
      description: 'Oferecemos os melhores serviços de beleza com profissionais qualificados.',
    },
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
    },
    contact: {
      phone: '(11) 99999-9999',
      email: 'contato@exemplo.com',
      address: 'Rua Exemplo, 123 - São Paulo',
    },
    schedule: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true },
    },
    cta: {
      mainButton: 'Agendar Agora',
      secondaryButton: 'Ver Serviços',
    },
    gallery: [],
    testimonials: [
      { name: 'Maria Silva', text: 'Serviço excepcional! Super recomendo.', rating: 5 },
      { name: 'João Santos', text: 'Profissionais qualificados e ambiente agradável.', rating: 5 },
    ],
  });

  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'contact' | 'schedule' | 'cta' | 'gallery'>('branding');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [landingUrl, setLandingUrl] = useState('');
  const [establishmentSlug, setEstablishmentSlug] = useState('');
  const [establishmentName, setEstablishmentName] = useState('');
  const [loadedConfigSlug, setLoadedConfigSlug] = useState('');

  const getStorageKey = (slug: string) => `landing_config_${slug}`;

  const buildLandingUrl = (slug: string) => {
    return getAppUrl(slug);
  };

  // Recupera estabelecimento logado da store
  useEffect(() => {
    loadFromStorage();
    
    if (establishment?.slug) {
      setEstablishmentSlug(establishment.slug);
      setEstablishmentName(establishment.name);
      setLandingUrl(buildLandingUrl(establishment.slug));
      
      // Carregar cores salvas do banco
      loadLandingConfigFromServer(establishment.id);
    }
  }, [establishment, loadFromStorage]);

  const loadLandingConfigFromServer = async (establishmentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/establishments/${establishmentId}/landing-config`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar cores carregadas do servidor
        if (data.primaryColor || data.secondaryColor || data.accentColor) {
          setConfig((prev) => ({
            ...prev,
            colors: {
              primary: data.primaryColor || prev.colors.primary,
              secondary: data.secondaryColor || prev.colors.secondary,
              accent: data.accentColor || prev.colors.accent,
            },
            branding: {
              ...prev.branding,
              businessName: data.name || prev.branding.businessName,
              description: data.bio || prev.branding.description,
              logo: data.logoUrl || prev.branding.logo,
              coverImage: data.bannerUrl || prev.branding.coverImage,
            },
          }));
        }
      }
    } catch (error) {
      console.warn('Falha ao carregar configurações do servidor:', error);
    }
  };

  // Carrega configuração salva (local) quando o slug estiver disponível
  useEffect(() => {
    if (!establishmentSlug || loadedConfigSlug === establishmentSlug) return;
    try {
      const saved = localStorage.getItem(getStorageKey(establishmentSlug));
      if (saved) {
        const parsed = JSON.parse(saved) as LandingConfig;
        setConfig(parsed);
      }
      setLoadedConfigSlug(establishmentSlug);
    } catch (err) {
      console.warn('Falha ao carregar config salva:', err);
    }
  }, [establishmentSlug, loadedConfigSlug]);

  // Se carregarmos o nome depois do estado inicial, sincroniza no branding
  useEffect(() => {
    if (!establishmentName) return;
    setConfig((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        businessName: establishmentName,
      },
    }));
  }, [establishmentName]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar no banco via API
      const response = await fetch(`${API_BASE_URL}/establishments/${establishment?.id}/landing-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.branding.businessName,
          slug: establishmentSlug,
          bio: config.branding.description,
          primaryColor: config.colors.primary,
          secondaryColor: config.colors.secondary,
          accentColor: config.colors.accent,
          logoUrl: config.branding.logo,
          bannerUrl: config.branding.coverImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações');
      }

      // Manter localStorage como backup para preview offline
      if (establishmentSlug) {
        localStorage.setItem(getStorageKey(establishmentSlug), JSON.stringify(config));
      }
      
      console.log('Configurações salvas no banco:', config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = (field: string, value: string) => {
    setConfig({ ...config, branding: { ...config.branding, [field]: value } });
  };

  const updateColors = (field: string, value: string) => {
    setConfig({ ...config, colors: { ...config.colors, [field]: value } });
  };

  const updateContact = (field: string, value: string) => {
    setConfig({ ...config, contact: { ...config.contact, [field]: value } });
  };

  const updateSchedule = (day: keyof typeof config.schedule, field: string, value: string | boolean) => {
    setConfig({
      ...config,
      schedule: {
        ...config.schedule,
        [day]: { ...config.schedule[day], [field]: value },
      },
    });
  };

  const updateCTA = (field: string, value: string) => {
    setConfig({ ...config, cta: { ...config.cta, [field]: value } });
  };

  const handleImageUpload = (field: 'logo' | 'coverImage', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    // Criar URL temporária para preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      setConfig({
        ...config,
        branding: {
          ...config.branding,
          [field]: imageUrl,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setConfig({
          ...config,
          gallery: [...config.gallery, imageUrl],
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setConfig({
      ...config,
      gallery: config.gallery.filter((_, i) => i !== index),
    });
  };

  const weekDays = [
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Landing Page</h1>
          <p className="mt-1 text-sm text-slate-400">Personalize a página pública do seu estabelecimento</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Salvando...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* URL da Landing Page */}
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-500/20 p-3">
            <Globe className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1">URL da sua Landing Page</h3>
            <p className="text-sm text-slate-400 mb-4">
              Compartilhe este link com seus clientes para que eles possam agendar serviços
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3">
                <LinkIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  value={landingUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-slate-300 outline-none"
                />
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </button>
              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Painel de configuração */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'branding', label: 'Marca', icon: Sparkles },
              { id: 'colors', label: 'Cores', icon: Palette },
              { id: 'contact', label: 'Contato', icon: Phone },
              { id: 'schedule', label: 'Horários', icon: Clock },
              { id: 'cta', label: 'Botões', icon: MousePointer },
              { id: 'gallery', label: 'Galeria', icon: ImageIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Conteúdo das tabs */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    Identidade da Marca
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome do Estabelecimento</label>
                  <input
                    type="text"
                    value={config.branding.businessName}
                    onChange={(e) => updateBranding('businessName', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ex: Salão Beleza Pura"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    URL da Landing Page (Slug Customizado)
                    <span className="block text-xs font-normal text-slate-400 mt-1">
                      {landingUrl} 
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={establishmentSlug}
                      onChange={(e) => {
                        const newSlug = e.target.value.toLowerCase().replace(/\s+/g, '-');
                        setEstablishmentSlug(newSlug);
                        setLandingUrl(buildLandingUrl(newSlug));
                      }}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="seu-estabelecimento"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 px-4 py-2.5 text-sm text-slate-300 transition-colors"
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Use apenas letras, números e hífens. Se deixar em branco, usará: {config.branding.businessName.toLowerCase().replace(/\s+/g, '-')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={config.branding.tagline}
                    onChange={(e) => updateBranding('tagline', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ex: Seu estilo, nossa paixão"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                  <textarea
                    rows={4}
                    value={config.branding.description}
                    onChange={(e) => updateBranding('description', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Descreva seu negócio e o que o torna especial..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Logo</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('logo', e)}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </label>
                      {config.branding.logo && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700">
                          <img src={config.branding.logo} alt="Logo" className="w-full h-24 object-contain bg-slate-800/50" />
                          <button
                            onClick={() => updateBranding('logo', '')}
                            className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white rounded p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Imagem de Capa</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="cover-upload"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('coverImage', e)}
                        className="hidden"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Upload Capa
                      </label>
                      {config.branding.coverImage && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700">
                          <img src={config.branding.coverImage} alt="Capa" className="w-full h-24 object-cover" />
                          <button
                            onClick={() => updateBranding('coverImage', '')}
                            className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white rounded p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Botões de Ação</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={config.cta.mainButton}
                      onChange={(e) => updateCTA('mainButton', e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Botão principal"
                    />
                    <input
                      type="text"
                      value={config.cta.secondaryButton}
                      onChange={(e) => updateCTA('secondaryButton', e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Botão secundário"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-400" />
                    Paleta de Cores
                  </h3>
                  <p className="text-sm text-slate-400">Personalize as cores da sua landing page</p>
                </div>

                {[
                  { key: 'primary', label: 'Cor Principal', desc: 'Botões e destaques' },
                  { key: 'secondary', label: 'Cor Secundária', desc: 'Elementos auxiliares' },
                  { key: 'accent', label: 'Cor de Destaque', desc: 'Chamadas especiais' },
                ].map((color) => (
                  <div key={color.key}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{color.label}</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={config.colors[color.key as keyof typeof config.colors]}
                        onChange={(e) => updateColors(color.key, e.target.value)}
                        className="h-16 w-16 rounded-lg cursor-pointer border border-slate-700"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={config.colors[color.key as keyof typeof config.colors]}
                          onChange={(e) => updateColors(color.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="#000000"
                        />
                        <p className="text-xs text-slate-500 mt-1">{color.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-indigo-400" />
                    Informações de Contato
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> Telefone
                    </label>
                    <input
                      type="tel"
                      value={config.contact.phone}
                      onChange={(e) => updateContact('phone', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </label>
                    <input
                      type="email"
                      value={config.contact.email}
                      onChange={(e) => updateContact('email', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="contato@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Endereço
                  </label>
                  <input
                    type="text"
                    value={config.contact.address}
                    onChange={(e) => updateContact('address', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Rua, Número - Cidade, Estado"
                  />
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Redes Sociais</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={config.contact.instagram || ''}
                        onChange={(e) => updateContact('instagram', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="@seuinstagram"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={config.contact.facebook || ''}
                        onChange={(e) => updateContact('facebook', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="facebook.com/seuperfil"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={config.contact.whatsapp || ''}
                        onChange={(e) => updateContact('whatsapp', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-400" />
                    Horário de Funcionamento
                  </h3>
                </div>

                <div className="space-y-3">
                  {weekDays.map((day) => {
                    const schedule = config.schedule[day.key as keyof typeof config.schedule];
                    return (
                      <div key={day.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                        <div className="w-24">
                          <span className="text-sm font-medium text-slate-300">{day.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={schedule.open}
                            onChange={(e) => updateSchedule(day.key as any, 'open', e.target.value)}
                            disabled={schedule.closed}
                            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className="text-slate-500">até</span>
                          <input
                            type="time"
                            value={schedule.close}
                            onChange={(e) => updateSchedule(day.key as any, 'close', e.target.value)}
                            disabled={schedule.closed}
                            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={schedule.closed}
                            onChange={(e) => updateSchedule(day.key as any, 'closed', e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800/50 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className="text-sm text-slate-400">Fechado</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'cta' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-indigo-400" />
                    Botões de Ação
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Botão Principal
                    </label>
                    <input
                      type="text"
                      value={config.cta.mainButton}
                      onChange={(e) => updateCTA('mainButton', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: Agendar Agora"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Botão Secundário
                    </label>
                    <input
                      type="text"
                      value={config.cta.secondaryButton}
                      onChange={(e) => updateCTA('secondaryButton', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: Ver Serviços"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-indigo-400" />
                    Galeria de Fotos
                  </h3>
                  <p className="text-sm text-slate-400">
                    Adicione fotos do seu estabelecimento, equipe e trabalhos realizados
                  </p>
                </div>

                {/* Upload area */}
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
                  <input
                    type="file"
                    id="gallery-upload"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  <label htmlFor="gallery-upload" className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="rounded-full bg-indigo-500/10 p-4">
                      <Upload className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">Arraste fotos ou clique para fazer upload</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB cada</p>
                    </div>
                    <span className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                      Selecionar Fotos
                    </span>
                  </label>
                </div>

                {/* Gallery grid */}
                {config.gallery.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {config.gallery.map((image, i) => (
                      <div 
                        key={i}
                        className="relative aspect-square rounded-lg border border-slate-700 bg-slate-800/30 overflow-hidden group"
                      >
                        <img src={image} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeGalleryImage(i)}
                          className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div 
                        key={i}
                        className="aspect-square rounded-lg border border-slate-700 bg-slate-800/30 flex flex-col items-center justify-center gap-2"
                      >
                        <ImageIcon className="h-6 w-6 text-slate-600" />
                        <span className="text-xs text-slate-500">Vazio</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tips */}
                <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-4">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Dicas para fotos
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>• Use fotos com boa iluminação</li>
                    <li>• Mostre seu espaço e equipe</li>
                    <li>• Inclua fotos de trabalhos realizados</li>
                    <li>• Mantenha qualidade profissional</li>
                    <li>• Atualize regularmente</li>
                  </ul>
                </div>

                {/* Testimonials section */}
                <div className="border-t border-slate-800 pt-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Depoimentos de Clientes
                  </h4>
                  <div className="space-y-3">
                    {config.testimonials.map((testimonial, i) => (
                      <div key={i} className="rounded-lg bg-slate-800/30 p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-300">{testimonial.name}</span>
                          <div className="flex gap-0.5">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <span key={i} className="text-yellow-500">★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{testimonial.text}</p>
                      </div>
                    ))}
                  </div>
                  <button className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                    + Adicionar Depoimento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Eye className="h-4 w-4" />
              Preview em Tempo Real
            </div>
            
            {/* Preview completo da landing page */}
            <div className="rounded-xl border border-slate-800 bg-white overflow-hidden shadow-2xl">
              {/* Hero Section */}
              <div 
                className="relative h-64 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.secondary})` }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border-2 border-white/30">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">{config.branding.businessName}</h1>
                  <p className="text-lg text-white/90 mb-4">{config.branding.tagline}</p>
                  <button
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: config.colors.primary }}
                    className="px-6 py-3 rounded-full text-sm font-bold shadow-xl hover:scale-105 transition-transform"
                  >
                    {config.cta.mainButton}
                  </button>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-6">
                {/* About */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Sobre Nós</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{config.branding.description}</p>
                </div>

                {/* Gallery placeholder */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Nosso Espaço</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden"
                        style={{ backgroundColor: config.colors.primary + '20' }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 opacity-30" style={{ color: config.colors.primary }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services highlights */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Nossos Serviços</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['Corte', 'Coloração', 'Tratamento'].map((service, i) => (
                      <div 
                        key={i}
                        className="p-3 rounded-lg text-center"
                        style={{ backgroundColor: config.colors.primary + '10' }}
                      >
                        <div 
                          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{ backgroundColor: config.colors.primary + '20' }}
                        >
                          <Sparkles className="h-5 w-5" style={{ color: config.colors.primary }} />
                        </div>
                        <p className="text-xs font-medium text-gray-700">{service}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div 
                  className="rounded-lg p-4"
                  style={{ backgroundColor: config.colors.primary + '08' }}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Informações de Contato</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: config.colors.primary + '20' }}
                      >
                        <Phone className="h-3 w-3" style={{ color: config.colors.primary }} />
                      </div>
                      <span>{config.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: config.colors.primary + '20' }}
                      >
                        <Mail className="h-3 w-3" style={{ color: config.colors.primary }} />
                      </div>
                      <span className="truncate">{config.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: config.colors.primary + '20' }}
                      >
                        <MapPin className="h-3 w-3" style={{ color: config.colors.primary }} />
                      </div>
                      <span className="text-xs">{config.contact.address}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: config.colors.primary }} />
                    Horário de Funcionamento
                  </h3>
                  <div className="space-y-1 text-xs">
                    {weekDays.slice(0, 3).map((day) => {
                      const schedule = config.schedule[day.key as keyof typeof config.schedule];
                      return (
                        <div key={day.key} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: config.colors.primary + '05' }}>
                          <span className="font-medium text-gray-700">{day.label}</span>
                          <span className="text-gray-600">
                            {schedule.closed ? 'Fechado' : `${schedule.open} - ${schedule.close}`}
                          </span>
                        </div>
                      );
                    })}
                    <div className="text-center pt-1">
                      <span className="text-[10px] text-gray-400">+ outros dias</span>
                    </div>
                  </div>
                </div>

                {/* Social media */}
                {(config.contact.instagram || config.contact.facebook || config.contact.whatsapp) && (
                  <div className="flex justify-center gap-3">
                    {config.contact.instagram && (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.colors.primary + '15' }}
                      >
                        <Instagram className="h-5 w-5" style={{ color: config.colors.primary }} />
                      </div>
                    )}
                    {config.contact.facebook && (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.colors.primary + '15' }}
                      >
                        <Facebook className="h-5 w-5" style={{ color: config.colors.primary }} />
                      </div>
                    )}
                    {config.contact.whatsapp && (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.colors.primary + '15' }}
                      >
                        <Phone className="h-5 w-5" style={{ color: config.colors.primary }} />
                      </div>
                    )}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    style={{ backgroundColor: config.colors.primary }}
                    className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform"
                  >
                    {config.cta.mainButton}
                  </button>
                  <button
                    style={{ 
                      borderColor: config.colors.primary, 
                      color: config.colors.primary,
                      backgroundColor: 'white'
                    }}
                    className="w-full rounded-lg border-2 px-4 py-3 text-sm font-semibold hover:scale-105 transition-transform"
                  >
                    {config.cta.secondaryButton}
                  </button>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                    <Globe className="h-3 w-3" />
                    <span className="font-mono">seudominio.agendei.com</span>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 mt-1">
                    Powered by Agendei
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Dicas de Design
              </h4>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>• Use cores que representem sua marca</li>
                <li>• Adicione fotos reais do seu espaço</li>
                <li>• Mantenha informações atualizadas</li>
                <li>• Destaque seus diferenciais</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
