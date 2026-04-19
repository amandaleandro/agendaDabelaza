'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { ApiClient } from '@/services/api';

const api = new ApiClient();

type PeriodFilter = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH';

export default function WhatsAppMetricsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('LAST_30_DAYS');

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const data = await api.getWhatsAppHistory();
      setHistory(data);
    } catch (error) {
      console.error('Erro ao carregar métricas do WhatsApp:', error);
    } finally {
      setLoading(false);
      if (!silent) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    const now = new Date();

    return history.filter((item) => {
      const sendAt = new Date(item.sendAt);

      if (period === 'LAST_7_DAYS') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return sendAt >= start;
      }

      if (period === 'LAST_30_DAYS') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return sendAt >= start;
      }

      return (
        sendAt.getMonth() === now.getMonth() &&
        sendAt.getFullYear() === now.getFullYear()
      );
    });
  }, [history, period]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, { date: string; confirmations: number; reschedules: number; autoCancelled: number }>();

    for (const item of filteredHistory) {
      const key = new Date(item.sendAt).toISOString().split('T')[0];
      const current = map.get(key) || {
        date: key,
        confirmations: 0,
        reschedules: 0,
        autoCancelled: 0,
      };

      if (item.status === 'CONFIRMED') {
        current.confirmations += 1;
      }
      if (item.status === 'RESCHEDULED') {
        current.reschedules += 1;
      }
      if (item.status === 'AUTO_CANCELLED') {
        current.autoCancelled += 1;
      }

      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHistory]);

  const totals = useMemo(() => {
    const confirmations = filteredHistory.filter((item) => item.status === 'CONFIRMED').length;
    const reschedules = filteredHistory.filter((item) => item.status === 'RESCHEDULED').length;
    const autoCancelled = filteredHistory.filter((item) => item.status === 'AUTO_CANCELLED').length;
    const sent = filteredHistory.filter((item) => item.sentAt).length;

    return {
      confirmations,
      reschedules,
      autoCancelled,
      sent,
    };
  }, [filteredHistory]);

  const maxBarValue = Math.max(
    1,
    ...groupedByDay.map((item) =>
      Math.max(item.confirmations, item.reschedules, item.autoCancelled),
    ),
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-sky-500" />
          <p className="text-slate-400">Carregando métricas do WhatsApp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/whatsapp"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Métricas do WhatsApp
            </h1>
          </div>
          <p className="mt-2 text-slate-400">
            Acompanhe conversão de lembretes em confirmações, remarcações e cancelamentos automáticos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-slate-500"
          >
            <option value="LAST_7_DAYS">Últimos 7 dias</option>
            <option value="LAST_30_DAYS">Últimos 30 dias</option>
            <option value="THIS_MONTH">Este mês</option>
          </select>

          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Eventos enviados</span>
            <BarChart3 className="h-5 w-5 text-slate-300" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totals.sent}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-300">Confirmações</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totals.confirmations}</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-sky-300">Remarcações</span>
            <RotateCcw className="h-5 w-5 text-sky-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totals.reschedules}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-300">Auto-cancelamentos</span>
            <XCircle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totals.autoCancelled}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-slate-700/50 p-3">
            <CalendarDays className="h-6 w-6 text-slate-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Evolução diária</h2>
            <p className="text-sm text-slate-400">
              Leitura por dia do impacto dos lembretes enviados no período selecionado.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {groupedByDay.map((item) => (
            <div key={item.date} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-white">
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-slate-500">{item.date}</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Confirmações', value: item.confirmations, color: 'bg-emerald-400' },
                  { label: 'Remarcações', value: item.reschedules, color: 'bg-sky-400' },
                  { label: 'Auto-cancelamentos', value: item.autoCancelled, color: 'bg-amber-400' },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{bar.label}</span>
                      <span className="text-slate-500">{bar.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className={`h-2 rounded-full ${bar.color}`}
                        style={{ width: `${(bar.value / maxBarValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groupedByDay.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-slate-500">
              Nenhum dado encontrado para o período selecionado.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
