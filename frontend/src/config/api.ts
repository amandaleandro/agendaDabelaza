/**
 * API Configuration
 * Centralized API URL management for the entire application
 */

const DEFAULT_API_URL = '/api';
const DEFAULT_APP_URL = 'http://localhost:3002';

export const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
    : process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

export const APP_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
    : process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

/**
 * Build public app URL for a slug (e.g., for establishment landing page)
 * @param slug The establishment slug or path segment
 * @returns Full public URL for the slug
 */
export const getAppUrl = (slug?: string): string => {
  try {
    const parsed = new URL(APP_URL);
    // Usamos apenas origin para evitar caminhos como "/admin"
    const base = `${parsed.protocol}//${parsed.host}`;
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
    if (!slug) return normalized;
    return `${normalized}/${slug}`;
  } catch {
    const fallback = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
    if (!slug) return fallback;
    return `${fallback}/${slug}`;
  }
};

/**
 * Helper function to build full API URLs
 * @param endpoint API endpoint path (e.g., '/users', '/appointments/123')
 * @returns Full URL ready for fetch or axios calls
 */
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) {
    return endpoint; // Already a full URL
  }
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
};

/**
 * Fetch wrapper with automatic URL building
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Fetch response
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(endpoint), options);
}
