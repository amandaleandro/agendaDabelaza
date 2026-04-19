'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  CalendarDays,
  QrCode,
  RefreshCw,
  Send,
  Smartphone,
  Unplug,
  History,
  Download,
  BarChart3,
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

type WhatsAppStatus = {
  enabled: boolean;
  connected: boolean;
  connectedJid: string | null;
  authPath: string;
  hasQr: boolean;
  lastQr: string | null;
  reminderWorkerRunning: boolean;
};

export default function AdminWhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState<number | null>(null);
  const [syncingScope, setSyncingScope] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    scanned: number;
    created: number;
    scope: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState('ALL');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState(
    'Mensagem de teste enviada pela central de WhatsApp.',
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const syncQrCode = useCallback(async (nextStatus: WhatsAppStatus | null) => {
    if (!nextStatus?.lastQr) {
      setQrDataUrl(null);
      return;
    }

    try {
      const url = await QRCode.toDataURL(nextStatus.lastQr, {
        margin: 1,
        width: 280,
        color: {
          dark: '#0f172a',
          light: '#f8fafc',
        },
      });
      setQrDataUrl(url);
    } catch (qrError) {
      console.error('Erro ao gerar QR Code do WhatsApp:', qrError);
      setQrDataUrl(null);
    }
  }, []);

  const loadStatus = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!silent) {
        setRefreshing(true);
      }

      try {
        setError(null);
        const data = await api.getWhatsAppStatus();
        setStatus(data);
        await syncQrCode(data);
      } catch (loadError: any) {
        console.error('Erro ao carregar status do WhatsApp:', loadError);
        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            'Nao foi possivel carregar o status do WhatsApp.',
        );
      } finally {
        setLoading(false);
        if (!silent) {
          setRefreshing(false);
        }
      }
    },
    [syncQrCode],
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getWhatsAppHistory();
      setHistory(data);
    } catch (historyError: any) {
      console.error('Erro ao carregar historico do WhatsApp:', historyError);
      setError(
        historyError?.response?.data?.message ||
          historyError?.message ||
          'Nao foi possivel carregar o historico de lembretes.',
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    void loadHistory();
  }, [loadHistory, loadStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadStatus({ silent: true });
      void loadHistory();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadHistory, loadStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    setProcessedCount(null);
    setSyncResult(null);
    try {
      setError(null);
      const data = await api.connectWhatsApp();
      setStatus(data);
      await syncQrCode(data);
    } catch (connectError: any) {
      console.error('Erro ao conectar WhatsApp:', connectError);
      setError(
        connectError?.response?.data?.message ||
          connectError?.message ||
          'Nao foi possivel iniciar a conexao com o WhatsApp.',
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleProcessReminders = async () => {
    setProcessing(true);
    try {
      setError(null);
      setSyncResult(null);
      const data = await api.processWhatsAppReminders();
      setProcessedCount(data?.processed ?? 0);
      await loadStatus({ silent: true });
      await loadHistory();
    } catch (processError: any) {
      console.error('Erro ao processar lembretes:', processError);
      setError(
        processError?.response?.data?.message ||
          processError?.message ||
          'Nao foi possivel processar os lembretes agora.',
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSyncReminders = async (scope: 'DAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    setSyncingScope(scope);
    try {
      setError(null);
      setProcessedCount(null);
      const data = await api.syncWhatsAppReminders(scope);
      setSyncResult(data);
      await loadStatus({ silent: true });
      await loadHistory();
    } catch (syncError: any) {
      console.error('Erro ao sincronizar lembretes:', syncError);
      setError(
        syncError?.response?.data?.message ||
          syncError?.message ||
          'Nao foi possivel sincronizar os lembretes dos agendamentos.',
      );
    } finally {
      setSyncingScope(null);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      setError(null);
      const data = await api.disconnectWhatsApp();
      setStatus(data);
      setQrDataUrl(null);
    } catch (disconnectError: any) {
      console.error('Erro ao desconectar WhatsApp:', disconnectError);
      setError(
        disconnectError?.response?.data?.message ||
          disconnectError?.message ||
          'Nao foi possivel desconectar o WhatsApp.',
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTestMessage = async () => {
    setSendingTest(true);
    setTestSuccess(null);
    try {
      setError(null);
      await api.sendWhatsAppTestMessage({
        phone: testPhone,
        message: testMessage,
      });
      setTestSuccess(`Mensagem de teste enviada para ${testPhone}.`);
    } catch (sendError: any) {
      console.error('Erro ao enviar mensagem de teste:', sendError);
      setError(
        sendError?.response?.data?.message ||
          sendError?.message ||
          'Nao foi possivel enviar a mensagem de teste.',
      );
    } finally {
      setSendingTest(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const now = new Date();

    return history.filter((item) => {
      const sendAt = new Date(item.sendAt);
      const matchesStatus =
        historyStatusFilter === 'ALL' || item.status === historyStatusFilter;
      const matchesType =
        historyTypeFilter === 'ALL' || item.type === historyTypeFilter;

      let matchesPeriod = true;
      if (historyPeriodFilter === 'LAST_7_DAYS') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        matchesPeriod = sendAt >= start;
      } else if (historyPeriodFilter === 'LAST_30_DAYS') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        matchesPeriod = sendAt >= start;
      } else if (historyPeriodFilter === 'THIS_MONTH') {
        matchesPeriod =
          sendAt.getMonth() === now.getMonth() &&
          sendAt.getFullYear() === now.getFullYear();
      }

      return matchesStatus && matchesType && matchesPeriod;
    });
  }, [history, historyPeriodFilter, historyStatusFilter, historyTypeFilter]);

  const metrics = {
    total: history.length,
    confirmed: history.filter((item) => item.status === 'CONFIRMED').length,
    rescheduled: history.filter((item) => item.status === 'RESCHEDULED').length,
    autoCancelled: history.filter((item) => item.status === 'AUTO_CANCELLED')
      .length,
  };

  const historyStatuses = Array.from(
    new Set(history.map((item) => item.status)),
  ).sort();
  const historyTypes = Array.from(new Set(history.map((item) => item.type))).sort();

  const handleExportCsv = () => {
    const headers = [
      'Tipo',
      'Status',
      'Cliente',
      'Telefone',
      'Estabelecimento',
      'Profissional',
      'Servico',
      'Agendamento',
      'Envio',
      'EnviadoEm',
      'Tentativas',
      'Erro',
    ];

    const rows = filteredHistory.map((item) => [
      item.type,
      item.status,
      item.appointment.clientName,
      item.recipientPhone,
      item.appointment.establishmentName,
      item.appointment.professionalName,
      item.appointment.serviceName,
      new Date(item.appointment.scheduledAt).toLocaleString('pt-BR'),
      new Date(item.sendAt).toLocaleString('pt-BR'),
      item.sentAt ? new Date(item.sentAt).toLocaleString('pt-BR') : '',
      item.attempts ?? '',
      item.errorMessage || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whatsapp-historico.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const connectionLabel = !status
    ? 'Carregando'
    : !status.enabled
      ? 'Desativado'
      : status.connected
        ? 'Conectado'
        : status.hasQr
          ? 'Aguardando leitura'
          : 'Desconectado';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
          <p className="text-slate-400">Carregando painel do WhatsApp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">WhatsApp</h1>
          <p className="mt-1 text-slate-400">
            Conecte o numero do estabelecimento e acompanhe o envio de confirmacoes e lembretes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadStatus()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <Link
            href="/admin/whatsapp/metricas"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            Ver metricas
          </Link>

          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || !status?.enabled}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-800/60"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            Conectar WhatsApp
          </button>

          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting || !status?.connected}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unplug className="h-4 w-4" />
            )}
            Desconectar
          </button>

          <button
            type="button"
            onClick={handleProcessReminders}
            disabled={processing || !status?.enabled}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-800/60"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Processar lembretes
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
            <div>
              <p className="font-semibold text-red-300">Erro no WhatsApp</p>
              <p className="mt-1 text-sm text-red-200/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!status?.enabled && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Unplug className="mt-0.5 h-5 w-5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Integracao desativada no backend</p>
              <p className="mt-1 text-sm text-amber-200/80">
                Ative a variavel <code className="rounded bg-slate-900/70 px-1.5 py-0.5 text-xs">WHATSAPP_BAILEYS_ENABLED=true</code> para permitir a conexao deste numero.
              </p>
            </div>
          </div>
        </div>
      )}

      {processedCount !== null && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-300">Lembretes processados</p>
              <p className="mt-1 text-sm text-emerald-200/80">
                {processedCount} lembrete(s) enviados nesta execucao manual.
              </p>
            </div>
          </div>
        </div>
      )}

      {syncResult && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-sky-400" />
            <div>
              <p className="font-semibold text-sky-300">Sincronizacao concluida</p>
              <p className="mt-1 text-sm text-sky-200/80">
                Escopo {syncResult.scope}: {syncResult.scanned} agendamento(s) verificados e {syncResult.created} lembrete(s) criado(s).
              </p>
            </div>
          </div>
        </div>
      )}

      {testSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-300">Teste enviado</p>
              <p className="mt-1 text-sm text-emerald-200/80">{testSuccess}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Conexao</span>
            <Smartphone className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{connectionLabel}</p>
          <p className="mt-2 text-sm text-slate-500">
            {status?.connected
              ? 'Numero pronto para enviar mensagens.'
              : 'Conecte o WhatsApp do estabelecimento para liberar os envios.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Numero conectado</span>
            <MessageCircle className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="break-all text-lg font-bold text-white">
            {status?.connectedJid || 'Nenhum numero conectado'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            O backend usa este WhatsApp para confirmacoes e lembretes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Worker de lembretes</span>
            <Send className="h-5 w-5 text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {status?.reminderWorkerRunning ? 'Ativo' : 'Parado'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Responsavel por disparar os lembretes agendados.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Sessao</span>
            <QrCode className="h-5 w-5 text-orange-400" />
          </div>
          <p className="break-all text-sm font-semibold text-white">
            {status?.authPath || 'Nao informado'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Pasta local onde a autenticacao do WhatsApp fica salva.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5">
          <p className="text-sm text-slate-400">Eventos no historico</p>
          <p className="mt-2 text-3xl font-bold text-white">{metrics.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm text-emerald-300">Confirmacoes</p>
          <p className="mt-2 text-3xl font-bold text-white">{metrics.confirmed}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
          <p className="text-sm text-sky-300">Remarcacoes</p>
          <p className="mt-2 text-3xl font-bold text-white">{metrics.rescheduled}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-sm text-amber-300">Auto-cancelamentos</p>
          <p className="mt-2 text-3xl font-bold text-white">{metrics.autoCancelled}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <QrCode className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">QR Code de conexao</h2>
              <p className="text-sm text-slate-400">
                Gere o QR e escaneie com o WhatsApp do estabelecimento.
              </p>
            </div>
          </div>

          {status?.connected ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
              <p className="text-lg font-semibold text-emerald-300">WhatsApp conectado com sucesso</p>
              <p className="mt-2 text-sm text-emerald-200/80">
                O numero atual ja pode enviar confirmacoes e lembretes automaticamente.
              </p>
            </div>
          ) : status?.hasQr && qrDataUrl ? (
            <div className="space-y-4">
              <div className="inline-flex rounded-2xl bg-slate-50 p-4 shadow-lg shadow-black/20">
                <img
                  src={qrDataUrl}
                  alt="QR Code para conectar o WhatsApp"
                  className="h-[280px] w-[280px] rounded-lg"
                />
              </div>
              <p className="text-sm text-slate-400">
                Se o QR expirar, clique em <strong className="text-white">Conectar WhatsApp</strong> novamente para gerar um novo.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
              <QrCode className="mx-auto mb-3 h-12 w-12 text-slate-500" />
              <p className="text-lg font-semibold text-white">Nenhum QR disponivel no momento</p>
              <p className="mt-2 text-sm text-slate-400">
                Clique em conectar para iniciar a autenticacao do numero.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">Como conectar</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="font-semibold text-white">1. Inicie a conexao</p>
                <p className="mt-1 text-slate-400">Clique no botao “Conectar WhatsApp” para o backend gerar a sessao e o QR.</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="font-semibold text-white">2. Escaneie com o celular</p>
                <p className="mt-1 text-slate-400">No WhatsApp do estabelecimento, abra Dispositivos conectados e escaneie o QR exibido aqui.</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="font-semibold text-white">3. Valide o status</p>
                <p className="mt-1 text-slate-400">Assim que conectar, esta tela passa a mostrar o numero ativo e o QR some.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">Observacoes</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>As mensagens so saem se o backend estiver com a integracao Baileys habilitada.</li>
              <li>O agendamento continua sendo criado mesmo se a notificacao falhar.</li>
              <li>Os lembretes sao processados automaticamente pelo worker e tambem podem ser disparados manualmente aqui.</li>
              <li>Quando o cliente responde "nao vou", "nao consigo ir" ou "quero remarcar", o fluxo agora tenta cancelar ou remarcar automaticamente e envia confirmacao.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">Varredura de agendamentos</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use estes botoes para validar os agendamentos futuros e gerar lembretes de mes, semana, dia e horas conforme o periodo escolhido.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { scope: 'DAY', label: 'Proximo dia' },
                { scope: 'WEEK', label: 'Proxima semana' },
                { scope: 'MONTH', label: 'Proximo mes' },
                { scope: 'ALL', label: 'Tudo' },
              ].map((item) => (
                <button
                  key={item.scope}
                  type="button"
                  onClick={() => handleSyncReminders(item.scope as 'DAY' | 'WEEK' | 'MONTH' | 'ALL')}
                  disabled={syncingScope !== null || !status?.enabled}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {syncingScope === item.scope ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarDays className="h-4 w-4" />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">Mensagem de teste</h2>
            <p className="mt-2 text-sm text-slate-400">
              Envie uma mensagem manual para validar se o numero conectado esta respondendo normalmente.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5511999999999"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
              />
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
              />
              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={sendingTest || !status?.connected || !testPhone.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-fuchsia-900/50"
              >
                {sendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar teste
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-700/50 p-3">
              <History className="h-6 w-6 text-slate-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Historico de lembretes</h2>
              <p className="text-sm text-slate-400">
                Confirmacoes, lembretes enviados, remarcacoes e cancelamentos automaticos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredHistory.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={historyLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
            Atualizar historico
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
          >
            <option value="ALL">Todos os status</option>
            {historyStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={historyTypeFilter}
            onChange={(e) => setHistoryTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
          >
            <option value="ALL">Todos os tipos</option>
            {historyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={historyPeriodFilter}
            onChange={(e) => setHistoryPeriodFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
          >
            <option value="ALL">Todo o periodo</option>
            <option value="LAST_7_DAYS">Ultimos 7 dias</option>
            <option value="LAST_30_DAYS">Ultimos 30 dias</option>
            <option value="THIS_MONTH">Este mes</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Agendamento</th>
                <th className="px-3 py-3 font-medium">Envio</th>
                <th className="px-3 py-3 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-b border-slate-900/80 text-slate-200">
                  <td className="px-3 py-3">{item.type}</td>
                  <td className="px-3 py-3">{item.status}</td>
                  <td className="px-3 py-3">
                    <div>{item.appointment.clientName}</div>
                    <div className="text-xs text-slate-500">{item.recipientPhone}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{item.appointment.serviceName}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.appointment.scheduledAt).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{new Date(item.sendAt).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-slate-500">
                      {item.sentAt ? `Enviado em ${new Date(item.sentAt).toLocaleString('pt-BR')}` : 'Ainda nao enviado'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {item.errorMessage || '-'}
                  </td>
                </tr>
              ))}
              {!historyLoading && filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
