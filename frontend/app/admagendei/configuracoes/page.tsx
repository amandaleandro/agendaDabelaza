'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Key,
  Code,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

export default function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [emailSettings, setEmailSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [platform, system, email] = await Promise.all([
        api.getPlatformSettings(),
        api.getSystemSettings(),
        api.getEmailSettings(),
      ]);
      
      setPlatformSettings(platform);
      setSystemSettings(system);
      setEmailSettings(email);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updatePlatformSettings({
        ...platformSettings,
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-500/10">
              <Settings className="h-8 w-8 text-slate-400" />
            </div>
            Configurações do Sistema
          </h1>
          <p className="text-slate-400 mt-2">Configure aspectos globais da plataforma</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
        >
          {saving ? (
            <>
              <Zap className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* Maintenance Mode Alert */}
      {platformSettings?.features?.maintenanceMode && (
        <div className="rounded-xl border border-amber-800 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400">Modo de Manutenção Ativo</p>
            <p className="text-sm text-amber-400/80 mt-1">
              A plataforma está em modo de manutenção. Apenas administradores podem acessar o sistema.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Gerais */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Informações Gerais
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Nome do Site
              </label>
              <input
                type="text"
                value={platformSettings?.siteName || ''}
                onChange={(e) => setPlatformSettings({...platformSettings, siteName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                URL Principal
              </label>
              <input
                type="url"
                value={platformSettings?.siteUrl || ''}
                disabled
                className="w-full bg-slate-900 border border-slate-700 text-slate-500 px-4 py-3 rounded-xl cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">Configurado automaticamente</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email de Suporte
              </label>
              <input
                type="email"
                value={platformSettings?.supportEmail || ''}
                onChange={(e) => setPlatformSettings({...platformSettings, supportEmail: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Informações do Sistema
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Versão</p>
              <p className="text-xl font-bold text-white">{systemSettings?.version || 'N/A'}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Ambiente</p>
              <p className="text-xl font-bold text-white uppercase">{systemSettings?.environment || 'N/A'}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Banco de Dados</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <p className="text-white font-semibold">{systemSettings?.database?.type || 'PostgreSQL'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            Configuração de Email
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Provedor</p>
              <p className="text-lg font-bold text-white uppercase">{emailSettings?.provider || 'SENDGRID'}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Email Remetente</p>
              <p className="text-sm text-white break-all">{emailSettings?.fromEmail || 'N/A'}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${emailSettings?.enabled ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <p className="text-white font-semibold">{emailSettings?.enabled ? 'Conectado' : 'Desconectado'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm font-semibold text-slate-300 mb-3">Templates Disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {emailSettings?.templates && Object.entries(emailSettings.templates).map(([key, enabled]: [string, any]) => (
                <span key={key} className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {key}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Estatísticas da Plataforma
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Estabelecimentos</p>
              <p className="text-3xl font-bold text-white">{systemSettings?.statistics?.totalEstablishments || 0}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Usuários</p>
              <p className="text-3xl font-bold text-white">{systemSettings?.statistics?.totalUsers || 0}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Agendamentos</p>
              <p className="text-3xl font-bold text-white">{systemSettings?.statistics?.totalAppointments || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
