import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/config/api';

interface UseEstablishmentThemeParams {
  slug?: string | null;
  initialPrimary?: string | null;
  initialSecondary?: string | null;
  persistSlug?: boolean;
  fallbackToStoredSlug?: boolean;
  fetchIfMissing?: boolean;
  defaultPrimary?: string;
  defaultSecondary?: string;
}

interface EstablishmentResponse {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export function useEstablishmentTheme({
  slug,
  initialPrimary,
  initialSecondary,
  persistSlug = false,
  fallbackToStoredSlug = false,
  fetchIfMissing = true,
  defaultPrimary = '#7c3aed',
  defaultSecondary = '#2563eb',
}: UseEstablishmentThemeParams) {
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(slug ?? null);
  const [primary, setPrimary] = useState<string>(initialPrimary || defaultPrimary);
  const [secondary, setSecondary] = useState<string>(initialSecondary || defaultSecondary);
  const [hasFetched, setHasFetched] = useState(false);

  // Helper to convert hex to rgba
  const hexToRgba = useMemo(
    () =>
      (hex: string, alpha = 1) => {
        const h = String(hex || '').replace('#', '');
        const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
        const bigint = parseInt(full || '000000', 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      },
    [],
  );

  // Gradient helper
  const gradient = useMemo(
    () => (direction: string = '90deg', alphaPrimary = 1, alphaSecondary = 1) =>
      `linear-gradient(${direction}, ${hexToRgba(primary, alphaPrimary)}, ${hexToRgba(secondary, alphaSecondary)})`,
    [hexToRgba, primary, secondary],
  );

  // Persist slug if requested
  useEffect(() => {
    if (!persistSlug || !resolvedSlug || typeof window === 'undefined') return;
    try {
      localStorage.setItem('establishmentSlug', resolvedSlug);
    } catch {
      /* ignore */
    }
  }, [persistSlug, resolvedSlug]);

  // Fallback to stored slug when none is provided
  useEffect(() => {
    if (resolvedSlug || !fallbackToStoredSlug || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('establishmentSlug');
      if (stored) setResolvedSlug(stored);
    } catch {
      /* ignore */
    }
  }, [resolvedSlug, fallbackToStoredSlug]);

  // Sync initial colors when they change
  useEffect(() => {
    if (initialPrimary) setPrimary(initialPrimary);
  }, [initialPrimary]);

  useEffect(() => {
    if (initialSecondary) setSecondary(initialSecondary);
  }, [initialSecondary]);

  // Fetch colors if missing
  useEffect(() => {
    const shouldFetch =
      fetchIfMissing &&
      !hasFetched &&
      resolvedSlug &&
      !initialPrimary &&
      !initialSecondary;

    if (!shouldFetch) return;

    const fetchColors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/establishments/${resolvedSlug}`);
        if (!res.ok) return;
        const data = (await res.json()) as EstablishmentResponse;
        if (data?.primaryColor) setPrimary(data.primaryColor);
        if (data?.secondaryColor) setSecondary(data.secondaryColor);
      } catch {
        // ignore fetch errors, keep defaults
      } finally {
        setHasFetched(true);
      }
    };

    fetchColors();
  }, [fetchIfMissing, hasFetched, initialPrimary, initialSecondary, resolvedSlug]);

  return {
    resolvedSlug,
    primary,
    secondary,
    hexToRgba,
    gradient,
    setPrimary,
    setSecondary,
  };
}
